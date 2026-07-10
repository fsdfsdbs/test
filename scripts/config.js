/**
 * Configuration Module
 * Verrouillé sur OpenRouter - clé API intégrée
 */

const DEFAULT_CONFIG = {
    api: {
        provider: 'openrouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        key: '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', // <-- mets ta clé ici
        model: 'openai/gpt-oss-120b:free'
    },
    settings: {
        temperature: 0.7,
        maxTokens: 8000,
        theme: 'dark',
        fontSize: 'medium',
        enableStreaming: true,
        saveHistory: true,
        enterToSend: false
    }
};

const API_PROVIDERS = {
    openrouter: {
        url: 'https://openrouter.ai/api/v1/chat/completions',
        models: [
            'deepseek/deepseek-r1:free',
            'qwen/qwen-2.5-coder-32b-instruct:free',
            'meta-llama/llama-3.3-70b-instruct:free'
        ],
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        requestFormat: 'openai'
    }
};

let config = { ...DEFAULT_CONFIG };

export function loadConfig() {
    const savedConfig = localStorage.getItem('chatbotConfig');
    if (savedConfig) {
        try {
            const parsedConfig = JSON.parse(savedConfig);
            config = {
                ...config,
                settings: {
                    ...config.settings,
                    ...parsedConfig.settings
                }
                // api volontairement ignoré : toujours DEFAULT_CONFIG
            };
        } catch (e) {
            console.error('Error loading config:', e);
        }
    }
}

export function saveConfig() {
    localStorage.setItem('chatbotConfig', JSON.stringify(config));
}

export function updateConfig(updates) {
    config = {
        ...config,
        settings: {
            ...config.settings,
            ...updates.settings
        }
    };
    saveConfig();
}

export function getConfig() {
    return { ...config };
}

export function getProviderConfig() {
    return API_PROVIDERS.openrouter;
}

export function getAllProviders() {
    return { ...API_PROVIDERS };
}

export function resetConfig() {
    config = { ...DEFAULT_CONFIG };
    saveConfig();
}

export async function loadConfigFromFile() {
    return;
}

export function initConfig() {
    loadConfig();
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
