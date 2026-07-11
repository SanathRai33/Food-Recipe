const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error'
        }),
        new winston.transports.File({
            filename: path.join('logs', 'combined.log')
        })
    ]
});

const log = {
    info: (message, meta = {}) => {
        logger.info(message, meta);
    },
    error: (message, meta = {}) => {
        logger.error(message, meta);
    },
    warn: (message, meta = {}) => {
        logger.warn(message, meta);
    },
    debug: (message, meta = {}) => {
        logger.debug(message, meta);
    },
    http: (req, res, responseTime) => {
        logger.info(`${req.method} ${req.url}`, {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });
    }
};

module.exports = log;