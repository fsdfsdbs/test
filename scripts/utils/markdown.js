/**
 * Markdown Parser Module
 * Converts markdown to HTML for the Claude AI Chatbot Clone
 */

import { escapeHtml } from './helpers.js';

/**
 * Parse markdown to HTML
 * @param {string} markdown - Markdown text
 * @returns {string} HTML string
 */
export function parseMarkdown(markdown) {
    if (!markdown) return '';
    
    // Escape HTML first to prevent XSS
    let html = escapeHtml(markdown);
    
    // Apply markdown transformations
    html = applyHeaders(html);
    html = applyBold(html);
    html = applyItalic(html);
    html = applyStrikethrough(html);
    html = applyCodeBlocks(html);
    html = applyInlineCode(html);
    html = applyLinks(html);
    html = applyImages(html);
    html = applyLists(html);
    html = applyBlockquotes(html);
    html = applyHorizontalRule(html);
    html = applyTables(html);
    
    return html;
}

/**
 * Apply header formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyHeaders(html) {
    // H1
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    // H2
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    // H3
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    // H4
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    // H5
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    // H6
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    
    return html;
}

/**
 * Apply bold formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyBold(html) {
    // **bold**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // __bold__
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    return html;
}

/**
 * Apply italic formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyItalic(html) {
    // *italic*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    // _italic_
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    return html;
}

/**
 * Apply strikethrough formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyStrikethrough(html) {
    // ~~strikethrough~~
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    return html;
}

/**
 * Apply code blocks formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyCodeBlocks(html) {
    // ```language
    // code
    // ```
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, language, code) => {
        const lang = language || 'text';
        const codeContent = code.trim();
        return `<pre><code class="language-${lang}">${codeContent}</code></pre>`;
    });
    
    // Indented code blocks (4 spaces)
    html = html.replace(/^    (.+)$/gm, '<pre><code>$1</code></pre>');
    
    return html;
}

/**
 * Apply inline code formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyInlineCode(html) {
    // `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    return html;
}

/**
 * Apply link formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyLinks(html) {
    // [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Auto-link URLs
    html = html.replace(/https?:\/\/[^\s]+/g, url => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
    
    // Auto-link emails
    html = html.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, email => {
        return `<a href="mailto:${email}">${email}</a>`;
    });
    
    return html;
}

/**
 * Apply image formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyImages(html) {
    // ![alt](url)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; border-radius: 8px; margin: 12px 0;">');
    return html;
}

/**
 * Apply list formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyLists(html) {
    // Unordered lists
    html = html.replace(/^\s*[-*+]\s+(.+)$/gm, '<li>$1</li>');
    
    // Ordered lists
    html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    // Wrap lists in <ul> or <ol>
    // This is a simplified approach - for full markdown support, a more complex parser would be needed
    html = html.replace(/(<li>.*<\/li>)+/g, match => {
        // Check if it's an ordered list
        if (match.match(/<li>\d+\./)) {
            return `<ol>${match}</ol>`;
        }
        return `<ul>${match}</ul>`;
    });
    
    return html;
}

/**
 * Apply blockquote formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyBlockquotes(html) {
    // > quote
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    return html;
}

/**
 * Apply horizontal rule formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyHorizontalRule(html) {
    // --- or *** or ___
    html = html.replace(/^[-*_]{3,}$/gm, '<hr>');
    return html;
}

/**
 * Apply table formatting
 * @param {string} html - HTML string
 * @returns {string} Formatted HTML
 */
function applyTables(html) {
    // Simple table parsing (for markdown tables)
    // This is a basic implementation - for full support, consider using a library
    html = html.replace(/\|(.+)\|/g, (match, cells) => {
        const cellArray = cells.split('|').map(c => c.trim());
        return `<tr>${cellArray.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    });
    
    // Wrap tables
    html = html.replace(/<tr>.*<\/tr>/g, match => `<table>${match}</table>`);
    
    return html;
}

/**
 * Sanitize HTML (remove potentially dangerous elements)
 * @param {string} html - HTML string
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
    if (!html) return '';
    
    // Create a temporary div
    const div = document.createElement('div');
    div.innerHTML = html;
    
    // Remove dangerous elements
    const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'style'];
    dangerousTags.forEach(tag => {
        const elements = div.getElementsByTagName(tag);
        while (elements[0]) {
            elements[0].parentNode.removeChild(elements[0]);
        }
    });
    
    // Remove dangerous attributes
    const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'javascript:'];
    const allElements = div.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
        const element = allElements[i];
        dangerousAttrs.forEach(attr => {
            if (element.hasAttribute(attr)) {
                element.removeAttribute(attr);
            }
            // Check for javascript: in href/src
            if (element.hasAttribute('href') || element.hasAttribute('src')) {
                const href = element.getAttribute('href') || element.getAttribute('src');
                if (href && href.toLowerCase().includes('javascript:')) {
                    element.removeAttribute('href');
                    element.removeAttribute('src');
                }
            }
        });
    }
    
    return div.innerHTML;
}

/**
 * Format message content (escape + markdown + sanitize)
 * @param {string} content - Message content
 * @returns {string} Formatted HTML
 */
export function formatMessage(content) {
    if (!content) return '';
    
    // Parse markdown
    let formatted = parseMarkdown(content);
    
    // Sanitize HTML
    formatted = sanitizeHtml(formatted);
    
    // Add line breaks for single newlines
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Fix multiple newlines
    formatted = formatted.replace(/<br>\s*<br>/g, '<br><br>');
    
    return formatted;
}

/**
 * Extract code blocks from markdown
 * @param {string} markdown - Markdown text
 * @returns {Array} Array of {language, code} objects
 */
export function extractCodeBlocks(markdown) {
    const codeBlocks = [];
    const regex = /```(\w*)\n?([\s\S]*?)```/g;
    let match;
    
    while ((match = regex.exec(markdown)) !== null) {
        codeBlocks.push({
            language: match[1] || 'text',
            code: match[2].trim()
        });
    }
    
    return codeBlocks;
}

export default {
    parseMarkdown,
    sanitizeHtml,
    formatMessage,
    extractCodeBlocks
};
