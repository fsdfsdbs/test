/**
 * DOM Utility Module
 * Helper functions for DOM manipulation in the Claude AI Chatbot Clone
 */

import { escapeHtml, generateId } from './helpers.js';

/**
 * Create a DOM element
 * @param {string} tag - HTML tag name
 * @param {Object} options - Element options (className, id, etc.)
 * @param {string|HTMLElement|Array} children - Child elements or text
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, options = {}, children = null) {
    const element = document.createElement(tag);
    
    // Set attributes
    for (const [key, value] of Object.entries(options)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (key === 'dataset') {
            Object.assign(element.dataset, value);
        } else if (key === 'style') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on')) {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    }
    
    // Append children
    if (children) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
        } else if (typeof children === 'string') {
            element.textContent = children;
        } else if (children instanceof HTMLElement) {
            element.appendChild(children);
        }
    }
    
    return element;
}

/**
 * Create an SVG icon
 * @param {string} path - SVG path data
 * @param {Object} options - SVG options
 * @returns {SVGElement} Created SVG element
 */
export function createIcon(path, options = {}) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    
    // Default attributes
    const defaults = {
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
    };
    
    // Merge options
    const attrs = { ...defaults, ...options };
    
    // Set attributes
    for (const [key, value] of Object.entries(attrs)) {
        svg.setAttribute(key, value);
    }
    
    // Add path
    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathElement.setAttribute('d', path);
    svg.appendChild(pathElement);
    
    return svg;
}

/**
 * Create a message element
 * @param {Object} message - Message data
 * @param {string} type - Message type ('user' or 'ai')
 * @returns {HTMLElement} Message element
 */
export function createMessageElement(message, type = 'ai') {
    const messageEl = createElement('div', {
        className: `message ${type}`,
        'data-id': message.id || generateId()
    });
    
    // Avatar
    const avatarIcon = type === 'user' 
        ? 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' + 
          'M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' 
        : 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z';
    
    const avatar = createElement('div', { className: 'message-avatar' }, [
        createIcon(avatarIcon, { width: '18', height: '18' })
    ]);
    
    // Content
    const content = createElement('div', { className: 'message-content' });
    
    // Bubble
    const bubble = createElement('div', { 
        className: 'message-bubble',
        innerHTML: message.content || ''
    });
    
    // Time
    const time = createElement('div', { className: 'message-time' }, [
        message.timestamp ? new Date(message.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        }) : ''
    ]);
    
    content.appendChild(bubble);
    content.appendChild(time);
    
    messageEl.appendChild(avatar);
    messageEl.appendChild(content);
    
    return messageEl;
}

/**
 * Create a typing indicator element
 * @returns {HTMLElement} Typing indicator element
 */
export function createTypingIndicator() {
    const typingEl = createElement('div', { className: 'message ai typing' });
    
    const avatar = createElement('div', { className: 'message-avatar' }, [
        createIcon('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', { width: '18', height: '18' })
    ]);
    
    const content = createElement('div', { className: 'message-content' });
    const bubble = createElement('div', { className: 'message-bubble' });
    
    const typingIndicator = createElement('div', { className: 'typing-indicator' }, [
        createElement('span'),
        createElement('span'),
        createElement('span')
    ]);
    
    bubble.appendChild(typingIndicator);
    content.appendChild(bubble);
    typingEl.appendChild(avatar);
    typingEl.appendChild(content);
    
    return typingEl;
}

/**
 * Create an error message element
 * @param {string} message - Error message
 * @returns {HTMLElement} Error element
 */
export function createErrorElement(message) {
    const errorEl = createElement('div', { className: 'message ai error' });
    
    const avatar = createElement('div', { className: 'message-avatar' }, [
        createIcon('M12 12s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', { width: '18', height: '18' })
    ]);
    
    const content = createElement('div', { className: 'message-content' });
    const bubble = createElement('div', { className: 'message-bubble' });
    
    const errorMessage = createElement('div', { className: 'error-message' }, [
        createIcon('M12 8v4m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', { width: '16', height: '16' }),
        escapeHtml(message)
    ]);
    
    bubble.appendChild(errorMessage);
    content.appendChild(bubble);
    errorEl.appendChild(avatar);
    errorEl.appendChild(content);
    
    return errorEl;
}

/**
 * Create a conversation item for the sidebar
 * @param {Object} conversation - Conversation data
 * @param {boolean} isActive - Is this conversation active
 * @returns {HTMLElement} Conversation item element
 */
export function createConversationItem(conversation, isActive = false) {
    const item = createElement('div', {
        className: `chat-history-item ${isActive ? 'active' : ''}`,
        'data-id': conversation.id,
        'role': 'listitem'
    });
    
    const icon = createIcon('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', {
        width: '18',
        height: '18'
    });
    
    const chatInfo = createElement('div', { className: 'chat-info' });
    
    const title = createElement('span', {
        className: 'chat-title',
        textContent: conversation.title || 'Nouveau chat'
    });
    
    const date = new Date(conversation.updatedAt || conversation.createdAt);
    const dateStr = date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
    });
    
    const meta = createElement('div', { className: 'chat-meta' }, [
        createElement('span', { className: 'chat-date', textContent: dateStr })
    ]);
    
    chatInfo.appendChild(title);
    chatInfo.appendChild(meta);
    
    const deleteBtn = createElement('button', {
        className: 'delete-chat',
        'data-id': conversation.id,
        'aria-label': 'Supprimer le chat'
    }, [
        createIcon('M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', {
            width: '14',
            height: '14'
        })
    ]);
    
    item.appendChild(icon);
    item.appendChild(chatInfo);
    item.appendChild(deleteBtn);
    
    return item;
}

/**
 * Create a toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('success', 'error', 'info')
 * @param {number} duration - Duration in milliseconds
 * @returns {HTMLElement} Toast element
 */
export function createToast(message, type = 'info', duration = 3000) {
    const toast = createElement('div', {
        className: `toast ${type}`,
        'aria-live': 'polite'
    });
    
    const icons = {
        success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
        info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };
    
    const icon = createIcon(icons[type] || icons.info, { width: '18', height: '18' });
    const text = createElement('span', { textContent: message });
    
    toast.appendChild(icon);
    toast.appendChild(text);
    
    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
    
    return toast;
}

/**
 * Show a toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {number} duration - Duration in milliseconds
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = createToast(message, type, duration);
    toastContainer.appendChild(toast);
}

/**
 * Toggle class on element
 * @param {HTMLElement} element - DOM element
 * @param {string} className - Class name to toggle
 * @param {boolean} force - Force add or remove
 */
export function toggleClass(element, className, force) {
    if (force !== undefined) {
        if (force) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    } else {
        element.classList.toggle(className);
    }
}

/**
 * Add class to element
 * @param {HTMLElement} element - DOM element
 * @param {string} className - Class name to add
 */
export function addClass(element, className) {
    element.classList.add(className);
}

/**
 * Remove class from element
 * @param {HTMLElement} element - DOM element
 * @param {string} className - Class name to remove
 */
export function removeClass(element, className) {
    element.classList.remove(className);
}

/**
 * Check if element has class
 * @param {HTMLElement} element - DOM element
 * @param {string} className - Class name to check
 * @returns {boolean} Has class
 */
export function hasClass(element, className) {
    return element.classList.contains(className);
}

/**
 * Empty element's children
 * @param {HTMLElement} element - DOM element
 */
export function emptyElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Scroll to bottom of element
 * @param {HTMLElement} element - DOM element
 * @param {boolean} smooth - Smooth scroll
 */
export function scrollToBottom(element, smooth = true) {
    element.scrollTop = element.scrollHeight;
}

/**
 * Auto-resize textarea
 * @param {HTMLTextAreaElement} textarea - Textarea element
 */
export function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

/**
 * Focus element
 * @param {HTMLElement} element - DOM element
 */
export function focusElement(element) {
    element.focus();
}

/**
 * Select text in element
 * @param {HTMLElement} element - DOM element
 */
export function selectText(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

/**
 * Get element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Element or null
 */
export function getElementById(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return element;
}

/**
 * Query selector with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element
 * @returns {HTMLElement|null} Element or null
 */
export function querySelector(selector, parent = document) {
    const element = parent.querySelector(selector);
    if (!element) {
        console.warn(`Element with selector "${selector}" not found`);
    }
    return element;
}

/**
 * Query selector all with error handling
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element
 * @returns {NodeList} NodeList
 */
export function querySelectorAll(selector, parent = document) {
    const elements = parent.querySelectorAll(selector);
    if (elements.length === 0) {
        console.warn(`No elements found with selector "${selector}"`);
    }
    return elements;
}

/**
 * Add event listener with error handling
 * @param {HTMLElement} element - DOM element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 */
export function addEventListener(element, event, handler, options = {}) {
    if (!element) {
        console.warn(`Cannot add event listener: element is null`);
        return;
    }
    element.addEventListener(event, handler, options);
}

/**
 * Remove event listener
 * @param {HTMLElement} element - DOM element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function removeEventListener(element, event, handler) {
    if (!element) return;
    element.removeEventListener(event, handler);
}

/**
 * Dispatch custom event
 * @param {HTMLElement} element - DOM element
 * @param {string} eventName - Event name
 * @param {Object} detail - Event detail
 */
export function dispatchEvent(element, eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true
    });
    element.dispatchEvent(event);
}

/**
 * Create a code block element with copy button
 * @param {string} code - Code content
 * @param {string} language - Programming language
 * @returns {HTMLElement} Code block element
 */
export function createCodeBlock(code, language = 'text') {
    const pre = createElement('pre', { className: `language-${language}` });
    const codeEl = createElement('code', { textContent: code });
    
    const header = createElement('div', { className: 'code-header' });
    const langSpan = createElement('span', { 
        className: 'code-language',
        textContent: language
    });
    
    const copyBtn = createElement('button', {
        className: 'copy-code-btn',
        'aria-label': 'Copier le code'
    }, [
        createIcon('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', {
            width: '14',
            height: '14'
        })
    ]);
    
    copyBtn.addEventListener('click', async () => {
        const success = await copyToClipboard(code);
        if (success) {
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '';
            copyBtn.appendChild(createIcon('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', {
                width: '14',
                height: '14'
            }));
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = '';
                copyBtn.appendChild(createIcon('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', {
                    width: '14',
                    height: '14'
                }));
            }, 2000);
        }
    });
    
    header.appendChild(langSpan);
    header.appendChild(copyBtn);
    pre.appendChild(header);
    pre.appendChild(codeEl);
    
    return pre;
}

// Import copyToClipboard from helpers
import { copyToClipboard } from './helpers.js';

export default {
    createElement,
    createIcon,
    createMessageElement,
    createTypingIndicator,
    createErrorElement,
    createConversationItem,
    createToast,
    showToast,
    toggleClass,
    addClass,
    removeClass,
    hasClass,
    emptyElement,
    scrollToBottom,
    autoResizeTextarea,
    focusElement,
    selectText,
    getElementById,
    querySelector,
    querySelectorAll,
    addEventListener,
    removeEventListener,
    dispatchEvent,
    createCodeBlock
};
