const express = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const { orderLimiter } = require('../middleware/rateLimiter');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Customer routes
router.post('/',
  authenticate,
  authorize('customer', 'admin'),
  orderLimiter,
  [
    body('items').isArray({ min: 1 }),
    body('items.*.menu_item_id').isUUID(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('items.*.special_instructions').optional().trim(),
    body('address_id').isUUID(),
    body('delivery_notes').optional().trim(),
    body('payment_method').optional().isIn(['card', 'cash', 'payme', 'click'])
  ],
  validate,
  orderController.createOrder
);

router.get('/my-orders',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'paid', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validate,
  orderController.getMyOrders
);

router.get('/:id',
  authenticate,
  orderController.getOrder
);

router.patch('/:id/cancel',
  authenticate,
  [body('cancellation_reason').optional().trim()],
  validate,
  orderController.cancelOrder
);

// Admin routes
router.get('/',
  authenticate,
  authorize('admin'),
  [
    query('status').optional(),
    query('payment_status').optional(),
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validate,
  orderController.getAllOrders
);

router.patch('/:id/status',
  authenticate,
  authorize('admin'),
  [
    body('status').isIn(['pending', 'paid', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'])
  ],
  validate,
  orderController.updateOrderStatus
);

router.get('/statistics/overview',
  authenticate,
  authorize('admin'),
  [
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601()
  ],
  validate,
  orderController.getOrderStatistics
);

module.exports = router;