// Central error handler.
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger.config');
const config = require('../config/env.config');

// Translates common non-ApiError exceptions (Mongoose errors, JWT errors)
// into a proper ApiError so the client always gets a consistent shape,
// even when the error originated from a library we don't control.
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  // Mongoose validation error (e.g. required field missing)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return ApiError.badRequest('Validation failed', messages);
  }

  // Mongoose duplicate key error (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiError.conflict(`${field} already in use`);
  }

  // Mongoose invalid ObjectId (e.g. malformed :id param)
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid token');
  if (err.name === 'TokenExpiredError') return ApiError.unauthorized('Token expired');

  // Anything else is an unexpected bug — treat as a 500 and don't leak
  // internal details to the client.
  return new ApiError(500, 'Internal server error');
}

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const normalized = normalizeError(err);

  // Always log the ORIGINAL error (with stack) server-side, even though the
  // client only sees the normalized, safe message.
  logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, {
    stack: err.stack,
  });

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    errors: normalized.errors,
    // Stack traces are only useful to developers and are a security risk
    // in production (they can reveal file paths / internals).
    stack: config.isProduction ? undefined : err.stack,
  });
}

module.exports = errorMiddleware;
