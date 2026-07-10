/**
 * Configuration Module
 * Centralized configuration for the Claude AI Chatbot Clone
 * Updated for Z.ai GLM API (GLM-5.2)
 */

// Default configuration
const DEFAULT_CONFIG = {
    api: {
        provider: 'zai',
        url: 'https://api.z.ai/api/paas/v4/chat/completions',
        key: '',
        model: 'glm-5.2'
    },
    settings: {
        temperature: 0.7,
        maxTokens: 32000,
        theme: 'dark',
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
        models: ['mistral-tiny', 'mistral-small', 'mistral-medium', 'mistral-large'],
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        requestFormat: 'mistral'
    },
    openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        requestFormat: 'openai'
    },
    groq: {
        url: 'https://api.groq.com/v1/chat/completions',
        models: ['llama3-8b-instant', 'llama3-70b-versatile', 'mixtral-8x7b-32768', 'gemma-7b-it'],
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        requestFormat: 'openai'
    },
    // GitHub DeepSeek API configuration (CORRECT MODEL NAMES)
    github: {
        url: 'https://api.githubai.com/v1/chat/completions',
        models: ['DeepSeek-V3-0324', 'DeepSeek-Coder-V2-0314'],
        authHeader: 'Authorization',
        authPrefix: 'token',
        requestFormat: 'openai'
    },
    // Alias for backward compatibility
    deepseek: {
        url: 'https://api.githubai.com/v1/chat/completions',
        models: ['DeepSeek-V3-0324', 'DeepSeek-Coder-V2-0314'],
        authHeader: 'Authorization',
        authPrefix: 'token',
        requestFormat: 'openai'
    },
    // Z.ai GLM API configuration
    zai: {
        url: 'https://api.z.ai/api/paas/v4/chat/completions',
        models: ['glm-5.2', 'glm-5.1', 'glm-4.6'],
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        requestFormat: 'openai'
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

            // Ensure GitHub provider uses correct models
            if (config.api.provider === 'github' || (config.api.url && config.api.url.includes('githubai.com'))) {
                if (!config.api.model || !API_PROVIDERS.github.models.includes(config.api.model)) {
                    config.api.model = 'DeepSeek-V3-0324';
                }
            }

            // Ensure Z.ai provider uses correct models
            if (config.api.provider === 'zai' || (config.api.url && config.api.url.includes('api.z.ai'))) {
                if (!config.api.model || !API_PROVIDERS.zai.models.includes(config.api.model)) {
                    config.api.model = 'glm-5.2';
                }
            }
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
    return API_PROVIDERS[provider] || API_PROVIDERS.zai;
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
                // Ensure GitHub uses correct model names
                if (fileConfig.api.provider === 'github' ||
                    (fileConfig.api.url && fileConfig.api.url.includes('githubai.com'))) {
                    const validModels = API_PROVIDERS.github.models;
                    if (fileConfig.api.model && !validModels.includes(fileConfig.api.model)) {
                        fileConfig.api.model = 'DeepSeek-V3-0324';
                    }
                }

                // Ensure Z.ai uses correct model names
                if (fileConfig.api.provider === 'zai' ||
                    (fileConfig.api.url && fileConfig.api.url.includes('api.z.ai'))) {
                    const validModels = API_PROVIDERS.zai.models;
                    if (fileConfig.api.model && !validModels.includes(fileConfig.api.model)) {
                        fileConfig.api.model = 'glm-5.2';
                    }
                }

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
