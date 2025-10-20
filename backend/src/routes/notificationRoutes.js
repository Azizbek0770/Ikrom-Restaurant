const express = require('express');
const { query } = require('express-validator');
const { validate } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { getUserNotifications, markAsRead } = require('../services/notificationService');

const router = express.Router();

router.get('/',
  authenticate,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('unread_only').optional().isBoolean()
  ],
  validate,
  async (req, res, next) => {
    try {
      const notifications = await getUserNotifications(req.user.id, req.query);
      
      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }
);

router.patch('/:id/read',
  authenticate,
  async (req, res, next) => {
    try {
      const notification = await markAsRead(req.params.id, req.user.id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: { notification }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;