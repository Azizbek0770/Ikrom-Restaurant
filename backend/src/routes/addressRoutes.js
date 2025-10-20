const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const addressController = require('../controllers/addressController');

const router = express.Router();

router.get('/',
  authenticate,
  addressController.getAddresses
);

router.get('/:id',
  authenticate,
  addressController.getAddress
);

router.post('/',
  authenticate,
  [
    body('street_address').trim().notEmpty(),
    body('apartment').optional().trim(),
    body('entrance').optional().trim(),
    body('floor').optional().trim(),
    body('city').optional().trim(),
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
    body('label').optional().trim(),
    body('is_default').optional().isBoolean(),
    body('delivery_instructions').optional().trim()
  ],
  validate,
  addressController.createAddress
);

router.put('/:id',
  authenticate,
  addressController.updateAddress
);

router.delete('/:id',
  authenticate,
  addressController.deleteAddress
);

router.patch('/:id/set-default',
  authenticate,
  addressController.setDefaultAddress
);

module.exports = router;