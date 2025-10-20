const { Notification, User } = require('../models');
const { logger } = require('../config/database');
const TelegramBot = require('node-telegram-bot-api');

// Initialize Telegram bots
const customerBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_CUSTOMER, { polling: false });
const deliveryBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_DELIVERY, { polling: false });

// Create notification
const createNotification = async (user_id, order_id, type, { title, message }) => {
  try {
    const notification = await Notification.create({
      user_id,
      order_id,
      type,
      title,
      message
    });

    // Send to user via Telegram
    await sendTelegramNotification(user_id, title, message, order_id);

    // Emit via WebSocket
    const io = global.io;
    if (io) {
      io.to(`user_${user_id}`).emit('notification', notification);
    }

    logger.info(`Notification created: ${notification.id} for user ${user_id}`);

    return notification;
  } catch (error) {
    logger.error(`Notification creation failed: ${error.message}`);
  }
};

// Send Telegram notification
const sendTelegramNotification = async (user_id, title, message, order_id) => {
  try {
    const user = await User.findByPk(user_id);
    
    if (!user || !user.telegram_id) {
      return;
    }

    const bot = user.role === 'delivery' ? deliveryBot : customerBot;
    
    const text = `*${title}*\n\n${message}`;
    
    const keyboard = order_id ? {
      inline_keyboard: [[
        { text: 'View Order', callback_data: `view_order_${order_id}` }
      ]]
    } : undefined;

    await bot.sendMessage(user.telegram_id, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    logger.info(`Telegram notification sent to user ${user_id}`);
  } catch (error) {
    logger.error(`Telegram notification failed: ${error.message}`);
  }
};

// Mark notification as read
const markAsRead = async (notification_id, user_id) => {
  try {
    const notification = await Notification.findOne({
      where: { id: notification_id, user_id }
    });

    if (notification && !notification.is_read) {
      await notification.update({
        is_read: true,
        read_at: new Date()
      });
    }

    return notification;
  } catch (error) {
    logger.error(`Mark as read failed: ${error.message}`);
    throw error;
  }
};

// Get user notifications
const getUserNotifications = async (user_id, { limit = 20, offset = 0, unread_only = false }) => {
  try {
    const where = { user_id };
    if (unread_only) {
      where.is_read = false;
    }

    const notifications = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    return notifications;
  } catch (error) {
    logger.error(`Get notifications failed: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createNotification,
  sendTelegramNotification,
  markAsRead,
  getUserNotifications,
  customerBot,
  deliveryBot
};