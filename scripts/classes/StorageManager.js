/**
 * Storage Manager Class
 * Handles all localStorage operations for the Claude AI Chatbot Clone
 */

import { generateId, deepClone } from '../utils/helpers.js';

/**
 * StorageManager - Manages conversation and settings storage
 */
export class StorageManager {
    constructor() {
        this.storageKey = 'claudeChatbot';
        this.init();
    }
    
    /**
     * Initialize storage if it doesn't exist
     */
    init() {
        if (!localStorage.getItem(this.storageKey)) {
            this.save({
                conversations: [],
                settings: {},
                version: '1.0'
            });
        }
    }
    
    /**
     * Get all data from storage
     * @returns {Object} Stored data
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : { conversations: [], settings: {}, version: '1.0' };
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return { conversations: [], settings: {}, version: '1.0' };
        }
    }
    
    /**
     * Save all data to storage
     * @param {Object} data - Data to save
     */
    save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            // If localStorage is full, try to clean up
            this.cleanup();
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(data));
            } catch (e2) {
                console.error('Still cannot save to localStorage:', e2);
            }
        }
    }
    
    /**
     * Get conversations from storage
     * @returns {Array} Array of conversations
     */
    getConversations() {
        const data = this.getAll();
        return data.conversations || [];
    }
    
    /**
     * Save conversations to storage
     * @param {Array} conversations - Conversations to save
     */
    saveConversations(conversations) {
        const data = this.getAll();
        data.conversations = conversations;
        this.save(data);
    }
    
    /**
     * Add a new conversation
     * @param {Object} conversation - Conversation to add
     * @returns {Object} Added conversation with ID
     */
    addConversation(conversation) {
        const conversations = this.getConversations();
        const newConversation = {
            id: generateId(),
            title: conversation.title || 'Nouveau chat',
            messages: conversation.messages || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pinned: false,
            ...conversation
        };
        conversations.unshift(newConversation);
        this.saveConversations(conversations);
        return newConversation;
    }
    
    /**
     * Update a conversation
     * @param {string} id - Conversation ID
     * @param {Object} updates - Updates to apply
     * @returns {Object|null} Updated conversation or null if not found
     */
    updateConversation(id, updates) {
        const conversations = this.getConversations();
        const index = conversations.findIndex(c => c.id === id);
        
        if (index === -1) return null;
        
        const updatedConversation = {
            ...conversations[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        conversations[index] = updatedConversation;
        this.saveConversations(conversations);
        return updatedConversation;
    }
    
    /**
     * Delete a conversation
     * @param {string} id - Conversation ID
     * @returns {boolean} Success status
     */
    deleteConversation(id) {
        const conversations = this.getConversations();
        const index = conversations.findIndex(c => c.id === id);
        
        if (index === -1) return false;
        
        conversations.splice(index, 1);
        this.saveConversations(conversations);
        return true;
    }
    
    /**
     * Get a conversation by ID
     * @param {string} id - Conversation ID
     * @returns {Object|null} Conversation or null if not found
     */
    getConversation(id) {
        const conversations = this.getConversations();
        return conversations.find(c => c.id === id) || null;
    }
    
    /**
     * Pin/Unpin a conversation
     * @param {string} id - Conversation ID
     * @param {boolean} pinned - Pin status
     * @returns {Object|null} Updated conversation or null
     */
    pinConversation(id, pinned = true) {
        return this.updateConversation(id, { pinned });
    }
    
    /**
     * Reorder conversations (move to top)
     * @param {string} id - Conversation ID
     */
    moveConversationToTop(id) {
        const conversations = this.getConversations();
        const index = conversations.findIndex(c => c.id === id);
        
        if (index > 0) {
            const [conversation] = conversations.splice(index, 1);
            conversations.unshift(conversation);
            this.saveConversations(conversations);
        }
    }
    
    /**
     * Get settings from storage
     * @returns {Object} Settings object
     */
    getSettings() {
        const data = this.getAll();
        return data.settings || {};
    }
    
    /**
     * Save settings to storage
     * @param {Object} settings - Settings to save
     */
    saveSettings(settings) {
        const data = this.getAll();
        data.settings = settings;
        this.save(data);
    }
    
    /**
     * Update specific settings
     * @param {Object} updates - Settings updates
     */
    updateSettings(updates) {
        const settings = this.getSettings();
        const updatedSettings = { ...settings, ...updates };
        this.saveSettings(updatedSettings);
    }
    
    /**
     * Get a specific setting
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Setting value
     */
    getSetting(key, defaultValue = null) {
        const settings = this.getSettings();
        return settings[key] !== undefined ? settings[key] : defaultValue;
    }
    
    /**
     * Clear all data
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
        this.init();
    }
    
    /**
     * Clear conversations only
     */
    clearConversations() {
        const data = this.getAll();
        data.conversations = [];
        this.save(data);
    }
    
    /**
     * Export all data as JSON
     * @returns {string} JSON string
     */
    exportData() {
        return JSON.stringify(this.getAll(), null, 2);
    }
    
    /**
     * Import data from JSON
     * @param {string} json - JSON string
     * @returns {boolean} Success status
     */
    importData(json) {
        try {
            const data = JSON.parse(json);
            // Validate data structure
            if (data.conversations && Array.isArray(data.conversations)) {
                this.save(data);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }
    
    /**
     * Clean up old or invalid data
     */
    cleanup() {
        try {
            // Try to remove old data
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('claude') || key.startsWith('chatbot')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.error('Error cleaning up localStorage:', e);
        }
    }
    
    /**
     * Get storage usage
     * @returns {Object} Storage usage info
     */
    getStorageUsage() {
        try {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                total += key.length + value.length;
            }
            return {
                used: total,
                max: 5 * 1024 * 1024, // 5MB
                percent: (total / (5 * 1024 * 1024)) * 100
            };
        } catch (e) {
            return { used: 0, max: 0, percent: 0 };
        }
    }
}

// Singleton instance
export const storageManager = new StorageManager();

export default StorageManager;
