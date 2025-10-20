const express = require('express');
const { body, query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const deliveryController = require('../controllers/deliveryController');

const router = express.Router();

// Delivery partner routes
router.get('/available',
  authenticate,
  authorize('delivery', 'admin'),
  deliveryController.getAvailableDeliveries
);

router.get('/my-deliveries',
  authenticate,
  authorize('delivery'),
  [query('status').optional()],
  validate,
  deliveryController.getMyDeliveries
);

router.post('/:id/accept',
  authenticate,
  authorize('delivery'),
  deliveryController.acceptDelivery
);

router.patch('/:id/location',
  authenticate,
  authorize('delivery'),
  [
    body('latitude').isFloat(),
    body('longitude').isFloat()
  ],
  validate,
  deliveryController.updateDeliveryLocation
);

router.patch('/:id/picked-up',
  authenticate,
  authorize('delivery'),
  deliveryController.markAsPickedUp
);

router.patch('/:id/complete',
  authenticate,
  authorize('delivery'),
  deliveryController.completeDelivery
);

// Admin routes
router.get('/statistics',
  authenticate,
  authorize('admin'),
  [
    query('date_from').optional().isISO8601(),
    query('date_to').optional().isISO8601()
  ],
  validate,
  deliveryController.getDeliveryStatistics
);

module.exports = router;