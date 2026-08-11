// MongoDB connection helper.
const mongoose = require('mongoose');
const config = require('./env.config');
const logger = require('./logger.config');

/**
 * Connects to MongoDB Atlas.
 * Exits the process on failure — an API server with no database is useless,
 * so we prefer a loud crash (visible in logs / process manager) over a
 * server that "starts successfully" but fails every single request.
 */
async function connectDB() {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(config.db.uri, {
      // Modern Mongoose (6+/8+) no longer needs useNewUrlParser / useUnifiedTopology,
      // but maxPoolSize is worth being explicit about for a production API.
      maxPoolSize: 10,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}`);

    // Log connection-level events so infra issues surface in the logs
    // instead of silently degrading request performance.
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
  } catch (error) {
    logger.error(`MongoDB initial connection failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
