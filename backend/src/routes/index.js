const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const newsRoutes = require('./newsRoutes');
const settingsRoutes = require('./settingsRoutes');
const { authenticate, authorize } = require('../middleware/auth');
const debugRoutes = require('./debugRoutes');

// Public
router.get('/banners', bannerController.getActiveBanners);

// News routes
router.use('/news', newsRoutes);

// Debug routes (non-destructive)
router.use('/debug', debugRoutes);
// Settings
router.use('/settings', settingsRoutes);

// Admin CRUD for banners
router.get('/admin/banners', authenticate, authorize('admin'), bannerController.listBanners);
router.post('/admin/banners', authenticate, authorize('admin'), bannerController.createBanner);
router.put('/admin/banners/:id', authenticate, authorize('admin'), bannerController.updateBanner);
router.delete('/admin/banners/:id', authenticate, authorize('admin'), bannerController.deleteBanner);

module.exports = router;



