/**
 * UI Manager Class
 * Manages all UI operations for the Claude AI Chatbot Clone
 * Enhanced for Local AI with training and knowledge management
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
        this.currentPreviewCode = null;
        this.highlightJSLoaded = false;
        this.highlightJSRetries = 0;
        this.maxHighlightJSRetries = 5;
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
            
            // Local AI Buttons (new)
            trainAIBtn: getElementById('trainAIBtn'),
            clearAIBtn: getElementById('clearAIBtn'),
            exportAIBtn: getElementById('exportAIBtn'),
            importAIBtn: getElementById('importAIBtn'),
            
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
        this.injectCodeStyles();
        this.injectCodePreviewModal();
        this.injectLocalAIControls();
        
        // Hide loading screen after UI is ready
        setTimeout(() => this.hideLoading(), 500);
    }
    
    /**
     * Inject Local AI controls into the UI
     */
    injectLocalAIControls() {
        // Check if controls already exist
        if (this.elements.trainAIBtn) return;
        
        // Create Local AI controls container
        const aiControls = createElement('div', {
            className: 'local-ai-controls'
        });
        
        aiControls.innerHTML = `
            <div class="ai-controls-group">
                <button class="ai-control-btn" id="trainAIBtn" title="Entraîner l'IA avec les conversations actuelles">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    <span>Entraîner l'IA</span>
                </button>
                <button class="ai-control-btn" id="clearAIBtn" title="Effacer la mémoire de l'IA">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <span>Effacer mémoire</span>
                </button>
                <button class="ai-control-btn" id="exportAIBtn" title="Exporter les connaissances de l'IA">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>Exporter IA</span>
                </button>
                <button class="ai-control-btn" id="importAIBtn" title="Importer des connaissances pour l'IA">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>Importer IA</span>
                </button>
            </div>
        `;
        
        // Insert controls before the input area
        const inputArea = querySelector('.input-area');
        if (inputArea) {
            inputArea.parentNode.insertBefore(aiControls, inputArea);
        }
        
        // Update element references
        this.elements.trainAIBtn = getElementById('trainAIBtn');
        this.elements.clearAIBtn = getElementById('clearAIBtn');
        this.elements.exportAIBtn = getElementById('exportAIBtn');
        this.elements.importAIBtn = getElementById('importAIBtn');
    }
    
    /**
     * Inject code highlighting styles and library
     */
    injectCodeStyles() {
        // Inject code-styles.css
        const codeStyles = createElement('link', {
            rel: 'stylesheet',
            href: 'styles/code-styles.css'
        });
        document.head.appendChild(codeStyles);
        
        // Load highlight.js if not already loaded
        this.loadHighlightJS();
    }
    
    /**
     * Load highlight.js with retry logic
     */
    loadHighlightJS() {
        if (this.highlightJSLoaded || this.highlightJSRetries >= this.maxHighlightJSRetries) {
            return;
        }
        
        if (window.hljs) {
            this.setupHighlightJS();
            return;
        }
        
        // Check if script is already in the DOM
        const existingScript = document.querySelector('script[src*="highlight.js"]');
        if (!existingScript) {
            const hljsScript = createElement('script', {
                src: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
                async: true
            });
            hljsScript.onload = () => this.setupHighlightJS();
            hljsScript.onerror = () => {
                this.highlightJSRetries++;
                console.warn(`Failed to load highlight.js (attempt ${this.highlightJSRetries}/${this.maxHighlightJSRetries})`);
                if (this.highlightJSRetries < this.maxHighlightJSRetries) {
                    setTimeout(() => this.loadHighlightJS(), 1000);
                } else {
                    console.error('highlight.js failed to load after multiple attempts');
                    showToast('Impossible de charger la coloration syntaxique', 'error');
                }
            };
            document.head.appendChild(hljsScript);
        } else {
            // Script exists, wait for it to load
            this.highlightJSRetries++;
            if (this.highlightJSRetries < this.maxHighlightJSRetries) {
                setTimeout(() => this.loadHighlightJS(), 500);
            }
        }
    }
    
    /**
     * Setup Highlight.js
     */
    setupHighlightJS() {
        if (!window.hljs) {
            console.warn('highlight.js not loaded yet');
            return;
        }
        
        if (this.highlightJSLoaded) return;
        this.highlightJSLoaded = true;
        
        try {
            // Register languages
            const languages = ['javascript', 'python', 'html', 'css', 'bash', 'json', 'typescript', 'java', 'c', 'cpp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin'];
            languages.forEach(lang => {
                try {
                    import(`https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/es/languages/${lang}.min.js`)
                        .then(module => {
                            if (module && module.default) {
                                window.hljs.registerLanguage(lang, module.default);
                            }
                        })
                        .catch(() => {
                            console.warn(`Could not load syntax highlighting for ${lang}`);
                        });
                } catch (e) {
                    console.warn(`Failed to load syntax highlighting for ${lang}: ${e.message}`);
                }
            });
            
            window.hljs.configure({
                tabReplace: '    ',
                useBR: false,
                languages: languages
            });
            
            console.log('highlight.js configured successfully');
        } catch (e) {
            console.error('Error configuring highlight.js:', e);
        }
    }
    
    /**
     * Highlight all code blocks in the chat
     */
    highlightAllCodeBlocks() {
        if (!window.hljs || !this.highlightJSLoaded) {
            return;
        }
        
        try {
            querySelectorAll('pre code').forEach((block) => {
                if (!block.classList.contains('hljs')) {
                    window.hljs.highlightElement(block);
                }
            });
        } catch (e) {
            console.error('Error highlighting code blocks:', e);
        }
    }
    
    /**
     * Inject code preview modal
     */
    injectCodePreviewModal() {
        if (document.getElementById('codePreviewModal')) return;
        
        const modal = createElement('div', {
            id: 'codePreviewModal',
            className: 'modal-overlay'
        });
        
        modal.innerHTML = `
            <div class="modal code-preview-modal">
                <div class="modal-header">
                    <h2>Prévisualiser le code</h2>
                    <button class="close-btn close-code-preview-btn" aria-label="Fermer">
                        ${createIcon('M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z', { width: '18', height: '18' })}
                    </button>
                </div>
                <div class="modal-body code-preview-body">
                    <div class="code-preview-content"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-code-preview-btn">Fermer</button>
                    <button class="btn btn-primary run-code-preview-btn">Exécuter</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Setup event listeners
        querySelectorAll('.close-code-preview-btn', modal).forEach(btn => {
            addEventListener(btn, 'click', () => this.closeCodePreview());
        });
        
        const runBtn = querySelector('.run-code-preview-btn', modal);
        if (runBtn) {
            addEventListener(runBtn, 'click', () => this.runCodePreview());
        }
        
        addEventListener(modal, 'click', (e) => {
            if (e.target === modal) this.closeCodePreview();
        });
        
        // Store references
        this.codePreviewModal = modal;
        this.codePreviewContent = querySelector('.code-preview-content', modal);
    }
    
    /**
     * Open code preview
     * @param {string} code - Code to preview
     * @param {string} language - Code language
     */
    openCodePreview(code, language = 'javascript') {
        if (!this.codePreviewModal) return;
        
        emptyElement(this.codePreviewContent);
        
        const codeElement = createElement('pre');
        const codeBlock = createElement('code', {
            className: `language-${language}`,
            textContent: code
        });
        codeElement.appendChild(codeBlock);
        this.codePreviewContent.appendChild(codeElement);
        
        this.currentPreviewCode = { code, language };
        addClass(this.codePreviewModal, 'active');
        
        // Highlight after a small delay
        setTimeout(() => {
            if (window.hljs && this.highlightJSLoaded) {
                window.hljs.highlightElement(codeBlock);
            }
        }, 10);
    }
    
    /**
     * Close code preview
     */
    closeCodePreview() {
        if (!this.codePreviewModal) return;
        removeClass(this.codePreviewModal, 'active');
        this.currentPreviewCode = null;
    }
    
    /**
     * Run code from preview
     */
    runCodePreview() {
        if (!this.currentPreviewCode) return;
        
        const { code, language } = this.currentPreviewCode;
        this.runCode(code, language);
    }
    
    /**
     * Run code
     * @param {string} code - Code to run
     * @param {string} language - Code language
     */
    runCode(code, language) {
        if (language !== 'javascript' && language !== 'js') {
            showToast('Seul le JavaScript peut être exécuté directement', 'error');
            return;
        }
        
        try {
            const sandbox = {
                console: {
                    log: (...args) => this.showCodeOutput(args, 'log'),
                    error: (...args) => this.showCodeOutput(args, 'error'),
                    warn: (...args) => this.showCodeOutput(args, 'warn'),
                    info: (...args) => this.showCodeOutput(args, 'info')
                },
                result: null
            };
            
            // Wrap code in a function for safety
            const wrappedCode = `
                (function(sandbox) {
                    'use strict';
                    with (sandbox) {
                        ${code}
                    }
                    return sandbox;
                })
            `;
            
            const func = new Function('sandbox', wrappedCode);
            func(sandbox);
            
            this.showCodeOutput(['Code exécuté avec succès!'], 'success');
        } catch (error) {
            this.showCodeOutput(['Erreur: ' + error.message], 'error');
        }
    }
    
    /**
     * Show code output
     * @param {Array} args - Output arguments
     * @param {string} type - Output type
     */
    showCodeOutput(args, type) {
        const output = args.map(arg => {
            if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
            }
            return String(arg);
        }).join(' ');
        
        const outputEl = createElement('div', {
            className: `code-output ${type}`
        });
        outputEl.textContent = output;
        
        const messageEl = createElement('div', {
            className: 'message ai'
        });
        
        const avatar = createElement('div', {
            className: 'message-avatar'
        });
        avatar.appendChild(createIcon('M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', { width: '18', height: '18' }));
        
        const content = createElement('div', {
            className: 'message-content'
        });
        content.appendChild(outputEl);
        
        const time = createElement('div', {
            className: 'message-time',
            textContent: new Date().toLocaleTimeString('fr-FR')
        });
        content.appendChild(time);
        
        messageEl.append(avatar, content);
        this.elements.messages.appendChild(messageEl);
        scrollToBottom(this.elements.messages);
    }
    
    /**
     * Create enhanced code block
     * @param {string} code - Code content
     * @param {string} language - Code language
     * @returns {HTMLElement} Code block element
     */
    createCodeBlock(code, language) {
        const container = createElement('div', {
            className: 'code-block-container'
        });
        
        // Header
        const header = createElement('div', {
            className: 'code-block-header'
        });
        
        const langSpan = createElement('span', {
            className: 'code-block-language',
            textContent: language || 'text'
        });
        header.appendChild(langSpan);
        
        const actions = createElement('div', {
            className: 'code-block-actions'
        });
        
        // Copy button
        const copyBtn = createElement('button', {
            className: 'code-block-action-btn copy-code-btn',
            title: 'Copier',
            innerHTML: createIcon('M16 1c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2H4zm12 0h-8v2h8V1z', { width: '14', height: '14' })
        });
        
        // Preview button
        const previewBtn = createElement('button', {
            className: 'code-block-action-btn preview-code-btn',
            title: 'Prévisualiser',
            innerHTML: createIcon('M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z', { width: '14', height: '14' })
        });
        
        // Run button (for JS)
        const runBtn = createElement('button', {
            className: 'code-block-action-btn run-code-btn',
            title: 'Exécuter',
            innerHTML: createIcon('M8 5v14l11-7z', { width: '14', height: '14' })
        });
        
        actions.append(copyBtn, previewBtn);
        if (language === 'javascript' || language === 'js') {
            actions.appendChild(runBtn);
        }
        header.appendChild(actions);
        container.appendChild(header);
        
        // Code content
        const pre = createElement('pre');
        const codeEl = createElement('code', {
            className: `language-${language || 'text'}`,
            textContent: code
        });
        pre.appendChild(codeEl);
        container.appendChild(pre);
        
        // Add event listeners
        copyBtn.addEventListener('click', () => this.copyCode(code));
        previewBtn.addEventListener('click', () => this.openCodePreview(code, language));
        runBtn.addEventListener('click', () => this.runCode(code, language));
        
        // Highlight code if possible
        if (window.hljs && this.highlightJSLoaded) {
            try {
                window.hljs.highlightElement(codeEl);
            } catch (e) {
                console.warn('Could not highlight code:', e);
            }
        }
        
        return container;
    }
    
    /**
     * Copy code to clipboard
     * @param {string} code - Code to copy
     */
    copyCode(code) {
        navigator.clipboard.writeText(code).then(() => {
            showToast('Code copié dans le presse-papiers', 'success');
        }).catch(() => {
            showToast('Erreur lors de la copie', 'error');
        });
    }
    
    /**
     * Format message with enhanced code blocks
     * @param {string} content - Message content
     * @returns {string} Formatted HTML
     */
    formatMessageWithCodeBlocks(content) {
        let formatted = formatMessage(content);
        
        const tempDiv = createElement('div');
        tempDiv.innerHTML = formatted;
        
        const codeBlocks = tempDiv.querySelectorAll('pre code');
        codeBlocks.forEach((codeBlock) => {
            const code = codeBlock.textContent;
            const language = codeBlock.className.match(/language-(\w+)/)?.[1] || 'text';
            
            const parentPre = codeBlock.parentElement;
            const container = this.createCodeBlock(code, language);
            parentPre.replaceWith(container);
        });
        
        return tempDiv.innerHTML;
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Sidebar
        if (this.elements.newChatBtn) addEventListener(this.elements.newChatBtn, 'click', () => this.emit('newChat'));
        if (this.elements.settingsBtn) addEventListener(this.elements.settingsBtn, 'click', () => this.openSettings());
        if (this.elements.mobileMenuBtn) addEventListener(this.elements.mobileMenuBtn, 'click', () => this.toggleSidebar());
        
        // Search
        if (this.elements.searchInput) addEventListener(this.elements.searchInput, 'input', (e) => this.handleSearch(e));
        if (this.elements.clearSearchBtn) addEventListener(this.elements.clearSearchBtn, 'click', () => this.clearSearch());
        
        // Chat
        if (this.elements.messageInput) {
            addEventListener(this.elements.messageInput, 'input', () => this.handleInputChange());
            addEventListener(this.elements.messageInput, 'keydown', (e) => this.handleKeyDown(e));
        }
        if (this.elements.sendBtn) addEventListener(this.elements.sendBtn, 'click', () => this.emit('sendMessage'));
        if (this.elements.stopBtn) addEventListener(this.elements.stopBtn, 'click', () => this.emit('stopStream'));
        if (this.elements.copyChatBtn) addEventListener(this.elements.copyChatBtn, 'click', () => this.emit('copyChat'));
        if (this.elements.shareChatBtn) addEventListener(this.elements.shareChatBtn, 'click', () => this.openShareModal());
        if (this.elements.deleteChatBtn) addEventListener(this.elements.deleteChatBtn, 'click', () => this.emit('deleteChat'));
        if (this.elements.closeChatBtn) addEventListener(this.elements.closeChatBtn, 'click', () => this.emit('closeChat'));
        
        // Local AI Controls
        if (this.elements.trainAIBtn) addEventListener(this.elements.trainAIBtn, 'click', () => this.emit('trainAI'));
        if (this.elements.clearAIBtn) addEventListener(this.elements.clearAIBtn, 'click', () => this.emit('clearAIKnowledge'));
        if (this.elements.exportAIBtn) addEventListener(this.elements.exportAIBtn, 'click', () => this.emit('exportAIKnowledge'));
        if (this.elements.importAIBtn) addEventListener(this.elements.importAIBtn, 'click', () => this.emit('importAIKnowledge'));
        
        // Settings Modal
        if (this.elements.closeSettingsBtn) addEventListener(this.elements.closeSettingsBtn, 'click', () => this.closeSettings());
        if (this.elements.cancelSettingsBtn) addEventListener(this.elements.cancelSettingsBtn, 'click', () => this.closeSettings());
        if (this.elements.saveSettingsBtn) addEventListener(this.elements.saveSettingsBtn, 'click', () => this.saveSettings());
        if (this.elements.togglePassword) addEventListener(this.elements.togglePassword, 'click', () => this.togglePasswordVisibility());
        if (this.elements.apiProvider) addEventListener(this.elements.apiProvider, 'change', (e) => this.handleProviderChange(e));
        if (this.elements.temperature) addEventListener(this.elements.temperature, 'input', (e) => this.updateTemperatureValue(e));
        
        // Share Modal
        if (this.elements.closeShareBtn) addEventListener(this.elements.closeShareBtn, 'click', () => this.closeShareModal());
        if (this.elements.copyLinkBtn) addEventListener(this.elements.copyLinkBtn, 'click', () => this.emit('copyLink'));
        if (this.elements.exportJsonBtn) addEventListener(this.elements.exportJsonBtn, 'click', () => this.emit('exportJson'));
        if (this.elements.exportHtmlBtn) addEventListener(this.elements.exportHtmlBtn, 'click', () => this.emit('exportHtml'));
        
        // Quick prompts
        querySelectorAll('.quick-prompt').forEach(btn => {
            addEventListener(btn, 'click', () => {
                const prompt = btn.dataset.prompt;
                if (this.elements.messageInput) {
                    this.elements.messageInput.value = prompt;
                    focusElement(this.elements.messageInput);
                    this.emit('sendMessage');
                }
            });
        });
        
        // Modal close on overlay click
        if (this.elements.settingsModal) {
            addEventListener(this.elements.settingsModal, 'click', (e) => {
                if (e.target === this.elements.settingsModal) {
                    this.closeSettings();
                }
            });
        }
        
        if (this.elements.shareModal) {
            addEventListener(this.elements.shareModal, 'click', (e) => {
                if (e.target === this.elements.shareModal) {
                    this.closeShareModal();
                }
            });
        }
        
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
        if (this.elements.messageInput) {
            autoResizeTextarea(this.elements.messageInput);
            this.updateSendButton();
            this.updateTokenCount();
        }
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
            this.closeCodePreview();
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
            if (this.elements.searchInput) {
                focusElement(this.elements.searchInput);
            }
        }
    }
    
    /**
     * Update send button state
     */
    updateSendButton() {
        if (this.elements.sendBtn) {
            const hasText = this.elements.messageInput?.value.trim().length > 0;
            this.elements.sendBtn.disabled = !hasText;
        }
    }
    
    /**
     * Update token count display
     */
    updateTokenCount() {
        if (this.elements.tokenCount && this.elements.messageInput) {
            const text = this.elements.messageInput.value;
            const tokenCount = estimateTokenCount(text);
            const totalTokens = this.getTotalMessageTokens() + tokenCount;
            
            this.elements.tokenCount.textContent = `${totalTokens} / ${this.elements.maxTokens?.value || 32000} jetons`;
        }
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
        if (this.elements.clearSearchBtn) {
            if (query) {
                addClass(this.elements.clearSearchBtn, 'visible');
            } else {
                removeClass(this.elements.clearSearchBtn, 'visible');
            }
        }
        this.emit('search', { query });
    }
    
    /**
     * Clear search
     */
    clearSearch() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        if (this.elements.clearSearchBtn) {
            removeClass(this.elements.clearSearchBtn, 'visible');
        }
        this.emit('search', { query: '' });
    }
    
    /**
     * Toggle sidebar (mobile)
     */
    toggleSidebar() {
        if (this.elements.sidebar) {
            toggleClass(this.elements.sidebar, 'active');
        }
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
        if (this.elements.loadingScreen) {
            addClass(this.elements.loadingScreen, 'hidden');
        }
    }
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        if (this.elements.loadingScreen) {
            removeClass(this.elements.loadingScreen, 'hidden');
        }
    }
    
    /**
     * Open settings modal
     */
    openSettings() {
        if (this.elements.settingsModal) {
            addClass(this.elements.settingsModal, 'active');
            this.loadSettingsForm();
        }
    }
    
    /**
     * Close settings modal
     */
    closeSettings() {
        if (this.elements.settingsModal) {
            removeClass(this.elements.settingsModal, 'active');
        }
    }
    
    /**
     * Open share modal
     */
    openShareModal() {
        if (this.elements.shareModal) {
            addClass(this.elements.shareModal, 'active');
        }
    }
    
    /**
     * Close share modal
     */
    closeShareModal() {
        if (this.elements.shareModal) {
            removeClass(this.elements.shareModal, 'active');
        }
    }
    
    /**
     * Load settings form with current values
     * Modified for Local AI
     */
    loadSettingsForm() {
        const config = JSON.parse(localStorage.getItem('chatbotConfig') || '{}');
        
        // For Local AI, we use default values
        if (this.elements.apiProvider) {
            this.elements.apiProvider.value = config.api?.provider || 'local';
        }
        if (this.elements.apiUrl) {
            this.elements.apiUrl.value = config.api?.url || 'IA Locale (100% local)';
            this.elements.apiUrl.disabled = true;
            this.elements.apiUrl.style.color = '#666';
            this.elements.apiUrl.style.cursor = 'not-allowed';
        }
        if (this.elements.apiKey) {
            this.elements.apiKey.value = config.api?.key || 'Aucune clé nécessaire (local)';
            this.elements.apiKey.disabled = true;
            this.elements.apiKey.style.color = '#666';
            this.elements.apiKey.style.cursor = 'not-allowed';
        }
        if (this.elements.apiModel) {
            this.elements.apiModel.value = config.api?.model || 'IA Locale v1.0';
            this.elements.apiModel.disabled = true;
            this.elements.apiModel.style.color = '#666';
            this.elements.apiModel.style.cursor = 'not-allowed';
        }
        
        // UI Settings
        if (config.settings) {
            if (this.elements.temperature) {
                this.elements.temperature.value = config.settings.temperature || 0.7;
                this.elements.temperatureValue.textContent = this.elements.temperature.value;
            }
            if (this.elements.maxTokens) {
                this.elements.maxTokens.value = config.settings.maxTokens || 32000;
            }
            if (this.elements.theme) {
                this.elements.theme.value = config.settings.theme || 'system';
            }
            if (this.elements.fontSize) {
                this.elements.fontSize.value = config.settings.fontSize || 'medium';
            }
            if (this.elements.enableStreaming) {
                this.elements.enableStreaming.checked = config.settings.enableStreaming !== false;
            }
            if (this.elements.saveHistory) {
                this.elements.saveHistory.checked = config.settings.saveHistory !== false;
            }
            if (this.elements.enterToSend) {
                this.elements.enterToSend.checked = config.settings.enterToSend || false;
            }
        }
        
        // Add Local AI info to the settings modal
        this.injectLocalAISettingsInfo();
    }
    
    /**
     * Inject Local AI info into settings modal
     */
    injectLocalAISettingsInfo() {
        const settingsBody = querySelector('.modal-body', this.elements.settingsModal);
        if (!settingsBody) return;
        
        // Check if info already exists
        if (querySelector('.local-ai-info', settingsBody)) return;
        
        const infoDiv = createElement('div', {
            className: 'local-ai-info',
            style: 'margin-top: 20px; padding: 15px; background: rgba(88, 166, 255, 0.1); border-radius: 8px; border-left: 4px solid #58a6ff;'
        });
        
        infoDiv.innerHTML = `
            <h4 style="margin-top: 0; color: #58a6ff;">✨ IA Locale Activée</h4>
            <p style="margin-bottom: 10px;"><strong>Vos données restent 100% locales !</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Toutes les conversations sont stockées dans votre navigateur</li>
                <li>L'IA apprend de vos échanges pour s'améliorer</li>
                <li>Aucune donnée n'est envoyée à des serveurs externes</li>
                <li>Vous pouvez entraîner, exporter et importer les connaissances</li>
            </ul>
            <p style="margin-bottom: 0; font-size: 14px; color: #666;">
                Utilisez les boutons en bas de l'interface pour gérer l'IA.
            </p>
        `;
        
        settingsBody.appendChild(infoDiv);
    }
    
    /**
     * Save settings
     */
    saveSettings() {
        const config = {
            api: {
                provider: this.elements.apiProvider?.value || 'local',
                url: this.elements.apiUrl?.value || 'IA Locale',
                key: this.elements.apiKey?.value || '',
                model: this.elements.apiModel?.value || 'IA Locale v1.0'
            },
            settings: {
                temperature: parseFloat(this.elements.temperature?.value) || 0.7,
                maxTokens: parseInt(this.elements.maxTokens?.value) || 32000,
                theme: this.elements.theme?.value || 'system',
                fontSize: this.elements.fontSize?.value || 'medium',
                enableStreaming: this.elements.enableStreaming?.checked !== false,
                saveHistory: this.elements.saveHistory?.checked !== false,
                enterToSend: this.elements.enterToSend?.checked || false
            }
        };
        
        localStorage.setItem('chatbotConfig', JSON.stringify(config));
        
        // Apply theme and font size immediately
        this.applyTheme(config.settings.theme);
        this.applyFontSize(config.settings.fontSize);
        
        this.closeSettings();
        this.emit('settingsSaved', config);
        showToast('Paramètres enregistrés', 'success');
    }
    
    /**
     * Handle provider change
     * @param {Event} e - Change event
     */
    handleProviderChange(e) {
        if (!this.elements.apiProvider || !this.elements.apiUrl) return;
        
        const provider = e.target.value;
        
        // For Local AI, disable URL and key fields
        if (provider === 'local' || provider === 'IA Locale') {
            if (this.elements.apiUrl) {
                this.elements.apiUrl.value = 'IA Locale (100% local)';
                this.elements.apiUrl.disabled = true;
                this.elements.apiUrl.style.color = '#666';
            }
            if (this.elements.apiKey) {
                this.elements.apiKey.value = 'Aucune clé nécessaire';
                this.elements.apiKey.disabled = true;
                this.elements.apiKey.style.color = '#666';
            }
            if (this.elements.apiModel) {
                this.elements.apiModel.value = 'IA Locale v1.0';
                this.elements.apiModel.disabled = true;
                this.elements.apiModel.style.color = '#666';
            }
        } else {
            // For other providers, enable fields (though we're using LocalAI)
            if (this.elements.apiUrl) {
                this.elements.apiUrl.disabled = false;
                this.elements.apiUrl.style.color = '';
            }
            if (this.elements.apiKey) {
                this.elements.apiKey.disabled = false;
                this.elements.apiKey.style.color = '';
            }
            if (this.elements.apiModel) {
                this.elements.apiModel.disabled = false;
                this.elements.apiModel.style.color = '';
            }
        }
    }
    
    /**
     * Update temperature value display
     * @param {Event} e - Input event
     */
    updateTemperatureValue(e) {
        if (this.elements.temperatureValue) {
            this.elements.temperatureValue.textContent = e.target.value;
        }
    }
    
    /**
     * Toggle password visibility
     */
    togglePasswordVisibility() {
        if (!this.elements.apiKey || !this.elements.togglePassword) return;
        
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
        if (this.elements.modelInfo) {
            // For Local AI, show custom message
            if (model === 'IA Locale' || model === 'IA Locale v1.0' || model === 'local') {
                this.elements.modelInfo.textContent = 'Modèle: IA Locale (100% local)';
            } else {
                this.elements.modelInfo.textContent = `Modèle: ${model}`;
            }
        }
    }
    
    /**
     * Render conversations in sidebar
     * @param {Array} conversations - Array of conversations
     * @param {string} currentId - Current conversation ID
     * @param {string} searchQuery - Search query
     */
    renderConversations(conversations, currentId = null, searchQuery = '') {
        if (!this.elements.chatHistory) return;
        
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
        if (!this.elements.messages || !this.elements.welcomeMessage) return;
        
        emptyElement(this.elements.messages);
        
        if (messages.length === 0 && !isLoading && !isTyping) {
            // Show welcome message for Local AI
            this.elements.welcomeMessage.style.display = 'flex';
            this.elements.welcomeMessage.innerHTML = `
                <div class="welcome-logo">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <h1>Bienvenue dans votre IA Locale !</h1>
                <p>Je suis une intelligence artificielle <strong>100% locale</strong> qui fonctionne entièrement dans votre navigateur.</p>
                <ul style="text-align: left; padding-left: 20px;">
                    <li>✅ Toutes vos données restent <strong>sur votre appareil</strong></li>
                    <li>✅ Je peux répondre à vos questions et générer du code</li>
                    <li>✅ J'apprends de nos conversations pour devenir plus intelligente</li>
                    <li>✅ Aucune connexion internet requise</li>
                </ul>
                <div class="quick-prompts">
                    <button class="quick-prompt" data-prompt="Explique-moi comment fonctionne une boucle for en JavaScript">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span>Expliquer du code</span>
                    </button>
                    <button class="quick-prompt" data-prompt="Génère un exemple de fonction JavaScript qui calcule la factorielle">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span>Générer du code</span>
                    </button>
                    <button class="quick-prompt" data-prompt="Quelles sont les bonnes pratiques en JavaScript moderne ?">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                        </svg>
                        <span>Meilleures pratiques</span>
                    </button>
                </div>
            `;
            return;
        }
        
        this.elements.welcomeMessage.style.display = 'none';
        
        messages.forEach(msg => {
            const messageEl = createMessageElement(msg, msg.role);
            const bubble = messageEl.querySelector('.message-bubble');
            if (bubble) {
                bubble.innerHTML = this.formatMessageWithCodeBlocks(msg.content);
            }
            this.elements.messages.appendChild(messageEl);
        });
        
        // Show typing indicator if AI is typing
        if (isTyping) {
            const typingEl = createTypingIndicator();
            this.elements.messages.appendChild(typingEl);
        }
        
        // Scroll to bottom
        scrollToBottom(this.elements.messages);
        
        // Highlight code blocks
        setTimeout(() => this.highlightAllCodeBlocks(), 50);
    }
    
    /**
     * Add a message to the chat
     * @param {Object} message - Message to add
     */
    addMessage(message) {
        if (!this.elements.messages) return;
        
        const messageEl = createMessageElement(message, message.role);
        const bubble = messageEl.querySelector('.message-bubble');
        if (bubble) {
            bubble.innerHTML = this.formatMessageWithCodeBlocks(message.content);
        }
        this.elements.messages.appendChild(messageEl);
        scrollToBottom(this.elements.messages);
        
        // Highlight code
        setTimeout(() => this.highlightAllCodeBlocks(), 50);
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
                bubble.innerHTML = this.formatMessageWithCodeBlocks(updates.content);
            }
        }
        
        // Re-highlight code
        setTimeout(() => this.highlightAllCodeBlocks(), 50);
    }
    
    /**
     * Show typing indicator
     */
    showTypingIndicator() {
        if (this.elements.messages) {
            const typingEl = createTypingIndicator();
            this.elements.messages.appendChild(typingEl);
            scrollToBottom(this.elements.messages);
        }
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
        if (this.elements.messages) {
            const errorEl = createErrorElement(message);
            this.elements.messages.appendChild(errorEl);
            scrollToBottom(this.elements.messages);
        }
    }
    
    /**
     * Update chat title
     * @param {string} title - New title
     */
    updateChatTitle(title) {
        if (this.elements.chatTitleInput) {
            this.elements.chatTitleInput.value = title;
        }
    }
    
    /**
     * Clear message input
     */
    clearInput() {
        if (this.elements.messageInput) {
            this.elements.messageInput.value = '';
            autoResizeTextarea(this.elements.messageInput);
            this.updateSendButton();
            this.updateTokenCount();
        }
    }
    
    /**
     * Focus message input
     */
    focusInput() {
        if (this.elements.messageInput) {
            focusElement(this.elements.messageInput);
        }
    }
    
    /**
     * Show stop button
     */
    showStopButton() {
        if (this.elements.sendBtn && this.elements.stopBtn) {
            this.elements.sendBtn.style.display = 'none';
            this.elements.stopBtn.style.display = 'flex';
        }
    }
    
    /**
     * Hide stop button
     */
    hideStopButton() {
        if (this.elements.sendBtn && this.elements.stopBtn) {
            this.elements.sendBtn.style.display = 'flex';
            this.elements.stopBtn.style.display = 'none';
        }
    }
    
    /**
     * Enable/disable input
     * @param {boolean} disabled - Is disabled
     */
    setInputDisabled(disabled) {
        if (this.elements.messageInput) {
            this.elements.messageInput.disabled = disabled;
        }
        if (this.elements.sendBtn) {
            this.elements.sendBtn.disabled = disabled;
        }
    }
}

// Singleton instance
export const uiManager = new UIManager();
export default UIManager;
