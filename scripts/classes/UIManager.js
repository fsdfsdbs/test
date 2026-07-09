/**
 * UI Manager Class
 * Manages all UI operations for the Claude AI Chatbot Clone
 */

import {
    createElement,
    createIcon,
    createMessageElement,
    createTypingIndicator,
    createErrorElement,
    createConversationItem,
    createToast,
    showToast,
    emptyElement,
    scrollToBottom,
    autoResizeTextarea,
    focusElement,
    getElementById,
    querySelector,
    querySelectorAll,
    addEventListener,
    removeEventListener,
    toggleClass,
    addClass,
    removeClass,
    hasClass
} from '../utils/dom.js';

import { formatMessage } from '../utils/markdown.js';
import { formatTime, formatDate, estimateTokenCount } from '../utils/helpers.js';

/**
 * UIManager - Manages all UI operations
 */
export class UIManager {
    constructor() {
        this.elements = {};
        this.eventListeners = {};
        this.initElements();
    }
    
    /**
     * Initialize DOM element references
     */
    initElements() {
        this.elements = {
            // App
            appContainer: getElementById('appContainer'),
            loadingScreen: getElementById('loadingScreen'),
            
            // Sidebar
            sidebar: getElementById('sidebar'),
            newChatBtn: getElementById('newChatBtn'),
            chatHistory: getElementById('chatHistory'),
            settingsBtn: getElementById('settingsBtn'),
            searchInput: getElementById('searchInput'),
            clearSearchBtn: getElementById('clearSearchBtn'),
            mobileMenuBtn: getElementById('mobileMenuBtn'),
            
            // Main Chat
            mainChat: getElementById('mainChat'),
            messages: getElementById('messages'),
            welcomeMessage: getElementById('welcomeMessage'),
            messageInput: getElementById('messageInput'),
            sendBtn: getElementById('sendBtn'),
            stopBtn: getElementById('stopBtn'),
            chatTitleInput: getElementById('chatTitleInput'),
            copyChatBtn: getElementById('copyChatBtn'),
            shareChatBtn: getElementById('shareChatBtn'),
            deleteChatBtn: getElementById('deleteChatBtn'),
            closeChatBtn: getElementById('closeChatBtn'),
            modelInfo: getElementById('modelInfo'),
            tokenCount: getElementById('tokenCount'),
            
            // Modals
            settingsModal: getElementById('settingsModal'),
            shareModal: getElementById('shareModal'),
            closeSettingsBtn: getElementById('closeSettingsBtn'),
            closeShareBtn: getElementById('closeShareBtn'),
            cancelSettingsBtn: getElementById('cancelSettingsBtn'),
            saveSettingsBtn: getElementById('saveSettingsBtn'),
            
            // Settings Form
            apiProvider: getElementById('apiProvider'),
            apiUrl: getElementById('apiUrl'),
            apiKey: getElementById('apiKey'),
            apiModel: getElementById('apiModel'),
            temperature: getElementById('temperature'),
            temperatureValue: getElementById('temperatureValue'),
            maxTokens: getElementById('maxTokens'),
            theme: getElementById('theme'),
            fontSize: getElementById('fontSize'),
            enableStreaming: getElementById('enableStreaming'),
            saveHistory: getElementById('saveHistory'),
            enterToSend: getElementById('enterToSend'),
            togglePassword: getElementById('togglePassword'),
            
            // Share Options
            copyLinkBtn: getElementById('copyLinkBtn'),
            exportJsonBtn: getElementById('exportJsonBtn'),
            exportHtmlBtn: getElementById('exportHtmlBtn'),
            
            // Toast
            toastContainer: getElementById('toastContainer')
        };
    }
    
    /**
     * Initialize UI
     */
    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupFontSize();
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Sidebar
        addEventListener(this.elements.newChatBtn, 'click', () => this.emit('newChat'));
        addEventListener(this.elements.settingsBtn, 'click', () => this.openSettings());
        addEventListener(this.elements.mobileMenuBtn, 'click', () => this.toggleSidebar());
        
        // Search
        addEventListener(this.elements.searchInput, 'input', (e) => this.handleSearch(e));
        addEventListener(this.elements.clearSearchBtn, 'click', () => this.clearSearch());
        
        // Chat
        addEventListener(this.elements.messageInput, 'input', () => this.handleInputChange());
        addEventListener(this.elements.messageInput, 'keydown', (e) => this.handleKeyDown(e));
        addEventListener(this.elements.sendBtn, 'click', () => this.emit('sendMessage'));
        addEventListener(this.elements.stopBtn, 'click', () => this.emit('stopStream'));
        addEventListener(this.elements.copyChatBtn, 'click', () => this.emit('copyChat'));
        addEventListener(this.elements.shareChatBtn, 'click', () => this.openShareModal());
        addEventListener(this.elements.deleteChatBtn, 'click', () => this.emit('deleteChat'));
        addEventListener(this.elements.closeChatBtn, 'click', () => this.emit('closeChat'));
        
        // Settings Modal
        addEventListener(this.elements.closeSettingsBtn, 'click', () => this.closeSettings());
        addEventListener(this.elements.cancelSettingsBtn, 'click', () => this.closeSettings());
        addEventListener(this.elements.saveSettingsBtn, 'click', () => this.saveSettings());
        addEventListener(this.elements.togglePassword, 'click', () => this.togglePasswordVisibility());
        addEventListener(this.elements.apiProvider, 'change', (e) => this.handleProviderChange(e));
        addEventListener(this.elements.temperature, 'input', (e) => this.updateTemperatureValue(e));
        
        // Share Modal
        addEventListener(this.elements.closeShareBtn, 'click', () => this.closeShareModal());
        addEventListener(this.elements.copyLinkBtn, 'click', () => this.emit('copyLink'));
        addEventListener(this.elements.exportJsonBtn, 'click', () => this.emit('exportJson'));
        addEventListener(this.elements.exportHtmlBtn, 'click', () => this.emit('exportHtml'));
        
        // Quick prompts
        querySelectorAll('.quick-prompt').forEach(btn => {
            addEventListener(btn, 'click', () => {
                const prompt = btn.dataset.prompt;
                this.elements.messageInput.value = prompt;
                focusElement(this.elements.messageInput);
                this.emit('sendMessage');
            });
        });
        
        // Modal close on overlay click
        addEventListener(this.elements.settingsModal, 'click', (e) => {
            if (e.target === this.elements.settingsModal) {
                this.closeSettings();
            }
        });
        
        addEventListener(this.elements.shareModal, 'click', (e) => {
            if (e.target === this.elements.shareModal) {
                this.closeShareModal();
            }
        });
        
        // Keyboard shortcuts
        addEventListener(document, 'keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    /**
     * Emit custom event
     * @param {string} eventName - Event name
     * @param {*} detail - Event detail
     */
    emit(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Add event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    on(eventName, handler) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(handler);
        addEventListener(document, eventName, handler);
    }
    
    /**
     * Remove event listener
     * @param {string} eventName - Event name
     * @param {Function} handler - Event handler
     */
    off(eventName, handler) {
        if (this.eventListeners[eventName]) {
            const index = this.eventListeners[eventName].indexOf(handler);
            if (index > -1) {
                this.eventListeners[eventName].splice(index, 1);
            }
        }
        removeEventListener(document, eventName, handler);
    }
    
    /**
     * Handle input change
     */
    handleInputChange() {
        autoResizeTextarea(this.elements.messageInput);
        this.updateSendButton();
        this.updateTokenCount();
    }
    
    /**
     * Handle key down
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        // Enter to send (if configured)
        if (e.key === 'Enter' && !e.shiftKey) {
            const enterToSend = this.elements.enterToSend?.checked;
            if (enterToSend) {
                e.preventDefault();
                this.emit('sendMessage');
            }
        }
        
        // Shift+Enter for new line
        if (e.key === 'Enter' && e.shiftKey) {
            // Default behavior (new line) is already handled
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            this.closeSettings();
            this.closeShareModal();
        }
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + K: New chat
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.emit('newChat');
        }
        
        // Ctrl/Cmd + ,: Settings
        if ((e.ctrlKey || e.metaKey) && e.key === ',') {
            e.preventDefault();
            this.openSettings();
        }
        
        // Ctrl/Cmd + F: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            focusElement(this.elements.searchInput);
        }
    }
    
    /**
     * Update send button state
     */
    updateSendButton() {
        const hasText = this.elements.messageInput.value.trim().length > 0;
        this.elements.sendBtn.disabled = !hasText;
    }
    
    /**
     * Update token count display
     */
    updateTokenCount() {
        const text = this.elements.messageInput.value;
        const tokenCount = estimateTokenCount(text);
        const totalTokens = this.getTotalMessageTokens() + tokenCount;
        
        this.elements.tokenCount.textContent = `${totalTokens} / ${this.elements.maxTokens?.value || 32000} jetons`;
    }
    
    /**
     * Get total tokens from all messages
     * @returns {number} Total tokens
     */
    getTotalMessageTokens() {
        const messages = querySelectorAll('.message-bubble', this.elements.messages);
        let total = 0;
        messages.forEach(msg => {
            total += estimateTokenCount(msg.textContent);
        });
        return total;
    }
    
    /**
     * Handle search input
     * @param {Event} e - Input event
     */
    handleSearch(e) {
        const query = e.target.value.toLowerCase();
        if (query) {
            addClass(this.elements.clearSearchBtn, 'visible');
        } else {
            removeClass(this.elements.clearSearchBtn, 'visible');
        }
        this.emit('search', { query });
    }
    
    /**
     * Clear search
     */
    clearSearch() {
        this.elements.searchInput.value = '';
        removeClass(this.elements.clearSearchBtn, 'visible');
        this.emit('search', { query: '' });
    }
    
    /**
     * Toggle sidebar (mobile)
     */
    toggleSidebar() {
        toggleClass(this.elements.sidebar, 'active');
    }
    
    /**
     * Setup theme
     */
    setupTheme() {
        const theme = localStorage.getItem('theme') || 'system';
        this.applyTheme(theme);
    }
    
    /**
     * Apply theme
     * @param {string} theme - Theme name
     */
    applyTheme(theme) {
        const html = document.documentElement;
        
        // Remove all theme classes
        html.removeAttribute('data-theme');
        
        // Apply selected theme
        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            html.setAttribute('data-theme', isDark ? 'dark' : 'light');
        } else {
            html.setAttribute('data-theme', theme);
        }
        
        localStorage.setItem('theme', theme);
    }
    
    /**
     * Setup font size
     */
    setupFontSize() {
        const fontSize = localStorage.getItem('fontSize') || 'medium';
        this.applyFontSize(fontSize);
    }
    
    /**
     * Apply font size
     * @param {string} size - Font size
     */
    applyFontSize(size) {
        const html = document.documentElement;
        html.removeAttribute('data-font-size');
        if (size !== 'medium') {
            html.setAttribute('data-font-size', size);
        }
        localStorage.setItem('fontSize', size);
    }
    
    /**
     * Show loading screen
     */
    showLoading() {
        addClass(this.elements.loadingScreen, 'hidden');
    }
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        removeClass(this.elements.loadingScreen, 'hidden');
    }
    
    /**
     * Open settings modal
     */
    openSettings() {
        addClass(this.elements.settingsModal, 'active');
        this.loadSettingsForm();
    }
    
    /**
     * Close settings modal
     */
    closeSettings() {
        removeClass(this.elements.settingsModal, 'active');
    }
    
    /**
     * Open share modal
     */
    openShareModal() {
        addClass(this.elements.shareModal, 'active');
    }
    
    /**
     * Close share modal
     */
    closeShareModal() {
        removeClass(this.elements.shareModal, 'active');
    }
    
    /**
     * Load settings form with current values
     */
    loadSettingsForm() {
        const config = JSON.parse(localStorage.getItem('chatbotConfig') || '{}');
        
        // API Settings
        if (config.api) {
            this.elements.apiProvider.value = config.api.provider || 'mistral';
            this.elements.apiUrl.value = config.api.url || '';
            this.elements.apiKey.value = config.api.key || '';
            this.elements.apiModel.value = config.api.model || 'mistral-tiny';
        }
        
        // UI Settings
        if (config.settings) {
            this.elements.temperature.value = config.settings.temperature || 0.7;
            this.elements.temperatureValue.textContent = this.elements.temperature.value;
            this.elements.maxTokens.value = config.settings.maxTokens || 32000;
            this.elements.theme.value = config.settings.theme || 'system';
            this.elements.fontSize.value = config.settings.fontSize || 'medium';
            this.elements.enableStreaming.checked = config.settings.enableStreaming !== false;
            this.elements.saveHistory.checked = config.settings.saveHistory !== false;
            this.elements.enterToSend.checked = config.settings.enterToSend || false;
        }
        
        this.handleProviderChange({ target: this.elements.apiProvider });
    }
    
    /**
     * Save settings from form
     */
    saveSettings() {
        const config = {
            api: {
                provider: this.elements.apiProvider.value,
                url: this.elements.apiUrl.value.trim(),
                key: this.elements.apiKey.value.trim(),
                model: this.elements.apiModel.value
            },
            settings: {
                temperature: parseFloat(this.elements.temperature.value),
                maxTokens: parseInt(this.elements.maxTokens.value),
                theme: this.elements.theme.value,
                fontSize: this.elements.fontSize.value,
                enableStreaming: this.elements.enableStreaming.checked,
                saveHistory: this.elements.saveHistory.checked,
                enterToSend: this.elements.enterToSend.checked
            }
        };
        
        localStorage.setItem('chatbotConfig', JSON.stringify(config));
        
        // Apply theme and font size immediately
        this.applyTheme(config.settings.theme);
        this.applyFontSize(config.settings.fontSize);
        
        // Update model info display
        this.updateModelInfo(config.api.model);
        
        this.closeSettings();
        this.emit('settingsSaved', config);
        showToast('Paramètres enregistrés', 'success');
    }
    
    /**
     * Handle provider change
     * @param {Event} e - Change event
     */
    handleProviderChange(e) {
        const provider = e.target.value;
        const providers = {
            mistral: 'https://api.mistral.ai/v1/chat/completions',
            openai: 'https://api.openai.com/v1/chat/completions',
            groq: 'https://api.groq.com/v1/chat/completions'
        };
        
        this.elements.apiUrl.value = providers[provider] || '';
        
        // Update model options based on provider
        const models = {
            mistral: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large'],
            openai: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
            groq: ['llama3-8b-instant', 'llama3-70b-versatile', 'mixtral-8x7b-32768', 'gemma-7b-it']
        };
        
        this.updateModelOptions(models[provider] || models.mistral);
    }
    
    /**
     * Update model select options
     * @param {Array} models - Array of model names
     */
    updateModelOptions(models) {
        const modelSelect = this.elements.apiModel;
        const currentValue = modelSelect.value;
        
        emptyElement(modelSelect);
        
        models.forEach(model => {
            const option = createElement('option', {
                value: model,
                textContent: model
            });
            modelSelect.appendChild(option);
        });
        
        // Restore previous selection if available
        if (models.includes(currentValue)) {
            modelSelect.value = currentValue;
        }
    }
    
    /**
     * Update temperature value display
     * @param {Event} e - Input event
     */
    updateTemperatureValue(e) {
        this.elements.temperatureValue.textContent = e.target.value;
    }
    
    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        const type = this.elements.apiKey.type === 'password' ? 'text' : 'password';
        this.elements.apiKey.type = type;
        this.elements.togglePassword.innerHTML = '';
        
        const icon = type === 'password' 
            ? 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' + 
              'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' 
            : 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' + 
              'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' + 
              'M12 3v18';
        
        this.elements.togglePassword.appendChild(createIcon(icon, {
            width: '18',
            height: '18'
        }));
    }
    
    /**
     * Update model info display
     * @param {string} model - Model name
     */
    updateModelInfo(model) {
        this.elements.modelInfo.textContent = `Modèle: ${model}`;
    }
    
    /**
     * Render conversations in sidebar
     * @param {Array} conversations - Array of conversations
     * @param {string} currentId - Current conversation ID
     * @param {string} searchQuery - Search query
     */
    renderConversations(conversations, currentId = null, searchQuery = '') {
        emptyElement(this.elements.chatHistory);
        
        if (conversations.length === 0) {
            const emptyState = createElement('div', {
                className: 'empty-state',
                textContent: 'Aucune conversation'
            });
            this.elements.chatHistory.appendChild(emptyState);
            return;
        }
        
        // Filter conversations based on search query
        const filteredConversations = searchQuery 
            ? conversations.filter(conv => 
                conv.title.toLowerCase().includes(searchQuery.toLowerCase()))
            : conversations;
        
        // Sort: pinned first, then by updatedAt (newest first)
        filteredConversations.sort((a, b) => {
            if (a.pinned !== b.pinned) return b.pinned - a.pinned;
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
        
        filteredConversations.forEach(conv => {
            const item = createConversationItem(conv, conv.id === currentId);
            
            // Add click handler
            addEventListener(item, 'click', (e) => {
                if (e.target.classList.contains('delete-chat')) return;
                this.emit('loadConversation', { id: conv.id });
            });
            
            // Add delete handler
            const deleteBtn = querySelector('.delete-chat', item);
            if (deleteBtn) {
                addEventListener(deleteBtn, 'click', (e) => {
                    e.stopPropagation();
                    this.emit('deleteConversation', { id: conv.id });
                });
            }
            
            this.elements.chatHistory.appendChild(item);
        });
    }
    
    /**
     * Render messages in chat
     * @param {Array} messages - Array of messages
     * @param {boolean} isLoading - Is loading
     * @param {boolean} isTyping - Is AI typing
     */
    renderMessages(messages, isLoading = false, isTyping = false) {
        emptyElement(this.elements.messages);
        
        if (messages.length === 0 && !isLoading && !isTyping) {
            // Show welcome message
            this.elements.welcomeMessage.style.display = 'flex';
            return;
        }
        
        this.elements.welcomeMessage.style.display = 'none';
        
        messages.forEach(msg => {
            const messageEl = createMessageElement(msg, msg.role);
            messageEl.querySelector('.message-bubble').innerHTML = formatMessage(msg.content);
            this.elements.messages.appendChild(messageEl);
        });
        
        // Show typing indicator if AI is typing
        if (isTyping) {
            const typingEl = createTypingIndicator();
            this.elements.messages.appendChild(typingEl);
        }
        
        // Scroll to bottom
        scrollToBottom(this.elements.messages);
    }
    
    /**
     * Add a message to the chat
     * @param {Object} message - Message to add
     */
    addMessage(message) {
        const messageEl = createMessageElement(message, message.role);
        messageEl.querySelector('.message-bubble').innerHTML = formatMessage(message.content);
        this.elements.messages.appendChild(messageEl);
        scrollToBottom(this.elements.messages);
    }
    
    /**
     * Update a message in the chat
     * @param {string} id - Message ID
     * @param {Object} updates - Updates to apply
     */
    updateMessage(id, updates) {
        const messageEl = querySelector(`.message[data-id="${id}"]`);
        if (!messageEl) return;
        
        if (updates.content) {
            const bubble = querySelector('.message-bubble', messageEl);
            if (bubble) {
                bubble.innerHTML = formatMessage(updates.content);
            }
        }
    }
    
    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        const typingEl = createTypingIndicator();
        this.elements.messages.appendChild(typingEl);
        scrollToBottom(this.elements.messages);
    }
    
    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingEl = querySelector('.typing', this.elements.messages);
        if (typingEl) {
            typingEl.remove();
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorEl = createErrorElement(message);
        this.elements.messages.appendChild(errorEl);
        scrollToBottom(this.elements.messages);
    }
    
    /**
     * Update chat title
     * @param {string} title - New title
     */
    updateChatTitle(title) {
        this.elements.chatTitleInput.value = title;
    }
    
    /**
     * Clear message input
     */
    clearInput() {
        this.elements.messageInput.value = '';
        autoResizeTextarea(this.elements.messageInput);
        this.updateSendButton();
        this.updateTokenCount();
    }
    
    /**
     * Focus message input
     */
    focusInput() {
        focusElement(this.elements.messageInput);
    }
    
    /**
     * Show stop button
     */
    showStopButton() {
        this.elements.sendBtn.style.display = 'none';
        this.elements.stopBtn.style.display = 'flex';
    }
    
    /**
     * Hide stop button
     */
    hideStopButton() {
        this.elements.sendBtn.style.display = 'flex';
        this.elements.stopBtn.style.display = 'none';
    }
    
    /**
     * Enable/disable input
     * @param {boolean} disabled - Is disabled
     */
    setInputDisabled(disabled) {
        this.elements.messageInput.disabled = disabled;
        this.elements.sendBtn.disabled = disabled;
    }
}

// Singleton instance
export const uiManager = new UIManager();

export default UIManager;
