const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticate, authorize } = require('../middleware/auth');

// Public
router.get('/banners', bannerController.getActiveBanners);

// Admin CRUD for banners
router.get('/admin/banners', authenticate, authorize('admin'), bannerController.listBanners);
router.post('/admin/banners', authenticate, authorize('admin'), bannerController.createBanner);
router.put('/admin/banners/:id', authenticate, authorize('admin'), bannerController.updateBanner);
router.delete('/admin/banners/:id', authenticate, authorize('admin'), bannerController.deleteBanner);

module.exports = router;


