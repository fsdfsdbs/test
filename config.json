/**
 * Configuration Module
 * Verrouillé sur Z.ai GLM-5.2 - clé API intégrée
 */

// Configuration fixe - un seul provider, pas de choix utilisateur
const DEFAULT_CONFIG = {
    api: {
        provider: 'zai',
        url: 'https://api.z.ai/api/paas/v4/chat/completions',
        key: 'TA_CLE_API_ZAI_ICI', // <-- mets ta clé ici
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

const API_PROVIDERS = {
    zai: {
        url: 'https://api.z.ai/api/paas/v4/chat/completions',
        models: ['glm-5.2'],
        authHeader: 'Authorization',
        authPrefix: 'Bearer',
        requestFormat: 'openai'
    }
};

// State management
let config = { ...DEFAULT_CONFIG };

/**
 * Load configuration - ne charge QUE les settings (theme, etc.)
 * depuis localStorage, jamais l'API (verrouillée en dur)
 */
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
                // api volontairement ignoré : toujours DEFAULT_CONFIG.api
            };
        } catch (e) {
            console.error('Error loading config:', e);
        }
    }
}

export function saveConfig() {
    localStorage.setItem('chatbotConfig', JSON.stringify(config));
}

/**
 * Update configuration - bloque toute modification de l'API
 */
export function updateConfig(updates) {
    config = {
        ...config,
        settings: {
            ...config.settings,
            ...updates.settings
        }
        // api ignoré ici aussi
    };
    saveConfig();
}

export function getConfig() {
    return { ...config };
}

export function getProviderConfig() {
    return API_PROVIDERS.zai;
}

export function getAllProviders() {
    return { ...API_PROVIDERS };
}

export function resetConfig() {
    config = { ...DEFAULT_CONFIG };
    saveConfig();
}

export async function loadConfigFromFile() {
    // Désactivé : la config API vient uniquement de DEFAULT_CONFIG
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
