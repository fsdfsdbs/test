/**
 * API Client Class
 * Verrouillé sur Z.ai GLM-5.2
 */

import { getConfig } from '../config.js';
import { estimateTokenCount } from '../utils/helpers.js';

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
        // Toujours vrai car la clé est intégrée en dur
        return !!(this.config.api.url && this.config.api.key);
    }
    
    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.api.key}`
        };
    }
    
    buildRequestBody(messages) {
        return {
            model: 'glm-5.2',
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            temperature: this.config.settings.temperature,
            max_tokens: this.config.settings.maxTokens,
            stream: this.config.settings.enableStreaming,
            thinking: { type: 'enabled' } // optionnel, retire si tu veux désactiver le raisonnement GLM
        };
    }
    
    async sendChatCompletion(messages, onSuccess, onError, onStream = null) {
        if (!this.isConfigured()) {
            onError(new Error('Clé API manquante dans config.js.'));
            return;
        }
        
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
                let errorMessage = errorData.message || `Erreur API: ${response.status} ${response.statusText}`;
                
                if (response.status === 401) {
                    errorMessage = 'Erreur 401: Clé API Z.ai invalide ou expirée.';
                } else if (response.status === 403) {
                    errorMessage = 'Erreur 403: Accès refusé. Vérifiez les permissions.';
                } else if (response.status === 404) {
                    errorMessage = 'Erreur 404: Modèle non trouvé. Utilisez "glm-5.2".';
                } else if (response.status === 429) {
                    errorMessage = 'Erreur 429: Trop de requêtes. Attendez et réessayez.';
                } else if (response.status >= 500) {
                    errorMessage = `Erreur serveur ${response.status}: Réessayez plus tard.`;
                }
                
                onError(new Error(errorMessage));
                return;
            }
            
            if (requestBody.stream && onStream) {
                await this.handleStreamingResponse(response, onStream, onError);
            } else {
                const data = await response.json();
                const aiResponse = this.extractResponse(data);
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
                            const delta = this.extractDelta(data);
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
    
    extractResponse(data) {
        if (data.choices && data.choices[0]) {
            if (data.choices[0].message && data.choices[0].message.content) return data.choices[0].message.content;
            if (data.choices[0].delta && data.choices[0].delta.content) return data.choices[0].delta.content;
            if (data.choices[0].text) return data.choices[0].text;
        }
        if (data.message && data.message.content) return data.message.content;
        if (typeof data === 'string') return data;
        return JSON.stringify(data);
    }
    
    extractDelta(data) {
        if (data.choices && data.choices[0] && data.choices[0].delta) return data.choices[0].delta.content || null;
        if (data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content || null;
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
    
    async testConnection() {
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
