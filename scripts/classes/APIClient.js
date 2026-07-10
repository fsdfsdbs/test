/**
 * API Client Class
 * Handles all API communications for the Claude AI Chatbot Clone
 * Updated for Z.ai GLM API (GLM-5.2)
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
    
    updateConfig() {
        this.config = getConfig();
    }
    
    getApiConfig() {
        return this.config.api;
    }
    
    isConfigured() {
        return !!(this.config.api.url && (this.config.api.key || this.config.api.provider === 'github'));
    }
    
    getHeaders() {
        const providerConfig = getProviderConfig(this.config.api.provider);
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.config.api.key) {
            if (this.config.api.provider === 'github' || 
                this.config.api.provider === 'deepseek' ||
                this.config.api.url.includes('githubai.com')) {
                headers['Authorization'] = `token ${this.config.api.key}`;
            } else {
                // zai, mistral, openai, groq -> Bearer
                headers['Authorization'] = `Bearer ${this.config.api.key}`;
            }
        }
        
        if (this.config.api.provider === 'github' || 
            this.config.api.provider === 'deepseek' ||
            this.config.api.url.includes('githubai.com')) {
            headers['Accept'] = 'application/json';
            headers['X-GitHub-Api-Version'] = '2022-11-28';
        }
        
        return headers;
    }
    
    buildRequestBody(messages) {
        const providerConfig = getProviderConfig(this.config.api.provider);
        const baseRequest = {
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            temperature: this.config.settings.temperature,
            max_tokens: this.config.settings.maxTokens,
            stream: this.config.settings.enableStreaming
        };
        
        if (this.config.api.model) {
            baseRequest.model = this.config.api.model;
        }
        
        const provider = this.config.api.provider || this.detectProviderFromUrl();
        
        if (provider === 'github' || provider === 'deepseek' || this.config.api.url.includes('githubai.com')) {
            if (!baseRequest.model || !['DeepSeek-V3-0324', 'DeepSeek-Coder-V2-0314'].includes(baseRequest.model)) {
                baseRequest.model = 'DeepSeek-V3-0324';
            }
        } else if (provider === 'zai' || this.config.api.url.includes('api.z.ai')) {
            if (!baseRequest.model || !['glm-5.2', 'glm-5.1', 'glm-4.6'].includes(baseRequest.model)) {
                baseRequest.model = 'glm-5.2';
            }
            // Options spécifiques GLM (optionnelles)
            baseRequest.thinking = { type: 'enabled' };
        } else if (provider === 'mistral') {
            baseRequest.model = this.config.api.model || 'mistral-tiny';
        } else if (provider === 'openai') {
            baseRequest.model = this.config.api.model || 'gpt-3.5-turbo';
        } else if (provider === 'groq') {
            baseRequest.model = this.config.api.model || 'llama3-8b-instant';
        }
        
        return baseRequest;
    }
    
    detectProviderFromUrl() {
        const url = this.config.api.url || '';
        if (url.includes('githubai.com')) return 'github';
        if (url.includes('deepseek.com')) return 'deepseek';
        if (url.includes('api.z.ai')) return 'zai';
        if (url.includes('mistral.ai')) return 'mistral';
        if (url.includes('openai.com')) return 'openai';
        if (url.includes('groq.com')) return 'groq';
        return 'github';
    }
    
    async sendChatCompletion(messages, onSuccess, onError, onStream = null) {
        if (!this.isConfigured()) {
            onError(new Error('Veuillez configurer l\'URL et la clé API dans les paramètres.'));
            return;
        }
        
        if (this.abortController) {
            this.abortController.abort();
        }
        
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        
        try {
            const requestBody = this.buildRequestBody(messages);
            const provider = this.config.api.provider || this.detectProviderFromUrl();
            const apiUrl = this.config.api.url;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(requestBody),
                signal
            });
            
            if (!response.ok) {
                const errorData = await this.parseErrorResponse(response);
                let errorMessage = errorData.message || `Erreur API: ${response.status} ${response.statusText}`;
                
                if (response.status === 401) {
                    if (provider === 'github' || this.config.api.url.includes('githubai.com')) {
                        errorMessage = 'Erreur 401: Token GitHub invalide ou expiré. Vérifiez le scope "public_repo".';
                    } else if (provider === 'zai' || this.config.api.url.includes('api.z.ai')) {
                        errorMessage = 'Erreur 401: Clé API Z.ai invalide ou expirée.';
                    } else {
                        errorMessage = 'Erreur 401: Clé API invalide ou expirée.';
                    }
                } else if (response.status === 403) {
                    errorMessage = 'Erreur 403: Accès refusé. Vérifiez les permissions.';
                } else if (response.status === 404) {
                    if (provider === 'github' || this.config.api.url.includes('githubai.com')) {
                        errorMessage = 'Erreur 404: Modèle non trouvé. Utilisez "DeepSeek-V3-0324" ou "DeepSeek-Coder-V2-0314".';
                    } else if (provider === 'zai' || this.config.api.url.includes('api.z.ai')) {
                        errorMessage = 'Erreur 404: Modèle non trouvé. Utilisez "glm-5.2".';
                    } else {
                        errorMessage = 'Erreur 404: Modèle non trouvé.';
                    }
                } else if (response.status === 429) {
                    errorMessage = 'Erreur 429: Trop de requêtes. Attendez et réessayez.';
                } else if (response.status >= 500) {
                    errorMessage = `Erreur serveur ${response.status}: Réessayez plus tard.`;
                }
                
                onError(new Error(errorMessage));
                return;
            }
            
            if (requestBody.stream && onStream) {
                await this.handleStreamingResponse(response, onStream, onError, provider);
            } else {
                const data = await response.json();
                const aiResponse = this.extractResponse(data, provider);
                onSuccess(aiResponse);
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                if (error.message && error.message.includes('Failed to fetch')) {
                    onError(new Error('Impossible de se connecter à l\'API. Vérifiez l\'URL.'));
                } else {
                    onError(error);
                }
            }
        } finally {
            this.abortController = null;
        }
    }
    
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
                const lines = buffer.split('\n').filter(line => line.trim() !== '');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        if (dataStr === '[DONE]') {
                            onStream(null, true);
                            continue;
                        }
                        try {
                            const data = JSON.parse(dataStr);
                            const delta = this.extractDelta(data, provider);
                            if (delta) onStream(delta, false);
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
    
    cancelRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.isStreaming = false;
    }
    
    async parseErrorResponse(response) {
        try {
            const data = await response.json();
            if (data.message) return { message: data.message };
            if (data.error && data.error.message) return { message: data.error.message };
            if (data.error) return { message: data.error };
            return data;
        } catch (e) {
            try {
                const text = await response.text();
                return { message: `Erreur ${response.status}: ${response.statusText}${text ? ' - ' + text.substring(0, 200) : ''}` };
            } catch (e2) {
                return { message: `Erreur ${response.status}: ${response.statusText}` };
            }
        }
    }
    
    extractResponse(data, provider = 'github') {
        if (data.choices && data.choices[0]) {
            if (data.choices[0].message && data.choices[0].message.content) return data.choices[0].message.content;
            if (data.choices[0].delta && data.choices[0].delta.content) return data.choices[0].delta.content;
            if (data.choices[0].text) return data.choices[0].text;
        }
        if (data.message && data.message.content) return data.message.content;
        if (data.output) return data.output;
        if (data.result) return data.result;
        if (data.completion) return data.completion;
        if (typeof data === 'string') return data;
        return JSON.stringify(data);
    }
    
    extractDelta(data, provider = 'github') {
        if (data.choices && data.choices[0] && data.choices[0].delta) return data.choices[0].delta.content || null;
        if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content || null;
        if (data.output) return data.output;
        return null;
    }
    
    calculateTokenUsage(messages) {
        let promptTokens = 0, completionTokens = 0;
        messages.forEach(msg => {
            const tokens = estimateTokenCount(msg.content);
            if (msg.role === 'user') promptTokens += tokens;
            else completionTokens += tokens;
        });
        return { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens };
    }
    
    isModelAvailable(model) {
        const availableModels = this.getAvailableModels();
        return availableModels.includes(model);
    }
    
    getAvailableModels() {
        const providerConfig = getProviderConfig(this.config.api.provider);
        return providerConfig.models || [];
    }
    
    async testConnection() {
        if (!this.isConfigured()) return false;
        try {
            const testMessages = [{ role: 'user', content: 'Bonjour' }];
            const requestBody = this.buildRequestBody(testMessages);
            requestBody.max_tokens = 1;
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

export const apiClient = new APIClient();
export default APIClient;
