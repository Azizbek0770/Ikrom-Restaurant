const express = require('express');
const router = express.Router();
const { uploadHandler } = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../controllers/uploadController');

/**
 * @route   POST /api/upload/:type
 * @desc    Upload image (type: categories, menu, avatars, general)
 * @access  Private (Admin for categories/menu, Any authenticated for avatars)
 */
router.post(
  '/:type/:id?',
  authenticate,
  (req, res, next) => {
    const { type } = req.params;
    // Only admin can upload category and menu images
    if (type === 'categories' || type === 'menu') {
      return authorize('admin')(req, res, next);
    }
    next();
  },
  // Map incoming type to upload config type
  (req, res, next) => {
    const { type } = req.params;
    let muxType = 'general';
    if (type === 'categories' || type === 'menu' || type === 'banners') muxType = 'image';
    if (type === 'avatars') muxType = 'avatar';

    return uploadHandler({ type: muxType, field: 'image' })(req, res, next);
  },
  uploadImage
);

/**
 * @route   DELETE /api/upload/:type/:filename
 * @desc    Delete image
 * @access  Private (Admin)
 */
router.delete(
  '/:type/:filename',
  authenticate,
  authorize('admin'),
  deleteImage
);

module.exports = router;