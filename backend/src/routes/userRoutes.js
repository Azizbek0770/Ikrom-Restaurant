const express = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');
const { uploadHandler } = require('../middleware/upload');

const router = express.Router();

// List users (admin)
router.get('/',
  authenticate,
  authorize('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('per_page').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['customer', 'delivery', 'admin']),
    query('search').optional().trim(),
    query('active_only').optional().isBoolean()
  ],
  validate,
  userController.getUsers
);

// Get single user (admin)
router.get('/:id', authenticate, authorize('admin'), userController.getUser);

// Create user (admin)
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('first_name').trim().notEmpty(),
    body('role').optional().isIn(['customer', 'delivery', 'admin']),
    body('phone').optional().trim(),
    body('avatar_url').optional().isURL(),
    body('is_active').optional().isBoolean(),
    body('is_verified').optional().isBoolean()
  ],
  validate,
  userController.createUser
);

// Update user (admin)
router.put('/:id', authenticate, authorize('admin'), userController.updateUser);

// Delete user (admin)
router.delete('/:id', authenticate, authorize('admin'), userController.deleteUser);

// Upload avatar for a user (admin or owner)
router.post('/:id/avatar',
  authenticate,
  (req, res, next) => {
    // Allow admin or the user themselves
    const id = req.params.id;
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  },
  uploadHandler({ type: 'avatar', field: 'image' }),
  userController.updateUser
);

module.exports = router;
