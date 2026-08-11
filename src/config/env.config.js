// Central environment configuration.
require('dotenv').config();

// List every environment variable the application cannot run without.
// Fail fast if any are missing — this prevents confusing runtime errors
// later (e.g. "jwt malformed" because JWT_ACCESS_SECRET was undefined).
const REQUIRED_ENV_VARS = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Thrown at import time -> server.js never even starts listening.
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Copy .env.example to .env and fill in real values.`
    );
  }
}

validateEnv();

const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  db: {
    uri: process.env.MONGO_URI,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  mail: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'Smart Expense Tracker <no-reply@expensetracker.com>',
  },

  upload: {
    maxFileSizeMb: Number(process.env.MAX_FILE_UPLOAD_MB) || 5,
    dir: process.env.UPLOAD_DIR || 'uploads',
  },

  rateLimit: {
    windowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15,
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },
});

module.exports = config;
