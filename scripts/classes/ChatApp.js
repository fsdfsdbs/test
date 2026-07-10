/**
 * ChatApp Class - Modified for Local AI
 * Main application class for the Claude AI Chatbot Clone
 * Now uses LocalAI instead of external APIs
 */

import { getConfig, updateConfig, initConfig } from '../config.js';
import { storageManager } from './StorageManager.js';
import { localAI } from './LocalAI.js';
import { uiManager } from './UIManager.js';
import { formatMessage } from '../utils/markdown.js';
import { generateId, estimateTokenCount, copyToClipboard, downloadFile } from '../utils/helpers.js';

/**
 * ChatApp - Main application class with Local AI
 */
export class ChatApp {
    constructor() {
        this.state = {
            conversations: [],
            currentConversationId: null,
            messages: [],
            isLoading: false,
            isTyping: false,
            isStreaming: false,
            streamBuffer: ''
        };
        
        this.init();
    }
    
    /**
     * Initialize the application
     */
    init() {
        // Initialize configuration
        initConfig();
        
        // Load conversations
        this.loadConversations();
        
        // Setup UI
        uiManager.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Hide loading screen
        uiManager.hideLoading();
        
        // Show welcome message for Local AI
        setTimeout(() => {
            if (this.state.messages.length === 0) {
                uiManager.showToast('IA Locale activée ! Toutes vos données restent dans votre navigateur.', 'success');
            }
        }, 1000);
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // New chat
        uiManager.on('newChat', () => this.createNewConversation());
        
        // Send message
        uiManager.on('sendMessage', () => this.sendMessage());
        
        // Stop stream (kept for compatibility)
        uiManager.on('stopStream', () => this.stopStream());
        
        // Load conversation
        uiManager.on('loadConversation', (e) => this.loadConversation(e.detail.id));
        
        // Delete conversation
        uiManager.on('deleteConversation', (e) => this.deleteConversation(e.detail.id));
        
        // Copy chat
        uiManager.on('copyChat', () => this.copyConversation());
        
        // Close chat
        uiManager.on('closeChat', () => this.closeConversation());
        
        // Delete chat
        uiManager.on('deleteChat', () => this.deleteCurrentConversation());
        
        // Search
        uiManager.on('search', (e) => this.handleSearch(e.detail.query));
        
        // Settings saved
        uiManager.on('settingsSaved', (e) => this.handleSettingsSaved(e.detail));
        
        // Copy link
        uiManager.on('copyLink', () => this.copyLink());
        
        // Export JSON
        uiManager.on('exportJson', () => this.exportJson());
        
        // Export HTML
        uiManager.on('exportHtml', () => this.exportHtml());
        
        // Local AI specific events
        uiManager.on('trainAI', () => this.trainAI());
        uiManager.on('clearAIKnowledge', () => this.clearAIKnowledge());
        uiManager.on('exportAIKnowledge', () => this.exportAIKnowledge());
        uiManager.on('importAIKnowledge', () => this.importAIKnowledge());
        
        // Window events
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());
    }
    
    /**
     * Load conversations from storage
     */
    loadConversations() {
        this.state.conversations = storageManager.getConversations();
        
        // Sort by updatedAt (newest first)
        this.state.conversations.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt));
        
        // Load the most recent conversation or create a new one
        if (this.state.conversations.length > 0) {
            const lastConversation = this.state.conversations[0];
            this.loadConversation(lastConversation.id);
        } else {
            this.createNewConversation();
        }
        
        // Render conversations
        this.renderConversations();
    }
    
    /**
     * Render conversations in sidebar
     */
    renderConversations() {
        const config = getConfig();
        const searchQuery = uiManager.elements.searchInput?.value || '';
        uiManager.renderConversations(
            this.state.conversations,
            this.state.currentConversationId,
            searchQuery
        );
    }
    
    /**
     * Create a new conversation
     */
    createNewConversation() {
        // Stop any ongoing stream
        this.stopStream();
        
        const newConversation = {
            id: generateId(),
            title: 'Nouveau chat',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pinned: false
        };
        
        this.state.conversations.unshift(newConversation);
        this.state.currentConversationId = newConversation.id;
        this.state.messages = newConversation.messages;
        
        // Save to storage
        storageManager.saveConversations(this.state.conversations);
        
        // Update UI
        this.renderConversations();
        this.renderMessages();
        uiManager.updateChatTitle(newConversation.title);
        uiManager.clearInput();
        uiManager.focusInput();
    }
    
    /**
     * Load a conversation
     * @param {string} id - Conversation ID
     */
    loadConversation(id) {
        const conversation = this.state.conversations.find(c => c.id === id);
        if (!conversation) return;
        
        // Stop any ongoing stream
        this.stopStream();
        
        this.state.currentConversationId = id;
        this.state.messages = conversation.messages;
        
        // Update UI
        this.renderConversations();
        this.renderMessages();
        uiManager.updateChatTitle(conversation.title);
        uiManager.clearInput();
        uiManager.focusInput();
        
        // Update storage (move to top)
        storageManager.moveConversationToTop(id);
    }
    
    /**
     * Delete a conversation
     * @param {string} id - Conversation ID
     */
    deleteConversation(id) {
        const index = this.state.conversations.findIndex(c => c.id === id);
        if (index === -1) return;
        
        this.state.conversations.splice(index, 1);
        
        // If deleting current conversation, load the next one
        if (this.state.currentConversationId === id) {
            if (this.state.conversations.length > 0) {
                this.loadConversation(this.state.conversations[0].id);
            } else {
                this.createNewConversation();
            }
        }
        
        // Save to storage
        storageManager.saveConversations(this.state.conversations);
        
        // Update UI
        this.renderConversations();
    }
    
    /**
     * Delete current conversation
     */
    deleteCurrentConversation() {
        if (this.state.currentConversationId) {
            this.deleteConversation(this.state.currentConversationId);
        }
    }
    
    /**
     * Close current conversation (mobile)
     */
    closeConversation() {
        uiManager.toggleSidebar();
    }
    
    /**
     * Copy current conversation to clipboard
     */
    copyConversation() {
        const conversation = this.state.conversations.find(
            c => c.id === this.state.currentConversationId
        );
        
        if (!conversation) return;
        
        const text = conversation.messages.map(msg => {
            const role = msg.role === 'user' ? 'Vous' : 'IA';
            const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR');
            return `[${time}] ${role}: ${msg.content}`;
        }).join('\n\n');
        
        copyToClipboard(text).then(() => {
            uiManager.showToast('Conversation copiée dans le presse-papiers', 'success');
        });
    }
    
    /**
     * Handle search
     * @param {string} query - Search query
     */
    handleSearch(query) {
        this.renderConversations();
    }
    
    /**
     * Handle settings saved
     * @param {Object} config - Saved configuration
     */
    handleSettingsSaved(config) {
        updateConfig(config);
        // No need to update API client since we're using LocalAI
        uiManager.updateModelInfo(config.api?.model || 'IA Locale');
    }
    
    /**
     * Render messages
     */
    renderMessages() {
        uiManager.renderMessages(
            this.state.messages,
            this.state.isLoading,
            this.state.isTyping
        );
    }
    
    /**
     * Send a message
     */
    sendMessage() {
        const text = uiManager.elements.messageInput.value.trim();
        if (!text || this.state.isLoading) return;
        
        // Add user message
        const userMessage = {
            id: generateId(),
            role: 'user',
            content: text,
            timestamp: new Date().toISOString()
        };
        
        this.state.messages.push(userMessage);
        
        // Update conversation
        this.updateCurrentConversation();
        
        // Render messages
        this.renderMessages();
        
        // Clear input
        uiManager.clearInput();
        
        // Show typing indicator
        uiManager.showTypingIndicator();
        this.state.isTyping = true;
        
        // Set loading state
        this.state.isLoading = true;
        uiManager.setInputDisabled(true);
        
        // Use Local AI to generate response
        this.generateLocalAIResponse(text);
    }
    
    /**
     * Generate response using Local AI
     * @param {string} userMessage - User message
     */
    async generateLocalAIResponse(userMessage) {
        try {
            // Get previous messages for context
            const previousMessages = this.state.messages.slice(-10); // Last 10 messages for context
            
            // Generate response using LocalAI
            const response = await localAI.generateResponse(userMessage, previousMessages);
            
            // Create AI message
            const aiMessage = {
                id: generateId(),
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };
            
            this.state.messages.push(aiMessage);
            this.state.isTyping = false;
            this.state.isLoading = false;
            
            // Let LocalAI learn from this conversation
            localAI.learnFromConversation([...previousMessages, userMessage, aiMessage]);
            
            // Update conversation
            this.updateCurrentConversation();
            
            // Update UI
            this.renderMessages();
            uiManager.setInputDisabled(false);
            uiManager.hideTypingIndicator();
            uiManager.focusInput();
            
        } catch (error) {
            this.handleLocalAIError(error);
        }
    }
    
    /**
     * Stop the current stream (kept for compatibility)
     */
    stopStream() {
        if (this.state.isStreaming) {
            this.state.isStreaming = false;
            this.state.isTyping = false;
            this.state.isLoading = false;
            
            uiManager.hideStopButton();
            uiManager.setInputDisabled(false);
            uiManager.hideTypingIndicator();
            uiManager.focusInput();
        }
    }
    
    /**
     * Handle Local AI error
     * @param {Error} error - Error object
     */
    handleLocalAIError(error) {
        this.state.isLoading = false;
        this.state.isTyping = false;
        this.state.isStreaming = false;
        
        uiManager.setInputDisabled(false);
        uiManager.hideTypingIndicator();
        uiManager.hideStopButton();
        uiManager.focusInput();
        
        uiManager.showError('Erreur avec l\'IA locale : ' + error.message);
        console.error('Local AI Error:', error);
    }
    
    /**
     * Train the Local AI with current conversations
     */
    trainAI() {
        // Train LocalAI with all conversations
        this.state.conversations.forEach(conversation => {
            if (conversation.messages.length >= 2) {
                localAI.learnFromConversation(conversation.messages);
            }
        });
        
        uiManager.showToast('IA entraînée avec succès ! Elle est maintenant plus intelligente. 🧠', 'success');
    }
    
    /**
     * Clear Local AI knowledge
     */
    clearAIKnowledge() {
        localAI.clearKnowledge();
        uiManager.showToast('Mémoire de l\'IA effacée. Elle repart de zéro. 🗑️', 'success');
    }
    
    /**
     * Export Local AI knowledge
     */
    exportAIKnowledge() {
        const knowledge = localAI.exportKnowledge();
        const json = JSON.stringify(knowledge, null, 2);
        const filename = `ia-locale-knowledge-${new Date().toISOString().split('T')[0]}.json`;
        
        downloadFile(json, filename, 'application/json');
        uiManager.showToast('Connaissances de l\'IA exportées !', 'success');
    }
    
    /**
     * Import Local AI knowledge
     */
    async importAIKnowledge() {
        // Create file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const knowledge = JSON.parse(event.target.result);
                    localAI.importKnowledge(knowledge);
                    uiManager.showToast('Connaissances importées avec succès ! 📚', 'success');
                } catch (error) {
                    uiManager.showToast('Erreur lors de l\'import : ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    /**
     * Update current conversation
     */
    updateCurrentConversation() {
        if (!this.state.currentConversationId) return;
        
        const conversation = this.state.conversations.find(
            c => c.id === this.state.currentConversationId
        );
        
        if (conversation) {
            conversation.messages = this.state.messages;
            conversation.updatedAt = new Date().toISOString();
            
            // Update title if it's still "Nouveau chat" and we have messages
            if (conversation.title === 'Nouveau chat' && this.state.messages.length > 0) {
                const firstUserMessage = this.state.messages.find(m => m.role === 'user');
                if (firstUserMessage) {
                    conversation.title = firstUserMessage.content.substring(0, 50);
                }
            }
            
            storageManager.saveConversations(this.state.conversations);
            this.renderConversations();
        }
    }
    
    /**
     * Copy link to current conversation
     */
    copyLink() {
        const conversation = this.state.conversations.find(
            c => c.id === this.state.currentConversationId
        );
        
        if (!conversation) return;
        
        // Create a shareable link
        const link = `${window.location.origin}${window.location.pathname}?chat=${conversation.id}`;
        
        copyToClipboard(link).then(() => {
            uiManager.showToast('Lien copié dans le presse-papiers', 'success');
        });
    }
    
    /**
     * Export current conversation as JSON
     */
    exportJson() {
        const conversation = this.state.conversations.find(
            c => c.id === this.state.currentConversationId
        );
        
        if (!conversation) return;
        
        const data = {
            id: conversation.id,
            title: conversation.title,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
            messages: conversation.messages
        };
        
        const json = JSON.stringify(data, null, 2);
        const filename = `chat-${conversation.id}.json`;
        
        downloadFile(json, filename, 'application/json');
        uiManager.showToast('Conversation exportée en JSON', 'success');
    }
    
    /**
     * Export current conversation as HTML
     */
    exportHtml() {
        const conversation = this.state.conversations.find(
            c => c.id === this.state.currentConversationId
        );
        
        if (!conversation) return;
        
        let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${conversation.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .message { margin-bottom: 20px; padding: 10px; border-radius: 8px; }
        .user { background: #e3f2fd; margin-left: 20%; }
        .ai { background: #f5f5f5; margin-right: 20%; }
        .time { font-size: 12px; color: #666; }
        pre { background: #2d2d2d; color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        code { font-family: monospace; }
    </style>
</head>
<body>
    <h1>${conversation.title}</h1>
    <p>Exporté le ${new Date().toLocaleString('fr-FR')}</p>
    <p><em>IA Locale - Toutes les données sont stockées localement</em></p>
`;
        
        conversation.messages.forEach(msg => {
            const role = msg.role === 'user' ? 'user' : 'ai';
            const time = new Date(msg.timestamp).toLocaleTimeString('fr-FR');
            const content = msg.content
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
            
            html += `
    <div class="message ${role}">
        <strong>${role === 'user' ? 'Vous' : 'IA Locale'}</strong>
        <span class="time">${time}</span>
        <div>${content}</div>
    </div>
`;
        });
        
        html += `
</body>
</html>`;
        
        const filename = `chat-${conversation.id}.html`;
        downloadFile(html, filename, 'text/html');
        uiManager.showToast('Conversation exportée en HTML', 'success');
    }
    
    /**
     * Handle before unload
     */
    handleBeforeUnload() {
        this.updateCurrentConversation();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatApp = new ChatApp();
});

export default ChatApp;
