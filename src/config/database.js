// src/config/database.js
// MongoDB connection with pooling for high traffic

const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pooling — handles many users simultaneously
      maxPoolSize: 50,        // Up to 50 concurrent DB connections
      minPoolSize: 5,         // Keep 5 connections warm always
      socketTimeoutMS: 45000, // 45s socket timeout
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
      
      // Performance
      bufferCommands: false,
      autoIndex: true,
    });

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Graceful disconnect on app shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB disconnected on app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Monitor connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

module.exports = connectDB;
