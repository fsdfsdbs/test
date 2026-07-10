/**
 * API Client Class
 * Handles all API communications for the Claude AI Chatbot Clone
 * Adapted for GitHub DeepSeek API and other providers
 */

import { getConfig, updateConfig } from '../config.js';
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
        // For GitHub, key might not be required if using authenticated session
        // But we still need URL
        return !!(this.config.api.url);
    }
    
    /**
     * Get API headers based on provider
     * @returns {Object} Headers object
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization header if key exists
        if (this.config.api.key) {
            headers['Authorization'] = `Bearer ${this.config.api.key}`;
        }
        
        // GitHub specific headers
        if (this.config.api.provider === 'github' || this.config.api.url.includes('github.ai')) {
            headers['Accept'] = 'application/json';
            // GitHub might use different auth scheme
            if (this.config.api.key) {
                headers['Authorization'] = `token ${this.config.api.key}`;
            }
        }
        
        return headers;
    }
    
    /**
     * Build request body for chat completion based on provider
     * @param {Array} messages - Array of message objects
     * @returns {Object} Request body
     */
    buildRequestBody(messages) {
        const provider = this.config.api.provider || this.detectProviderFromUrl();
        
        // GitHub DeepSeek format
        if (provider === 'github' || this.config.api.url.includes('github.ai')) {
            return {
                model: this.config.api.model || 'deepseek/DeepSeek-V3',
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                temperature: this.config.settings.temperature,
                max_tokens: this.config.settings.maxTokens,
                stream: this.config.settings.enableStreaming
            };
        }
        
        // Mistral format
        if (provider === 'mistral') {
            return {
                model: this.config.api.model || 'mistral-tiny',
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                temperature: this.config.settings.temperature,
                max_tokens: this.config.settings.maxTokens,
                stream: this.config.settings.enableStreaming
            };
        }
        
        // OpenAI format
        if (provider === 'openai') {
            return {
                model: this.config.api.model || 'gpt-3.5-turbo',
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                temperature: this.config.settings.temperature,
                max_tokens: this.config.settings.maxTokens,
                stream: this.config.settings.enableStreaming
            };
        }
        
        // Groq format
        if (provider === 'groq') {
            return {
                model: this.config.api.model || 'llama3-8b-instant',
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                temperature: this.config.settings.temperature,
                max_tokens: this.config.settings.maxTokens,
                stream: this.config.settings.enableStreaming
            };
        }
        
        // Default format (GitHub-like)
        return {
            model: this.config.api.model || 'deepseek/DeepSeek-V3',
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            temperature: this.config.settings.temperature,
            max_tokens: this.config.settings.maxTokens,
            stream: this.config.settings.enableStreaming
        };
    }
    
    /**
     * Detect provider from URL
     * @returns {string} Provider name
     */
    detectProviderFromUrl() {
        const url = this.config.api.url || '';
        if (url.includes('github.ai') || url.includes('github.com')) {
            return 'github';
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
            onError(new Error('Veuillez configurer l\'URL de l\'API dans les paramètres.'));
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
            
            const response = await fetch(this.config.api.url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(requestBody),
                signal
            });
            
            if (!response.ok) {
                const errorData = await this.parseErrorResponse(response);
                onError(new Error(errorData.message || `Erreur API: ${response.status} ${response.statusText}`));
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
                onError(error);
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
            return await response.json();
        } catch (e) {
            try {
                const text = await response.text();
                return {
                    message: `Erreur ${response.status}: ${response.statusText}${text ? ' - ' + text : ''}`
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
        // GitHub DeepSeek format
        if (provider === 'github' || this.config.api.url.includes('github.ai')) {
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content || '';
            }
            if (data.message && data.message.content) {
                return data.message.content;
            }
            if (data.output) {
                return data.output;
            }
            if (data.result) {
                return data.result;
            }
        }
        
        // Mistral/OpenAI format
        if (provider === 'mistral' || provider === 'openai' || provider === 'groq') {
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content || '';
            }
        }
        
        // Generic fallback
        if (data.outputs && data.outputs[0]) {
            return data.outputs[0].text || '';
        }
        
        if (data.completion) {
            return data.completion;
        }
        
        if (data.result) {
            return data.result;
        }
        
        // Try to find any string content
        if (typeof data === 'string') {
            return data;
        }
        
        return '';
    }
    
    /**
     * Extract delta from streaming data based on provider
     * @param {Object} data - Streaming data
     * @param {string} provider - API provider
     * @returns {string|null} Delta content or null
     */
    extractDelta(data, provider = 'github') {
        // GitHub DeepSeek streaming format
        if (provider === 'github' || this.config.api.url.includes('github.ai')) {
            if (data.choices && data.choices[0] && data.choices[0].delta) {
                return data.choices[0].delta.content || null;
            }
            if (data.message && data.message.content) {
                return data.message.content;
            }
            if (data.output) {
                return data.output;
            }
        }
        
        // Mistral/OpenAI streaming format
        if (provider === 'mistral' || provider === 'openai' || provider === 'groq') {
            if (data.choices && data.choices[0] && data.choices[0].delta) {
                return data.choices[0].delta.content || null;
            }
        }
        
        // Generic fallback
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
        return true; // Assume all models are available
    }
    
    /**
     * Get available models for current provider
     * @returns {Array} Array of available models
     */
    getAvailableModels() {
        const provider = this.config.api.provider || this.detectProviderFromUrl();
        
        const models = {
            github: [
                'deepseek/DeepSeek-V3',
                'deepseek/DeepSeek-V2',
                'deepseek/DeepSeek-Coder-V2',
                'deepseek/DeepSeek-Coder-V1.5',
                'openai/gpt-4o',
                'openai/gpt-4-turbo',
                'openai/gpt-4',
                'openai/gpt-3.5-turbo',
                'anthropic/claude-3-haiku',
                'anthropic/claude-3-sonnet',
                'anthropic/claude-3-opus',
                'meta/llama-3.1-70b',
                'meta/llama-3.1-8b',
                'meta/llama-3-70b',
                'meta/llama-3-8b',
                'mistral/mistral-large',
                'mistral/mistral-small',
                'mistral/mixtral-8x7b'
            ],
            mistral: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large'],
            openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
            groq: ['llama3-8b-instant', 'llama3-70b-versatile', 'mixtral-8x7b-32768', 'gemma-7b-it']
        };
        
        return models[provider] || models.github;
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
