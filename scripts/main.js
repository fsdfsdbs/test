/**
 * Main Entry Point
 * Initializes the Claude AI Chatbot Clone application
 */

// Import all modules to ensure they're loaded
import './config.js';
import './utils/helpers.js';
import './utils/markdown.js';
import './utils/dom.js';
import './classes/StorageManager.js';
import './classes/APIClient.js';
import './classes/UIManager.js';
import './classes/ChatApp.js';

// The ChatApp will initialize itself when DOM is loaded
// This file exists to ensure all modules are properly imported

console.log('Claude AI Chatbot Clone - Initializing...');

// Add global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled rejection:', e.reason);
});
