// HTML Sanitization Utility
// Prevents Cross-Site Scripting (XSS) attacks by escaping HTML special characters

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} unsafe - The potentially unsafe user input
 * @returns {string} - HTML-safe string with escaped characters
 */
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) {
        return '';
    }

    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Sanitizes an object's string properties for safe HTML rendering
 * @param {Object} obj - Object containing user input
 * @param {Array<string>} fields - Array of field names to sanitize
 * @returns {Object} - New object with sanitized fields
 */
function sanitizeObject(obj, fields) {
    const sanitized = { ...obj };

    fields.forEach(field => {
        if (sanitized[field] !== undefined && sanitized[field] !== null) {
            sanitized[field] = escapeHtml(sanitized[field]);
        }
    });

    return sanitized;
}

/**
 * Sanitizes a pumpkin object for safe rendering
 * @param {Object} pumpkin - Pumpkin object with user-submitted data
 * @returns {Object} - Sanitized pumpkin object
 */
function sanitizePumpkin(pumpkin) {
    return sanitizeObject(pumpkin, [
        'title',
        'description',
        'carverName'
    ]);
}

/**
 * Creates a safe text node (alternative to innerHTML)
 * @param {string} text - Text content
 * @returns {Text} - DOM text node
 */
function createSafeTextNode(text) {
    return document.createTextNode(text || '');
}

/**
 * Strips all HTML tags from a string (aggressive sanitization)
 * @param {string} html - String that may contain HTML
 * @returns {string} - Plain text with all tags removed
 */
function stripHtmlTags(html) {
    if (html === null || html === undefined) {
        return '';
    }

    const div = document.createElement('div');
    div.textContent = html;
    return div.textContent || div.innerText || '';
}

// Export functions for use in other files
// (These are available globally when script is loaded)
