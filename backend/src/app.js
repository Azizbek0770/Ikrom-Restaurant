const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { testConnection, sequelize, logger } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { initializeTelegramBots } = require('./services/telegramService');

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/OrderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const addressRoutes = require('./routes/addressRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const indexRoutes = require('./routes/index');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
// Derive allowed origins from env once and reuse for both Socket.IO and Express CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : ['*'];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins.indexOf('*') !== -1 ? '*' : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible globally
global.io = io;
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    logger.info(`Socket ${socket.id} joined user room: ${userId}`);
  });

  socket.on('join_order_room', (orderId) => {
    socket.join(`order_${orderId}`);
    logger.info(`Socket ${socket.id} joined order room: ${orderId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet());
// Configure Express CORS using the same allowedOrigins derived earlier
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like curl, mobile apps, or server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf('*') !== -1) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Webhook routes (need raw body)
app.use('/api/webhooks', webhookRoutes);

// Regular JSON parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Dev helper: serve customer webapp from backend under /customer if built
const path = require('path');
const fs = require('fs');
const customerDist = path.join(__dirname, '../../telegram_apps/customer_app/dist');
if (fs.existsSync(customerDist)) {
  // Serve static assets
  app.use('/customer', express.static(customerDist));

  // For any /customer/* path, serve index.html (SPA fallback)
  app.get('/customer/*', (req, res) => {
    res.sendFile(path.join(customerDist, 'index.html'));
  });

  logger.info('Serving customer SPA from backend at /customer');
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', indexRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Database initialization and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Clean up duplicates before syncing (prevents unique constraint violations)
    try {
      await sequelize.query(`
        DO $$
        DECLARE
          duplicate_value VARCHAR;
        BEGIN
          -- Fix duplicate telegram_id values (keep oldest, nullify others)
          FOR duplicate_value IN 
            SELECT telegram_id 
            FROM users 
            WHERE telegram_id IS NOT NULL 
            GROUP BY telegram_id 
            HAVING COUNT(*) > 1
          LOOP
            UPDATE users 
            SET telegram_id = NULL 
            WHERE telegram_id = duplicate_value 
              AND id NOT IN (
                SELECT id FROM users 
                WHERE telegram_id = duplicate_value 
                ORDER BY created_at ASC 
                LIMIT 1
              );
          END LOOP;
          
          -- Fix duplicate email values (keep oldest, nullify others)
          FOR duplicate_value IN 
            SELECT email 
            FROM users 
            WHERE email IS NOT NULL 
            GROUP BY email 
            HAVING COUNT(*) > 1
          LOOP
            UPDATE users 
            SET email = NULL 
            WHERE email = duplicate_value 
              AND id NOT IN (
                SELECT id FROM users 
                WHERE email = duplicate_value 
                ORDER BY created_at ASC 
                LIMIT 1
              );
          END LOOP;
        END$$;
      `);
      logger.info('✅ Duplicate cleanup completed');
    } catch (cleanupError) {
      // If cleanup fails (e.g., table doesn't exist yet), continue
      logger.warn('Duplicate cleanup skipped:', cleanupError.message);
    }

    // Sync database (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Database synced');
    }

    // Initialize Telegram bots
    initializeTelegramBots();

    // Start server
    server.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`✅ Environment: ${process.env.NODE_ENV}`);
      logger.info(`✅ API Base URL: ${process.env.API_BASE_URL}`);
    });
  } catch (error) {
    logger.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await sequelize.close();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await sequelize.close();
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();

module.exports = { app, server, io };