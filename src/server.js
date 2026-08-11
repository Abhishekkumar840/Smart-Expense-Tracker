// Server bootstrap.
const app = require('./app');
const connectDB = require('./config/db.config');
const logger = require('./config/logger.config');
const config = require('./config/env.config');

let server;

async function startServer() {
  // Connect to MongoDB BEFORE accepting HTTP traffic — there's no point
  // accepting requests the app can't actually serve.
  await connectDB();

  server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.env} mode on port ${config.port}`);
  });
}

startServer();

// ----------------------------------------------------------------------
// CRASH SAFETY
// ----------------------------------------------------------------------
// Without these handlers, an unhandled promise rejection or uncaught
// exception can leave the process in a corrupted, half-alive state
// (accepting connections it can no longer properly serve). We log the
// error and exit deliberately, so a process manager (PM2, Docker, systemd)
// can restart it cleanly.
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason instanceof Error ? reason.stack : reason}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.stack}`);
  process.exit(1);
});

// ----------------------------------------------------------------------
// GRACEFUL SHUTDOWN
// ----------------------------------------------------------------------
// When the host platform sends SIGTERM (e.g. during a deploy or container
// restart), stop accepting NEW connections but let in-flight requests
// finish first, instead of dropping active users mid-request.
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Process terminated.');
    });
  }
});
