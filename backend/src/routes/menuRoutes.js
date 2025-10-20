const express = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const menuController = require('../controllers/menuController');

const router = express.Router();

// Public routes
router.get('/',
  [
    query('category_id').optional().isUUID(),
    query('available_only').optional().isBoolean(),
    query('featured_only').optional().isBoolean(),
    query('search').optional().trim()
  ],
  validate,
  menuController.getMenuItems
);

router.get('/:id', menuController.getMenuItem);

// Admin only routes
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('category_id').isUUID(),
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('description').optional().trim(),
    body('image_url').optional().isURL(),
    body('preparation_time').optional().isInt({ min: 1 }),
    body('calories').optional().isInt({ min: 0 })
  ],
  validate,
  menuController.createMenuItem
);

router.put('/:id',
  authenticate,
  authorize('admin'),
  menuController.updateMenuItem
);

router.delete('/:id',
  authenticate,
  authorize('admin'),
  menuController.deleteMenuItem
);

router.patch('/:id/toggle-availability',
  authenticate,
  authorize('admin'),
  menuController.toggleAvailability
);

module.exports = router;