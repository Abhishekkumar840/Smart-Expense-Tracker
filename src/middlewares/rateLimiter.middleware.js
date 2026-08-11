// Request rate limiting.
const rateLimit = require('express-rate-limit');
const config = require('../config/env.config');

// General-purpose limiter applied to the whole API.
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000,
  max: config.rateLimit.maxRequests,
  standardHeaders: true, // return rate limit info in RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

// Stricter limiter for sensitive auth endpoints (login, forgot-password)
// where brute-force attempts are the specific threat being mitigated.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts. Please try again after 15 minutes.',
  },
});

module.exports = { apiLimiter, authLimiter };
