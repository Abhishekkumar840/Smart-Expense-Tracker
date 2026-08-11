// Express app setup.
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
require('express-async-errors'); // lets async route handlers throw without asyncHandler in edge cases

const config = require('./config/env.config');
const logger = require('./config/logger.config');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');
const expenseRoutes = require('./routes/expense.routes');
const incomeRoutes = require('./routes/income.routes');
const budgetRoutes = require('./routes/budget.routes');
const categoryRoutes = require('./routes/category.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');
const app = express();

// ----------------------------------------------------------------------
// SECURITY MIDDLEWARE
// ----------------------------------------------------------------------
// Helmet sets ~15 security-related HTTP headers (X-Content-Type-Options,
// X-Frame-Options, etc.) in one call — this is the single easiest way to
// close common HTTP header vulnerabilities.
app.use(helmet());

// CORS is locked to the known frontend origin (from env), not "*" — a
// wildcard origin combined with credentials:true is both invalid and
// insecure. Only the configured client can make credentialed requests.
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Applies our global per-IP request cap to every route (see
// rateLimiter.middleware.js — auth routes get an additional, stricter limiter).
app.use(apiLimiter);

// ----------------------------------------------------------------------
// BODY PARSING & COMPRESSION
// ----------------------------------------------------------------------
app.use(express.json({ limit: '10kb' })); // limit prevents large-payload DoS attempts
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // reads refresh-token cookie for auth
app.use(compression()); // gzip responses to reduce payload size

// ----------------------------------------------------------------------
// LOGGING
// ----------------------------------------------------------------------
// morgan logs each HTTP request; piped through winston so dev and prod
// logs go through the same formatting/transport pipeline.
app.use(
  morgan('dev', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// ----------------------------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------------------------
// Used by uptime monitors / load balancers to verify the API is alive
// without touching the database.
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy', timestamp: new Date().toISOString() });
});

// ----------------------------------------------------------------------
// ROUTES
// ----------------------------------------------------------------------
// Intentionally left as a placeholder here — routes/index.js will be
// mounted at /api in the next module (Auth & User routes), once the
// domain models and controllers exist. Keeping app.js stable now means
// later modules only ADD a line here, never restructure this file.
//
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/incomes', incomeRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/auth', authRoutes);
// ----------------------------------------------------------------------
// ERROR HANDLING (must be registered LAST, in this order)
// ----------------------------------------------------------------------
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
