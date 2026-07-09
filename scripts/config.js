/**
 * Configuration Module
 * Centralized configuration for the Claude AI Chatbot Clone
 */

// Default configuration
const DEFAULT_CONFIG = {
    api: {
        provider: 'mistral',
        url: 'https://api.mistral.ai/v1/chat/completions',
        key: '',
        model: 'mistral-tiny'
    },
    settings: {
        temperature: 0.7,
        maxTokens: 32000,
        theme: 'system',
        fontSize: 'medium',
        enableStreaming: true,
        saveHistory: true,
        enterToSend: false
    }
};

// API Provider configurations
const API_PROVIDERS = {
    mistral: {
        url: 'https://api.mistral.ai/v1/chat/completions',
        models: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large']
    },
    openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o']
    },
    groq: {
        url: 'https://api.groq.com/v1/chat/completions',
        models: ['llama3-8b-instant', 'llama3-70b-versatile', 'mixtral-8x7b-32768', 'gemma-7b-it']
    }
};

// State management
let config = { ...DEFAULT_CONFIG };

/**
 * Load configuration from localStorage
 */
export function loadConfig() {
    const savedConfig = localStorage.getItem('chatbotConfig');
    if (savedConfig) {
        try {
            const parsedConfig = JSON.parse(savedConfig);
            config = {
                ...config,
                ...parsedConfig,
                api: {
                    ...config.api,
                    ...parsedConfig.api
                },
                settings: {
                    ...config.settings,
                    ...parsedConfig.settings
                }
            };
        } catch (e) {
            console.error('Error loading config:', e);
        }
    }
}

/**
 * Save configuration to localStorage
 */
export function saveConfig() {
    localStorage.setItem('chatbotConfig', JSON.stringify(config));
}

/**
 * Update configuration
 * @param {Object} updates - Partial configuration to update
 */
export function updateConfig(updates) {
    config = {
        ...config,
        ...updates,
        api: {
            ...config.api,
            ...updates.api
        },
        settings: {
            ...config.settings,
            ...updates.settings
        }
    };
    saveConfig();
}

/**
 * Get current configuration
 * @returns {Object} Current configuration
 */
export function getConfig() {
    return { ...config };
}

/**
 * Get API configuration for a specific provider
 * @param {string} provider - API provider name
 * @returns {Object} Provider configuration
 */
export function getProviderConfig(provider) {
    return API_PROVIDERS[provider] || API_PROVIDERS.mistral;
}

/**
 * Get all available providers
 * @returns {Object} All providers
 */
export function getAllProviders() {
    return { ...API_PROVIDERS };
}

/**
 * Reset configuration to defaults
 */
export function resetConfig() {
    config = { ...DEFAULT_CONFIG };
    saveConfig();
}

/**
 * Load configuration from external file (config.json)
 */
export async function loadConfigFromFile() {
    try {
        const response = await fetch('config.json');
        if (response.ok) {
            const fileConfig = await response.json();
            if (fileConfig.api) {
                updateConfig({ api: fileConfig.api });
            }
            if (fileConfig.settings) {
                updateConfig({ settings: fileConfig.settings });
            }
        }
    } catch (e) {
        console.log('config.json not found, using default configuration');
    }
}

// Initialize configuration
export function initConfig() {
    loadConfig();
    loadConfigFromFile();
}

export default {
    loadConfig,
    saveConfig,
    updateConfig,
    getConfig,
    getProviderConfig,
    getAllProviders,
    resetConfig,
    initConfig,
    DEFAULT_CONFIG,
    API_PROVIDERS
};
