const path = require('path');
const fs = require('fs');
const { logger } = require('../config/database');
const supabase = require('../config/supabase');
const { Category, MenuItem, User } = require('../models');
require('dotenv').config();

const USE_SUPABASE = !!process.env.SUPABASE_URL || !!process.env.SUPABASE_DATABASE_URL;

/**
 * Upload single image
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const type = req.params.type || 'general';

    if (USE_SUPABASE && req.file && req.file.buffer) {
      // Upload to Supabase storage
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads';
      const filename = `${type}/${Date.now()}-${req.file.originalname}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) {
        logger.error('Supabase upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filename);
      // If Supabase returns object with publicUrl or publicURL depending on SDK, normalize
      const imageUrl = publicData?.publicUrl || publicData?.publicURL || `${process.env.SUPABASE_PUBLIC_URL || ''}/${bucket}/${filename}`;

      logger.info(`Image uploaded to Supabase: ${imageUrl}`);

      // If an ID was provided, attach image to the corresponding model
      const id = req.params.id;
      if (id) {
        try {
          if (type === 'categories') {
            const category = await Category.findByPk(id);
            if (!category) {
              return res.status(404).json({ success: false, message: 'Category not found' });
            }
            await category.update({ image_url: imageUrl });
            return res.status(200).json({ success: true, data: { url: imageUrl, resource: category } });
          }

          if (type === 'menu') {
            const menuItem = await MenuItem.findByPk(id);
            if (!menuItem) {
              return res.status(404).json({ success: false, message: 'Menu item not found' });
            }
            await menuItem.update({ image_url: imageUrl });
            return res.status(200).json({ success: true, data: { url: imageUrl, resource: menuItem } });
          }

          if (type === 'avatars') {
            const user = await User.findByPk(id);
            if (!user) {
              return res.status(404).json({ success: false, message: 'User not found' });
            }
            // Only admins or the user themselves should be allowed. Route-level check should enforce this, but double-check here.
            if (req.user && req.user.role !== 'admin' && req.user.id !== id) {
              return res.status(403).json({ success: false, message: 'Forbidden' });
            }
            await user.update({ avatar_url: imageUrl });
            return res.status(200).json({ success: true, data: { url: imageUrl, resource: user } });
          }
        } catch (errAttach) {
          logger.error('Failed to attach image to resource:', errAttach);
          // fallthrough to returning upload info
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          url: imageUrl,
          filename: path.basename(filename),
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    }

    // Fallback: disk storage behavior
    const imageUrl = `/uploads/${type}/${req.file.filename}`;

    logger.info(`Image uploaded: ${imageUrl}`);

    // If ID provided, attach to model (disk fallback)
    const id = req.params.id;
    if (id) {
      try {
        if (type === 'categories') {
          const category = await Category.findByPk(id);
          if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
          }
          await category.update({ image_url: imageUrl });
          return res.status(200).json({ success: true, data: { url: imageUrl, resource: category } });
        }

        if (type === 'menu') {
          const menuItem = await MenuItem.findByPk(id);
          if (!menuItem) {
            return res.status(404).json({ success: false, message: 'Menu item not found' });
          }
          await menuItem.update({ image_url: imageUrl });
          return res.status(200).json({ success: true, data: { url: imageUrl, resource: menuItem } });
        }

        if (type === 'avatars') {
          const user = await User.findByPk(id);
          if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
          }
          if (req.user && req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
          }
          await user.update({ avatar_url: imageUrl });
          return res.status(200).json({ success: true, data: { url: imageUrl, resource: user } });
        }
      } catch (errAttach) {
        logger.error('Failed to attach image to resource:', errAttach);
        // fallthrough to returning upload info
      }
    }

    res.status(200).json({
      success: true,
      data: {
        url: imageUrl,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    logger.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

/**
 * Delete image
 */
exports.deleteImage = async (req, res) => {
  try {
    const { type, filename } = req.params;
    
    if (!type || !filename) {
      return res.status(400).json({
        success: false,
        message: 'Type and filename are required'
      });
    }

    const filePath = path.join(__dirname, '../../uploads', type, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    logger.info(`Image deleted: ${type}/${filename}`);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    logger.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};