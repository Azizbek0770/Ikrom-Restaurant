// --- Dependencies ---
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

// --- Import routes ---
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

// --- Allowed Origins ---
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : ['*'];

console.log('🔍 Allowed Origins:', allowedOrigins);

// --- Socket.IO Setup ---
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

global.io = io;
app.set('io', io);

// --- Socket.IO Events ---
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

// --- Middleware ---
app.use(helmet());

// --- CORS Setup with Auto Debugging ---
app.use(
  cors({
    origin: function (origin, callback) {
      console.log('🌐 Incoming Origin:', origin);

      // Allow requests with no origin (like Postman, curl, or Telegram internal)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        console.log('✅ Origin allowed:', origin);
        return callback(null, true);
      } else {
        console.log('❌ Origin blocked by CORS:', origin);
        return callback(
          new Error(
            'CORS policy does not allow access from this origin: ' + origin
          ),
          false
        );
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
  })
);

// --- Debug Endpoint ---
app.get('/api/debug', (req, res) => {
  res.json({
    status: 'ok ✅',
    origin: req.headers.origin || 'No origin header',
    time: new Date().toISOString(),
    allowedOrigins,
  });
});

// --- Webhook routes (raw body support) ---
app.use('/api/webhooks', webhookRoutes);

// --- Body Parsers ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Logging ---
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- Rate Limiting ---
app.use('/api', generalLimiter);

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// --- Static Uploads ---
app.use('/uploads', express.static('uploads'));

// --- Serve Customer Webapp (if exists) ---
const path = require('path');
const fs = require('fs');
const customerDist = path.join(__dirname, '../../telegram_apps/customer_app/dist');
if (fs.existsSync(customerDist)) {
  app.use('/customer', express.static(customerDist));
  app.get('/customer/*', (req, res) => {
    res.sendFile(path.join(customerDist, 'index.html'));
  });
  logger.info('Serving customer SPA from backend at /customer');
}

// --- API Routes ---
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

// --- 404 and Error Handlers ---
app.use(notFound);
app.use(errorHandler);

// --- Database Initialization & Server Start ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    const enableDbSync = (process.env.ENABLE_DB_SYNC || '').toLowerCase() === 'true';

    if (enableDbSync) {
      try {
        await sequelize.query(`
          DO $$
          DECLARE duplicate_value VARCHAR;
          BEGIN
            FOR duplicate_value IN 
              SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL GROUP BY telegram_id HAVING COUNT(*) > 1
            LOOP
              UPDATE users SET telegram_id = NULL WHERE telegram_id = duplicate_value 
              AND id NOT IN (
                SELECT id FROM users WHERE telegram_id = duplicate_value ORDER BY created_at ASC LIMIT 1
              );
            END LOOP;
            FOR duplicate_value IN 
              SELECT email FROM users WHERE email IS NOT NULL GROUP BY email HAVING COUNT(*) > 1
            LOOP
              UPDATE users SET email = NULL WHERE email = duplicate_value 
              AND id NOT IN (
                SELECT id FROM users WHERE email = duplicate_value ORDER BY created_at ASC LIMIT 1
              );
            END LOOP;
          END$$;
        `);
        logger.info('✅ Duplicate cleanup completed');
      } catch (cleanupError) {
        logger.warn('Duplicate cleanup skipped:', cleanupError.message);
      }

      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: true });
        logger.info('✅ Database synced');
      }
    } else {
      logger.info('Database sync skipped (ENABLE_DB_SYNC not enabled)');
    }

    // --- Initialize Telegram Bots ---
    initializeTelegramBots();

    // --- Start server ---
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

// --- Graceful Shutdown ---
['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`${signal} received, shutting down gracefully...`);
    server.close(async () => {
      await sequelize.close();
      logger.info('Server closed');
      process.exit(0);
    });
  });
});

// --- Error Handling for Uncaught Issues ---
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
