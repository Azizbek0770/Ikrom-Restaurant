const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', newsController.getPublishedNews);
router.get('/:id', newsController.getNewsById);

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), newsController.listNews);
router.post('/admin/create', authenticate, authorize('admin'), newsController.createNews);
router.put('/admin/:id', authenticate, authorize('admin'), newsController.updateNews);
router.delete('/admin/:id', authenticate, authorize('admin'), newsController.deleteNews);
router.patch('/admin/:id/toggle-publish', authenticate, authorize('admin'), newsController.togglePublish);

module.exports = router;
