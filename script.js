// ===== Configuration =====
const CONFIG = {
    api: {
        url: "https://api.mistral.ai/v1/chat/completions", // URL par défaut (à changer)
        key: "", // Clé API à remplir dans config.json ou via les paramètres
        model: "mistral-tiny" // Modèle par défaut
    },
    maxTokens: 32000,
    temperature: 0.7,
    theme: "light" // light, dark, system
};

// ===== State =====
let state = {
    conversations: [],
    currentConversationId: null,
    messages: [],
    isLoading: false,
    isTyping: false,
    theme: CONFIG.theme
};

// ===== DOM Elements =====
const elements = {
    // Sidebar
    newChatBtn: document.getElementById("newChatBtn"),
    chatHistory: document.getElementById("chatHistory"),
    settingsBtn: document.getElementById("settingsBtn"),
    
    // Main
    messages: document.getElementById("messages"),
    messageInput: document.getElementById("messageInput"),
    sendBtn: document.getElementById("sendBtn"),
    currentChatTitle: document.getElementById("currentChatTitle"),
    copyChatBtn: document.getElementById("copyChatBtn"),
    deleteChatBtn: document.getElementById("deleteChatBtn"),
    modelInfo: document.getElementById("modelInfo"),
    tokenCount: document.getElementById("tokenCount"),
    
    // Modal
    settingsModal: document.getElementById("settingsModal"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    cancelSettingsBtn: document.getElementById("cancelSettingsBtn"),
    saveSettingsBtn: document.getElementById("saveSettingsBtn"),
    apiUrl: document.getElementById("apiUrl"),
    apiKey: document.getElementById("apiKey"),
    apiModel: document.getElementById("apiModel"),
    themeSelect: document.getElementById("theme"),
    
    // Loading
    loadingOverlay: document.getElementById("loadingOverlay")
};

// ===== Initialization =====
document.addEventListener("DOMContentLoaded", () => {
    loadConfig();
    loadConversations();
    setupEventListeners();
    applyTheme();
    autoResizeTextarea();
    
    // Charger la configuration depuis config.json si elle existe
    fetchConfigFromFile();
});

// ===== Event Listeners =====
function setupEventListeners() {
    // Nouveau chat
    elements.newChatBtn.addEventListener("click", createNewConversation);
    
    // Envoyer un message
    elements.sendBtn.addEventListener("click", sendMessage);
    elements.messageInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Boutons de l'en-tête du chat
    elements.copyChatBtn.addEventListener("click", copyConversation);
    elements.deleteChatBtn.addEventListener("click", deleteCurrentConversation);
    
    // Paramètres
    elements.settingsBtn.addEventListener("click", openSettings);
    elements.closeSettingsBtn.addEventListener("click", closeSettings);
    elements.cancelSettingsBtn.addEventListener("click", closeSettings);
    elements.saveSettingsBtn.addEventListener("click", saveSettings);
    
    // Boutons de prompts rapides
    document.querySelectorAll(".quick-prompt").forEach(btn => {
        btn.addEventListener("click", () => {
            elements.messageInput.value = btn.dataset.prompt;
            elements.messageInput.focus();
            sendMessage();
        });
    });
    
    // Gestion de la textarea
    elements.messageInput.addEventListener("input", () => {
        autoResizeTextarea();
        updateSendButton();
        updateTokenCount();
    });
    
    // Changer de thème
    elements.themeSelect.addEventListener("change", (e) => {
        state.theme = e.target.value;
        applyTheme();
    });
    
    // Fermer le modal en cliquant à l'extérieur
    elements.settingsModal.addEventListener("click", (e) => {
        if (e.target === elements.settingsModal) {
            closeSettings();
        }
    });
}

// ===== Theme Management =====
function applyTheme() {
    const theme = state.theme === "system" 
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") 
        : state.theme;
    
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", state.theme);
    
    // Mettre à jour le sélecteur de thème dans le modal
    if (elements.themeSelect) {
        elements.themeSelect.value = state.theme;
    }
}

// ===== Textarea Auto-resize =====
function autoResizeTextarea() {
    elements.messageInput.style.height = "auto";
    elements.messageInput.style.height = Math.min(elements.messageInput.scrollHeight, 120) + "px";
}

// ===== Send Button State =====
function updateSendButton() {
    const hasText = elements.messageInput.value.trim().length > 0;
    elements.sendBtn.disabled = !hasText;
}

// ===== Token Count =====
function updateTokenCount() {
    const text = elements.messageInput.value;
    const tokenCount = estimateTokenCount(text);
    const totalTokens = state.messages.reduce((sum, msg) => 
        sum + estimateTokenCount(msg.content), 
        tokenCount
    );
    
    elements.tokenCount.textContent = `${totalTokens} / ${CONFIG.maxTokens} jetons`;
}

function estimateTokenCount(text) {
    // Estimation simple : 1 token ≈ 4 caractères (approximation)
    return Math.ceil(text.length / 4);
}

// ===== Configuration =====
function loadConfig() {
    const savedConfig = localStorage.getItem("chatbotConfig");
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            Object.assign(CONFIG, config);
        } catch (e) {
            console.error("Erreur de chargement de la configuration:", e);
        }
    }
    
    // Charger le thème
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        state.theme = savedTheme;
    }
}

function saveConfig() {
    localStorage.setItem("chatbotConfig", JSON.stringify(CONFIG));
}

// Charger la configuration depuis config.json
async function fetchConfigFromFile() {
    try {
        const response = await fetch("config.json");
        if (response.ok) {
            const config = await response.json();
            if (config.api) {
                Object.assign(CONFIG.api, config.api);
                saveConfig();
            }
        }
    } catch (e) {
        console.log("config.json non trouvé, utilisation de la configuration par défaut");
    }
}

// ===== Conversations =====
function loadConversations() {
    const saved = localStorage.getItem("conversations");
    if (saved) {
        try {
            state.conversations = JSON.parse(saved);
            renderChatHistory();
            
            // Charger la dernière conversation
            if (state.conversations.length > 0) {
                const lastConv = state.conversations[state.conversations.length - 1];
                loadConversation(lastConv.id);
            } else {
                createNewConversation();
            }
        } catch (e) {
            console.error("Erreur de chargement des conversations:", e);
            state.conversations = [];
        }
    } else {
        state.conversations = [];
        createNewConversation();
    }
}

function saveConversations() {
    localStorage.setItem("conversations", JSON.stringify(state.conversations));
}

function createNewConversation() {
    const newConv = {
        id: generateId(),
        title: "Nouveau chat",
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    state.conversations.push(newConv);
    state.currentConversationId = newConv.id;
    state.messages = newConv.messages;
    
    saveConversations();
    renderChatHistory();
    renderMessages();
    
    // Réinitialiser l'input
    elements.messageInput.value = "";
    autoResizeTextarea();
    updateSendButton();
    updateTokenCount();
    
    // Mettre à jour le titre
    elements.currentChatTitle.textContent = newConv.title;
    
    // Focus sur l'input
    elements.messageInput.focus();
}

function loadConversation(conversationId) {
    const conv = state.conversations.find(c => c.id === conversationId);
    if (conv) {
        state.currentConversationId = conversationId;
        state.messages = conv.messages;
        
        // Mettre à jour l'interface
        renderMessages();
        elements.currentChatTitle.textContent = conv.title;
        
        // Mettre à jour la sélection dans l'historique
        document.querySelectorAll(".chat-history-item").forEach(item => {
            item.classList.remove("active");
            if (item.dataset.id === conversationId) {
                item.classList.add("active");
            }
        });
        
        // Focus sur l'input
        elements.messageInput.focus();
    }
}

function deleteConversation(conversationId) {
    state.conversations = state.conversations.filter(c => c.id !== conversationId);
    
    if (state.currentConversationId === conversationId) {
        // Si on supprime la conversation actuelle, en créer une nouvelle
        if (state.conversations.length > 0) {
            loadConversation(state.conversations[0].id);
        } else {
            createNewConversation();
        }
    }
    
    saveConversations();
    renderChatHistory();
}

function deleteCurrentConversation() {
    if (state.currentConversationId) {
        deleteConversation(state.currentConversationId);
    }
}

function copyConversation() {
    const conv = state.conversations.find(c => c.id === state.currentConversationId);
    if (conv) {
        const text = conv.messages.map(msg => 
            `${msg.role === 'user' ? 'Vous' : 'Claude'}: ${msg.content}`
        ).join('\n\n');
        
        navigator.clipboard.writeText(text).then(() => {
            showNotification("Conversation copiée dans le presse-papiers");
        });
    }
}

function updateConversationTitle(conversationId, newTitle) {
    const conv = state.conversations.find(c => c.id === conversationId);
    if (conv) {
        conv.title = newTitle;
        conv.updatedAt = new Date().toISOString();
        saveConversations();
        renderChatHistory();
    }
}

// ===== Messages =====
function renderMessages() {
    if (state.messages.length === 0) {
        elements.messages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                </div>
                <h1>Bonjour, je suis Claude</h1>
                <p>Comment puis-je vous aider aujourd'hui ?</p>
                <div class="quick-prompts">
                    <button class="quick-prompt" data-prompt="Explique-moi l'IA">Explique-moi l'IA</button>
                    <button class="quick-prompt" data-prompt="Écris un poème">Écris un poème</button>
                    <button class="quick-prompt" data-prompt="Quelle est la capitale de la France ?">Quelle est la capitale de la France ?</button>
                </div>
            </div>
        `;
        
        // Réattacher les événements aux nouveaux boutons
        document.querySelectorAll(".quick-prompt").forEach(btn => {
            btn.addEventListener("click", () => {
                elements.messageInput.value = btn.dataset.prompt;
                elements.messageInput.focus();
                sendMessage();
            });
        });
    } else {
        elements.messages.innerHTML = state.messages.map(msg => `
            <div class="message ${msg.role}">
                <div class="message-avatar">
                    ${msg.role === 'user' ? 
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>' : 
                        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>'
                    }
                </div>
                <div class="message-content">
                    <div class="message-bubble">
                        ${formatMessage(msg.content)}
                    </div>
                    <div class="message-time">
                        ${formatTime(msg.timestamp)}
                    </div>
                </div>
            </div>
        `).join("");
    }
    
    // Faire défiler vers le bas
    setTimeout(() => {
        elements.messages.scrollTop = elements.messages.scrollHeight;
    }, 100);
}

function formatMessage(content) {
    // Échapper le HTML
    let formatted = escapeHtml(content);
    
    // Appliquer le markdown de base
    formatted = applyMarkdown(formatted);
    
    return formatted;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function applyMarkdown(text) {
    // Code blocks (```)
    text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => 
        `<pre><code class="language-${lang}">${code.trim()}</code></pre>`
    );
    
    // Inline code (`)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold (**)
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic (*)
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Headers
    text = text.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Lists
    text = text.replace(/^\- (.+)$/gm, '<li>$1</li>');
    text = text.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Blockquotes
    text = text.replace(/^\[quote\]\n?([\s\S]*?)\n?\[\/quote\]/gm, '<blockquote>$1</blockquote>');
    text = text.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    
    // Horizontal rule
    text = text.replace(/^---$/gm, '<hr>');
    
    return text;
}

function formatTime(timestamp) {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function sendMessage() {
    const text = elements.messageInput.value.trim();
    if (!text || state.isLoading) return;
    
    // Ajouter le message de l'utilisateur
    const userMessage = {
        role: "user",
        content: text,
        timestamp: new Date().toISOString()
    };
    
    state.messages.push(userMessage);
    renderMessages();
    
    // Réinitialiser l'input
    elements.messageInput.value = "";
    autoResizeTextarea();
    updateSendButton();
    updateTokenCount();
    
    // Mettre à jour la conversation actuelle
    if (state.currentConversationId) {
        const conv = state.conversations.find(c => c.id === state.currentConversationId);
        if (conv) {
            conv.messages = [...state.messages];
            conv.updatedAt = new Date().toISOString();
            
            // Mettre à jour le titre si c'est le premier message
            if (conv.title === "Nouveau chat" && text.length < 50) {
                conv.title = text;
            }
            
            saveConversations();
            renderChatHistory();
        }
    }
    
    // Afficher l'indicateur de saisie
    showTypingIndicator();
    
    // Envoyer à l'API
    callChatAPI(text);
}

function showTypingIndicator() {
    state.isTyping = true;
    const typingDiv = document.createElement("div");
    typingDiv.className = "message ai typing";
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    
    elements.messages.appendChild(typingDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

function removeTypingIndicator() {
    state.isTyping = false;
    const typingDiv = elements.messages.querySelector(".typing");
    if (typingDiv) {
        typingDiv.remove();
    }
}

// ===== API Calls =====
async function callChatAPI(userMessage) {
    state.isLoading = true;
    elements.sendBtn.disabled = true;
    
    try {
        // Vérifier que l'API est configurée
        if (!CONFIG.api.url || !CONFIG.api.key) {
            throw new Error("Veuillez configurer l'URL et la clé API dans les paramètres.");
        }
        
        // Préparer les messages pour l'API
        const apiMessages = state.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        // Ajouter le message utilisateur (déjà ajouté, mais on s'assure)
        apiMessages.push({
            role: "user",
            content: userMessage
        });
        
        const requestBody = {
            model: CONFIG.api.model,
            messages: apiMessages,
            temperature: CONFIG.temperature,
            max_tokens: CONFIG.maxTokens,
            stream: false
        };
        
        const response = await fetch(CONFIG.api.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.api.key}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extraire la réponse
        let aiResponse = "";
        if (data.choices && data.choices[0] && data.choices[0].message) {
            aiResponse = data.choices[0].message.content;
        } else if (data.outputs && data.outputs[0]) {
            aiResponse = data.outputs[0].text;
        } else if (data.completion) {
            aiResponse = data.completion;
        } else {
            throw new Error("Format de réponse non reconnu");
        }
        
        // Ajouter la réponse de l'AI
        const aiMessage = {
            role: "assistant",
            content: aiResponse,
            timestamp: new Date().toISOString()
        };
        
        state.messages.push(aiMessage);
        
        // Mettre à jour la conversation
        if (state.currentConversationId) {
            const conv = state.conversations.find(c => c.id === state.currentConversationId);
            if (conv) {
                conv.messages = [...state.messages];
                conv.updatedAt = new Date().toISOString();
                saveConversations();
            }
        }
        
        renderMessages();
        updateTokenCount();
        
    } catch (error) {
        console.error("Erreur lors de l'appel API:", error);
        showError(error.message);
    } finally {
        state.isLoading = false;
        elements.sendBtn.disabled = false;
        removeTypingIndicator();
    }
}

function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "message ai error";
    errorDiv.innerHTML = `
        <div class="message-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    ${escapeHtml(message)}
                </div>
            </div>
        </div>
    `;
    
    elements.messages.appendChild(errorDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

function showNotification(message) {
    // Simple notification (pourrait être amélioré)
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.padding = "12px 20px";
    notification.style.backgroundColor = "var(--bg-secondary)";
    notification.style.border = "1px solid var(--border-color)";
    notification.style.borderRadius = "var(--radius-md)";
    notification.style.color = "var(--text-primary)";
    notification.style.boxShadow = "var(--shadow-md)";
    notification.style.zIndex = "1000";
    notification.style.animation = "slideIn 0.3s ease";
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = "slideOut 0.3s ease";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Ajouter les animations pour les notifications
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== Chat History =====
function renderChatHistory() {
    if (state.conversations.length === 0) {
        elements.chatHistory.innerHTML = "";
        return;
    }
    
    elements.chatHistory.innerHTML = state.conversations
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map(conv => {
            const date = new Date(conv.updatedAt);
            const dateStr = date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short'
            });
            
            return `
                <div class="chat-history-item ${conv.id === state.currentConversationId ? 'active' : ''}" 
                     data-id="${conv.id}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span class="chat-title">${escapeHtml(conv.title)}</span>
                    <span class="chat-date">${dateStr}</span>
                    <button class="delete-chat" data-id="${conv.id}" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
        })
        .join("");
    
    // Ajouter les événements
    document.querySelectorAll(".chat-history-item").forEach(item => {
        item.addEventListener("click", () => {
            loadConversation(item.dataset.id);
        });
    });
    
    document.querySelectorAll(".delete-chat").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteConversation(btn.dataset.id);
        });
    });
}

// ===== Settings Modal =====
function openSettings() {
    elements.apiUrl.value = CONFIG.api.url;
    elements.apiKey.value = CONFIG.api.key;
    elements.apiModel.value = CONFIG.api.model;
    elements.themeSelect.value = state.theme;
    elements.settingsModal.classList.add("active");
}

function closeSettings() {
    elements.settingsModal.classList.remove("active");
}

function saveSettings() {
    CONFIG.api.url = elements.apiUrl.value.trim();
    CONFIG.api.key = elements.apiKey.value.trim();
    CONFIG.api.model = elements.apiModel.value;
    state.theme = elements.themeSelect.value;
    
    saveConfig();
    applyTheme();
    closeSettings();
    
    showNotification("Paramètres enregistrés");
}

// ===== Utilities =====
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== Keyboard Shortcuts =====
document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K : Nouveau chat
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        createNewConversation();
    }
    
    // Ctrl/Cmd + , : Paramètres
    if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        openSettings();
    }
    
    // Échap : Fermer le modal
    if (e.key === "Escape") {
        closeSettings();
    }
});

// ===== Stream Support (Optionnel) =====
// Si vous voulez activer le streaming, décommentez cette partie
// et modifiez callChatAPI pour utiliser l'API de streaming

/*
async function callChatAPIStream(userMessage) {
    state.isLoading = true;
    elements.sendBtn.disabled = true;
    removeTypingIndicator();
    
    try {
        if (!CONFIG.api.url || !CONFIG.api.key) {
            throw new Error("Veuillez configurer l'URL et la clé API dans les paramètres.");
        }
        
        const apiMessages = state.messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
        
        apiMessages.push({
            role: "user",
            content: userMessage
        });
        
        const requestBody = {
            model: CONFIG.api.model,
            messages: apiMessages,
            temperature: CONFIG.temperature,
            max_tokens: CONFIG.maxTokens,
            stream: true
        };
        
        const response = await fetch(CONFIG.api.url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CONFIG.api.key}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur API: ${response.status}`);
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = "";
        
        // Créer un message vide pour l'AI
        const aiMessage = {
            role: "assistant",
            content: "",
            timestamp: new Date().toISOString()
        };
        
        state.messages.push(aiMessage);
        renderMessages();
        
        // Lire le stream
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(line => line.trim() !== "");
            
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.substring(6);
                    if (dataStr === "[DONE]") continue;
                    
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.choices && data.choices[0] && data.choices[0].delta) {
                            const delta = data.choices[0].delta;
                            if (delta.content) {
                                aiMessage.content += delta.content;
                                aiResponse += delta.content;
                                
                                // Mettre à jour l'affichage
                                renderMessages();
                            }
                        }
                    } catch (e) {
                        console.error("Erreur de parsing du chunk:", e);
                    }
                }
            }
        }
        
        // Mettre à jour la conversation
        if (state.currentConversationId) {
            const conv = state.conversations.find(c => c.id === state.currentConversationId);
            if (conv) {
                conv.messages = [...state.messages];
                conv.updatedAt = new Date().toISOString();
                saveConversations();
            }
        }
        
        updateTokenCount();
        
    } catch (error) {
        console.error("Erreur lors de l'appel API:", error);
        showError(error.message);
        
        // Supprimer le message vide si erreur
        if (state.messages.length > 0 && state.messages[state.messages.length - 1].role === "assistant" && 
            state.messages[state.messages.length - 1].content === "") {
            state.messages.pop();
            renderMessages();
        }
    } finally {
        state.isLoading = false;
        elements.sendBtn.disabled = false;
    }
}
*/

// ===== Export for testing =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        state,
        sendMessage,
        callChatAPI,
        formatMessage,
        estimateTokenCount
    };
}
