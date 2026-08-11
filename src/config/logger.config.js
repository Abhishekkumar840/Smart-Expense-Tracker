// Logger setup for request and error tracking.
const winston = require('winston');
const config = require('./env.config');

const logger = winston.createLogger({
  level: config.isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    // In production, also persist logs to disk — helpful for debugging
    // deployed environments where you can't attach a terminal.
    ...(config.isProduction
      ? [new winston.transports.File({ filename: 'logs/error.log', level: 'error' })]
      : []),
  ],
});

module.exports = logger;
