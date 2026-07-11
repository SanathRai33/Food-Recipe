const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (value) => {
    if (typeof value === 'string') {
        return sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {},
            disallowedTagsMode: 'discard'
        }).trim();
    }
    if (Array.isArray(value)) {
        return value.map(item => sanitizeInput(item));
    }
    if (typeof value === 'object' && value !== null) {
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            sanitized[key] = sanitizeInput(val);
        }
        return sanitized;
    }
    return value;
};

const sanitizeBody = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeInput(req.body);
    }
    if (req.query) {
        req.query = sanitizeInput(req.query);
    }
    if (req.params) {
        req.params = sanitizeInput(req.params);
    }
    next();
};

const sanitizeHtmlContent = (content) => {
    return sanitizeHtml(content, {
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        allowedAttributes: {},
        allowedSchemes: ['http', 'https'],
        disallowedTagsMode: 'discard'
    });
};

module.exports = {
    sanitizeBody,
    sanitizeInput,
    sanitizeHtmlContent
};