// src/server.js
// ══════════════════════════════════════════════════════
//   Mullai Banaras — Production Backend Server
//   Handles: Enquiries · Catalogue · Analytics · Admin
// ══════════════════════════════════════════════════════

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const compression= require('compression');
const morgan     = require('morgan');
const path       = require('path');

const connectDB      = require('./config/database');
const routes         = require('./routes/index');
const logger         = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ───────────────────────────────
connectDB();

// ════════════════════════════════════════════════════
//  MIDDLEWARE STACK
//  Order matters — security first, then parsing
// ════════════════════════════════════════════════════

// 1. Security headers — CSP disabled to allow admin dashboard CDN scripts
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// 2. GZIP compression — reduces response size by ~70%
app.use(compression({
  level: 6,              // Balance speed vs compression
  threshold: 1024,       // Only compress responses > 1KB
}));

// 3. CORS — allow your frontend domain
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://mullaibanarasi.com',
  'https://www.mullaibanarasi.com',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
}));

// 4. Request logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/api/health', // Don't log health checks
  }));
}

// 5. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Global rate limiting
app.use('/api', apiLimiter);

// 7. Trust proxy (needed for correct IP behind Nginx/load balancer)
app.set('trust proxy', 1);


// ════════════════════════════════════════════════════
//  ROUTES
// ════════════════════════════════════════════════════
app.use('/api', routes);

// Serve static frontend files if present
app.use(express.static(path.join(__dirname, '../public')));

// ── Root route ───────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🪡 Mullai Banaras API',
    version: '1.0.0',
    docs: '/api/health',
    business: 'Near Chowk Thateri Bazar, Varanasi',
  });
});

// ── 404 handler ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global error handler ─────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message),
    });
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({ success: false, message: 'Duplicate entry found.' });
  }
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong.' : err.message,
  });
});


// ════════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════════
const server = app.listen(PORT, () => {
  logger.info(`
  ╔═══════════════════════════════════════════╗
  ║   🪡  MULLAI BANARAS API RUNNING           ║
  ║   Port    : ${PORT}                           ║
  ║   Mode    : ${process.env.NODE_ENV || 'development'}                  ║
  ║   Health  : http://localhost:${PORT}/api/health║
  ╚═══════════════════════════════════════════╝
  `);
});

// Handle server shutdown gracefully
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

module.exports = app;
