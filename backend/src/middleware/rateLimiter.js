const rateLimit = require('express-rate-limit');
const { ApiResponse, sendResponse } = require('../utils/apiResponse');

const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: `${message}. Please try again later.`,
            timestamp: new Date().toISOString()
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            const response = ApiResponse.error(`${message}. Please try again later.`, null, 429);
            return sendResponse(res, response);
        },
        keyGenerator: (req) => {
            return req.user?.id || req.ip;
        },
        skip: (req) => {
            return req.path === '/api/health' || req.user?.is_admin;
        }
    });
};

const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 requests
    'Too many authentication attempts'
);

const passwordResetLimiter = createRateLimiter(
    60 * 60 * 1000, // 1 hour
    3, // 3 requests
    'Too many password reset attempts'
);

const apiLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many requests'
);

const searchLimiter = createRateLimiter(
    60 * 1000, // 1 minute
    30, // 30 requests
    'Too many search requests'
);

module.exports = {
    authLimiter,
    passwordResetLimiter,
    apiLimiter,
    searchLimiter,
    createRateLimiter
};