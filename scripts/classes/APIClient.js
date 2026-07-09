/**
 * API Client Class
 * Handles all API communications for the Claude AI Chatbot Clone
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
        return !!(this.config.api.url && this.config.api.key);
    }
    
    /**
     * Get API headers
     * @returns {Object} Headers object
     */
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.api.key}`
        };
    }
    
    /**
     * Build request body for chat completion
     * @param {Array} messages - Array of message objects
     * @returns {Object} Request body
     */
    buildRequestBody(messages) {
        return {
            model: this.config.api.model,
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
            
            const response = await fetch(this.config.api.url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(requestBody),
                signal
            });
            
            if (!response.ok) {
                const errorData = await this.parseErrorResponse(response);
                onError(new Error(errorData.message || `Erreur API: ${response.status}`));
                return;
            }
            
            // Handle streaming response
            if (requestBody.stream && onStream) {
                await this.handleStreamingResponse(response, onStream, onError);
            } else {
                // Handle regular response
                const data = await response.json();
                const aiResponse = this.extractResponse(data);
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
     */
    async handleStreamingResponse(response, onStream, onError) {
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
                            const delta = this.extractDelta(data);
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
            return {
                message: `Erreur ${response.status}: ${response.statusText}`
            };
        }
    }
    
    /**
     * Extract response from API data
     * @param {Object} data - API response data
     * @returns {string} Extracted response
     */
    extractResponse(data) {
        // Mistral/OpenAI format
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content || '';
        }
        
        // Other formats
        if (data.outputs && data.outputs[0]) {
            return data.outputs[0].text || '';
        }
        
        if (data.completion) {
            return data.completion;
        }
        
        if (data.result) {
            return data.result;
        }
        
        return '';
    }
    
    /**
     * Extract delta from streaming data
     * @param {Object} data - Streaming data
     * @returns {string|null} Delta content or null
     */
    extractDelta(data) {
        // Mistral/OpenAI streaming format
        if (data.choices && data.choices[0] && data.choices[0].delta) {
            return data.choices[0].delta.content || null;
        }
        
        // Other streaming formats
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
        // This would typically check against the API provider's available models
        // For now, we'll just return true for all models
        return true;
    }
    
    /**
     * Get available models for current provider
     * @returns {Array} Array of available models
     */
    getAvailableModels() {
        const provider = this.config.api.provider || 'mistral';
        const models = {
            mistral: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large'],
            openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
            groq: ['llama3-8b-instant', 'llama3-70b-versatile', 'mixtral-8x7b-32768', 'gemma-7b-it']
        };
        return models[provider] || models.mistral;
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
            return false;
        }
    }
}

// Singleton instance
export const apiClient = new APIClient();

export default APIClient;
