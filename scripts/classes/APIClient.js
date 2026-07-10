/**
 * API Client Class
 * Handles all API communications for the Claude AI Chatbot Clone
 * Updated for GitHub DeepSeek API with correct URL and model names
 */

import { getConfig, getProviderConfig } from '../config.js';
import { estimateTokenCount } from '../utils/helpers.js';

/**
 * APIClient - Manages API communications
 */
export class APIClient {
    constructor() {
        this.config = getConfig();
        this.abortController = null;
        this.isStreaming = false;
    }
    
    /**
     * Update configuration
     */
    updateConfig() {
        this.config = getConfig();
    }
    
    /**
     * Get current API configuration
     * @returns {Object} API configuration
     */
    getApiConfig() {
        return this.config.api;
    }
    
    /**
     * Check if API is configured
     * @returns {boolean} Is configured
     */
    isConfigured() {
        return !!(this.config.api.url && (this.config.api.key || this.config.api.provider === 'github'));
    }
    
    /**
     * Get API headers based on provider
     * @returns {Object} Headers object
     */
    getHeaders() {
        const providerConfig = getProviderConfig(this.config.api.provider);
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header based on provider
        if (this.config.api.key) {
            // GitHub uses 'token' prefix for Personal Access Tokens
            if (this.config.api.provider === 'github' || 
                this.config.api.provider === 'deepseek' ||
                this.config.api.url.includes('githubai.com')) {
                headers['Authorization'] = `token ${this.config.api.key}`;
            } else {
                // Most other APIs use Bearer token
                headers['Authorization'] = `Bearer ${this.config.api.key}`;
            }
        }
        
        // GitHub specific headers
        if (this.config.api.provider === 'github' || 
            this.config.api.provider === 'deepseek' ||
            this.config.api.url.includes('githubai.com')) {
            headers['Accept'] = 'application/json';
            headers['X-GitHub-Api-Version'] = '2022-11-28';
        }
        
        return headers;
    }
    
    /**
     * Build request body for chat completion based on provider
     * @param {Array} messages - Array of message objects
     * @returns {Object} Request body
     */
    buildRequestBody(messages) {
        const providerConfig = getProviderConfig(this.config.api.provider);
        const requestFormat = providerConfig.requestFormat || 'openai';
        
        // Common fields
        const baseRequest = {
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            temperature: this.config.settings.temperature,
            max_tokens: this.config.settings.maxTokens,
            stream: this.config.settings.enableStreaming
        };
        
        // Add model if specified
        if (this.config.api.model) {
            baseRequest.model = this.config.api.model;
        }
        
        // Provider-specific adjustments
        const provider = this.config.api.provider || this.detectProviderFromUrl();
        
        if (provider === 'github' || provider === 'deepseek' || this.config.api.url.includes('githubai.com')) {
            // GitHub DeepSeek API - ensure correct model
            if (!baseRequest.model || !['deepseek-chat', 'deepseek-coder'].includes(baseRequest.model)) {
                baseRequest.model = 'deepseek-chat';
            }
        } else if (provider === 'mistral') {
            baseRequest.model = this.config.api.model || 'mistral-tiny';
        } else if (provider === 'openai') {
            baseRequest.model = this.config.api.model || 'gpt-3.5-turbo';
        } else if (provider === 'groq') {
            baseRequest.model = this.config.api.model || 'llama3-8b-instant';
        }
        
        return baseRequest;
    }
    
    /**
     * Detect provider from URL
     * @returns {string} Provider name
     */
    detectProviderFromUrl() {
        const url = this.config.api.url || '';
        if (url.includes('githubai.com')) {
            return 'github';
        }
        if (url.includes('deepseek.com')) {
            return 'deepseek';
        }
        if (url.includes('mistral.ai')) {
            return 'mistral';
        }
        if (url.includes('openai.com')) {
            return 'openai';
        }
        if (url.includes('groq.com')) {
            return 'groq';
        }
        return 'github'; // Default to GitHub DeepSeek
    }
    
    /**
     * Send chat completion request
     * @param {Array} messages - Array of message objects
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     * @param {Function} onStream - Stream callback (for streaming responses)
     */
    async sendChatCompletion(messages, onSuccess, onError, onStream = null) {
        if (!this.isConfigured()) {
            onError(new Error('Veuillez configurer l\'URL et la clé API dans les paramètres.'));
            return;
        }
        
        // Cancel any ongoing request
        if (this.abortController) {
            this.abortController.abort();
        }
        
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        
        try {
            const requestBody = this.buildRequestBody(messages);
            const provider = this.config.api.provider || this.detectProviderFromUrl();
            
            // For GitHub, use the configured URL
            const apiUrl = this.config.api.url;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(requestBody),
                signal
            });
            
            if (!response.ok) {
                const errorData = await this.parseErrorResponse(response);
                
                // Enhance error message with provider-specific guidance
                let errorMessage = errorData.message || `Erreur API: ${response.status} ${response.statusText}`;
                
                if (response.status === 401) {
                    if (provider === 'github' || this.config.api.url.includes('githubai.com')) {
                        errorMessage = 'Erreur 401: Token GitHub invalide ou expiré. ' +
                                      'Vérifiez que votre token a le scope "public_repo". ' +
                                      'Créez un nouveau token sur https://github.com/settings/tokens';
                    } else {
                        errorMessage = 'Erreur 401: Clé API invalide ou expirée. ' +
                                      'Vérifiez votre clé API dans les paramètres.';
                    }
                } else if (response.status === 403) {
                    errorMessage = 'Erreur 403: Accès refusé. ' +
                                  'Vérifiez que votre clé/token a les bonnes permissions.';
                } else if (response.status === 404) {
                    if (provider === 'github' || this.config.api.url.includes('githubai.com')) {
                        errorMessage = 'Erreur 404: Modèle ou endpoint non trouvé. ' +
                                      'Vérifiez que l\'URL est "https://api.githubai.com/v1/chat/completions" ' +
                                      'et que le modèle est "deepseek-chat" ou "deepseek-coder".';
                    } else {
                        errorMessage = 'Erreur 404: Modèle non trouvé. ' +
                                      'Vérifiez que le modèle sélectionné est disponible pour ce fournisseur.';
                    }
                } else if (response.status === 429) {
                    errorMessage = 'Erreur 429: Trop de requêtes. ' +
                                  'Attendez quelques secondes et réessayez.';
                } else if (response.status >= 500) {
                    errorMessage = `Erreur serveur ${response.status}: ` +
                                  'Le service est temporairement indisponible. Réessayez plus tard.';
                }
                
                onError(new Error(errorMessage));
                return;
            }
            
            // Handle streaming response
            if (requestBody.stream && onStream) {
                await this.handleStreamingResponse(response, onStream, onError, provider);
            } else {
                // Handle regular response
                const data = await response.json();
                const aiResponse = this.extractResponse(data, provider);
                onSuccess(aiResponse);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                // Enhance network error messages
                if (error.message && error.message.includes('Failed to fetch')) {
                    onError(new Error('Impossible de se connecter à l\'API. ' +
                                     'Vérifiez votre connexion internet et l\'URL de l\'API.'));
                } else if (error.message && error.message.includes('401')) {
                    onError(new Error('Erreur 401: Authentification échouée. ' +
                                     'Vérifiez votre clé API ou token.'));
                } else {
                    onError(error);
                }
            }
        } finally {
            this.abortController = null;
        }
    }
    
    /**
     * Handle streaming response
     * @param {Response} response - Fetch response
     * @param {Function} onStream - Stream callback
     * @param {Function} onError - Error callback
     * @param {string} provider - API provider
     */
    async handleStreamingResponse(response, onStream, onError, provider = 'github') {
        this.isStreaming = true;
        
        try {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete lines
                const lines = buffer.split('\n').filter(line => line.trim() !== '');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        if (dataStr === '[DONE]') {
                            onStream(null, true); // Signal completion
                            continue;
                        }
                        
                        try {
                            const data = JSON.parse(dataStr);
                            const delta = this.extractDelta(data, provider);
                            if (delta) {
                                onStream(delta, false);
                            }
                        } catch (e) {
                            console.error('Error parsing stream chunk:', e);
                        }
                    }
                }
            }
        } catch (error) {
            onError(error);
        } finally {
            this.isStreaming = false;
        }
    }
    
    /**
     * Cancel ongoing request
     */
    cancelRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.isStreaming = false;
    }
    
    /**
     * Parse error response
     * @param {Response} response - Fetch response
     * @returns {Object} Error data
     */
    async parseErrorResponse(response) {
        try {
            const data = await response.json();
            
            // Handle GitHub-specific error format
            if (data.message) {
                return { message: data.message };
            }
            
            // Handle DeepSeek-specific error format
            if (data.error && data.error.message) {
                return { message: data.error.message };
            }
            
            // Handle standard error format
            if (data.error) {
                return { message: data.error };
            }
            
            return data;
        } catch (e) {
            try {
                const text = await response.text();
                return {
                    message: `Erreur ${response.status}: ${response.statusText}${text ? ' - ' + text.substring(0, 200) : ''}`
                };
            } catch (e2) {
                return {
                    message: `Erreur ${response.status}: ${response.statusText}`
                };
            }
        }
    }
    
    /**
     * Extract response from API data based on provider
     * @param {Object} data - API response data
     * @param {string} provider - API provider
     * @returns {string} Extracted response
     */
    extractResponse(data, provider = 'github') {
        // GitHub DeepSeek, Mistral, OpenAI, Groq format (all use similar structure)
        if (data.choices && data.choices[0]) {
            // Standard message format
            if (data.choices[0].message && data.choices[0].message.content) {
                return data.choices[0].message.content;
            }
            // Streaming delta format
            if (data.choices[0].delta && data.choices[0].delta.content) {
                return data.choices[0].delta.content;
            }
            // Some APIs return text directly in choices
            if (data.choices[0].text) {
                return data.choices[0].text;
            }
        }
        
        // Fallback for other formats
        if (data.message && data.message.content) {
            return data.message.content;
        }
        
        if (data.output) {
            return data.output;
        }
        
        if (data.result) {
            return data.result;
        }
        
        if (data.completion) {
            return data.completion;
        }
        
        // Try to find any string content
        if (typeof data === 'string') {
            return data;
        }
        
        // Last resort: stringify the entire response
        return JSON.stringify(data);
    }
    
    /**
     * Extract delta from streaming data based on provider
     * @param {Object} data - Streaming data
     * @param {string} provider - API provider
     * @returns {string|null} Delta content or null
     */
    extractDelta(data, provider = 'github') {
        // Standard streaming format for most providers
        if (data.choices && data.choices[0] && data.choices[0].delta) {
            return data.choices[0].delta.content || null;
        }
        
        // Some APIs use message instead of delta
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content || null;
        }
        
        // Fallback
        if (data.output) {
            return data.output;
        }
        
        return null;
    }
    
    /**
     * Calculate token usage
     * @param {Array} messages - Array of messages
     * @returns {Object} Token usage info
     */
    calculateTokenUsage(messages) {
        let promptTokens = 0;
        let completionTokens = 0;
        
        messages.forEach(msg => {
            const tokens = estimateTokenCount(msg.content);
            if (msg.role === 'user') {
                promptTokens += tokens;
            } else {
                completionTokens += tokens;
            }
        });
        
        return {
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens
        };
    }
    
    /**
     * Check if model is available
     * @param {string} model - Model name
     * @returns {boolean} Is available
     */
    isModelAvailable(model) {
        const availableModels = this.getAvailableModels();
        return availableModels.includes(model);
    }
    
    /**
     * Get available models for current provider
     * @returns {Array} Array of available models
     */
    getAvailableModels() {
        const providerConfig = getProviderConfig(this.config.api.provider);
        return providerConfig.models || [];
    }
    
    /**
     * Test API connection
     * @returns {Promise<boolean>} Connection success
     */
    async testConnection() {
        if (!this.isConfigured()) return false;
        
        try {
            const testMessages = [{
                role: 'user',
                content: 'Bonjour'
            }];
            
            const requestBody = this.buildRequestBody(testMessages);
            requestBody.max_tokens = 1; // Minimal response
            
            const response = await fetch(this.config.api.url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(requestBody)
            });
            
            return response.ok;
        } catch (e) {
            console.error('Connection test failed:', e);
            return false;
        }
    }
}

// Singleton instance
export const apiClient = new APIClient();

export default APIClient;
