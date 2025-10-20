const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

const router = express.Router();

// Register
router.post('/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').trim().notEmpty(),
    body('role').optional().isIn(['customer', 'delivery', 'admin'])
  ],
  validate,
  authController.register
);

// Login
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  authController.login
);

// Telegram authentication
router.post('/telegram',
  [
    body('telegram_id').notEmpty(),
    body('first_name').notEmpty()
  ],
  validate,
  authController.telegramAuth
);

// Refresh token
router.post('/refresh',
  [body('refreshToken').notEmpty()],
  validate,
  authController.refreshToken
);

// Get current user
router.get('/me', authenticate, authController.getCurrentUser);

// Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;