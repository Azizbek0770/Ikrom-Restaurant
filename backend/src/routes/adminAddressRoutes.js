const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const adminAddressController = require('../controllers/adminAddressController');

const router = express.Router();

// All routes require admin
router.get('/users/:userId/addresses', authenticate, authorize('admin'), adminAddressController.getAddressesForUser);
router.post('/users/:userId/addresses', authenticate, authorize('admin'), adminAddressController.createAddressForUser);
router.put('/users/:userId/addresses/:id', authenticate, authorize('admin'), adminAddressController.updateAddressForUser);
router.delete('/users/:userId/addresses/:id', authenticate, authorize('admin'), adminAddressController.deleteAddressForUser);

module.exports = router;


