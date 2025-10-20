const express = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Public routes
router.get('/',
  [
    query('include_items').optional().isBoolean(),
    query('active_only').optional().isBoolean()
  ],
  validate,
  categoryController.getCategories
);

router.get('/:id', categoryController.getCategory);

// Admin only routes
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('name_uz').optional().trim(),
    body('name_ru').optional().trim(),
    body('description').optional().trim(),
    body('image_url').optional().isURL(),
    body('sort_order').optional().isInt()
  ],
  validate,
  categoryController.createCategory
);

router.put('/:id',
  authenticate,
  authorize('admin'),
  categoryController.updateCategory
);

router.delete('/:id',
  authenticate,
  authorize('admin'),
  categoryController.deleteCategory
);

module.exports = router;