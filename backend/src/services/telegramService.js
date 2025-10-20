const { customerBot, deliveryBot } = require('./notificationService');
const { User, Order, MenuItem, Category } = require('../models');
const { logger } = require('../config/database');

// Setup customer bot commands
const setupCustomerBot = () => {
  customerBot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const text = `
Welcome to ${process.env.RESTAURANT_NAME}! 🍽️

Use our Telegram Mini App to:
🛒 Browse menu
📦 Place orders
📍 Track deliveries
💳 Make payments

Tap the button below to open the app!
    `;

    await customerBot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🍽️ Open Menu', web_app: { url: `${process.env.TELEGRAM_WEBAPP_URL}/customer` } }
        ]]
      }
    });
  });

  customerBot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    
    const categories = await Category.findAll({
      where: { is_active: true },
      include: [{
        model: MenuItem,
        as: 'items',
        where: { is_available: true },
        required: false
      }],
      order: [['sort_order', 'ASC']]
    });

    let text = '📋 *Our Menu*\n\n';
    
    categories.forEach(cat => {
      text += `*${cat.name}*\n`;
      cat.items.forEach(item => {
        text += `  • ${item.name} - ${item.price} UZS\n`;
      });
      text += '\n';
    });

    await customerBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  });

  customerBot.onText(/\/myorders/, async (msg) => {
    const chatId = msg.chat.id;
    const telegram_id = msg.from.id.toString();

    const user = await User.findOne({ where: { telegram_id } });
    
    if (!user) {
      await customerBot.sendMessage(chatId, 'Please register first by opening the app.');
      return;
    }

    const orders = await Order.findAll({
      where: { customer_id: user.id },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    if (orders.length === 0) {
      await customerBot.sendMessage(chatId, 'You have no orders yet.');
      return;
    }

    let text = '📦 *Your Recent Orders*\n\n';
    
    orders.forEach(order => {
      text += `Order #${order.order_number}\n`;
      text += `Status: ${order.status}\n`;
      text += `Total: ${order.total_amount} UZS\n\n`;
    });

    await customerBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  });

  logger.info('Customer bot commands setup complete');
};

// Setup delivery bot commands
const setupDeliveryBot = () => {
    deliveryBot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const text = `
Welcome to ${process.env.RESTAURANT_NAME} Delivery! 🚗

Use our Telegram Mini App to:
📦 View available deliveries
✅ Accept delivery jobs
📍 Update your location
💰 Track your earnings

Tap the button below to open the app!
    `;

    await deliveryBot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [[
          { text: '🚗 Open Delivery App', web_app: { url: `${process.env.TELEGRAM_WEBAPP_URL}/delivery` } }
        ]]
      }
    });
  });

  deliveryBot.onText(/\/available/, async (msg) => {
    const chatId = msg.chat.id;
    const telegram_id = msg.from.id.toString();

    const user = await User.findOne({ 
      where: { telegram_id, role: 'delivery' }
    });
    
    if (!user) {
      await deliveryBot.sendMessage(chatId, 'You are not registered as a delivery partner.');
      return;
    }

    const { Delivery } = require('../models');
    
    const availableDeliveries = await Delivery.findAll({
      where: { status: 'pending' },
      include: [{
        model: Order,
        as: 'order',
        where: { status: 'ready' }
      }],
      limit: 5
    });

    if (availableDeliveries.length === 0) {
      await deliveryBot.sendMessage(chatId, 'No deliveries available at the moment.');
      return;
    }

    let text = '📦 *Available Deliveries*\n\n';
    
    availableDeliveries.forEach(delivery => {
      text += `Order #${delivery.order.order_number}\n`;
      text += `Amount: ${delivery.order.total_amount} UZS\n`;
      text += `Distance: ~${delivery.distance_km || 'N/A'} km\n\n`;
    });

    await deliveryBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  });

  deliveryBot.onText(/\/mydeliveries/, async (msg) => {
    const chatId = msg.chat.id;
    const telegram_id = msg.from.id.toString();

    const user = await User.findOne({ 
      where: { telegram_id, role: 'delivery' }
    });
    
    if (!user) {
      await deliveryBot.sendMessage(chatId, 'You are not registered as a delivery partner.');
      return;
    }

    const { Delivery } = require('../models');
    
    const myDeliveries = await Delivery.findAll({
      where: { 
        delivery_partner_id: user.id,
        status: ['accepted', 'picked_up', 'in_transit']
      },
      include: [{
        model: Order,
        as: 'order'
      }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    if (myDeliveries.length === 0) {
      await deliveryBot.sendMessage(chatId, 'You have no active deliveries.');
      return;
    }

    let text = '🚗 *Your Active Deliveries*\n\n';
    
    myDeliveries.forEach(delivery => {
      text += `Order #${delivery.order.order_number}\n`;
      text += `Status: ${delivery.status}\n`;
      text += `Amount: ${delivery.order.total_amount} UZS\n\n`;
    });

    await deliveryBot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
  });

  logger.info('Delivery bot commands setup complete');
};

// Handle callback queries
const setupCallbackHandlers = () => {
  customerBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('view_order_')) {
      const orderId = data.replace('view_order_', '');
      const order = await Order.findByPk(orderId);
      
      if (order) {
        const text = `
📦 *Order #${order.order_number}*

Status: ${order.status}
Total: ${order.total_amount} UZS
Payment: ${order.payment_status}

${order.estimated_delivery_time ? `Estimated Delivery: ${new Date(order.estimated_delivery_time).toLocaleString()}` : ''}
        `;

        await customerBot.sendMessage(chatId, text, { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: '🍽️ Open App', web_app: { url: `${process.env.TELEGRAM_WEBAPP_URL}/customer/orders/${orderId}` } }
            ]]
          }
        });
      }
    }

    await customerBot.answerCallbackQuery(query.id);
  });

  deliveryBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    if (data.startsWith('accept_delivery_')) {
      const deliveryId = data.replace('accept_delivery_', '');
      // Handle delivery acceptance
      await deliveryBot.sendMessage(chatId, 'Please use the app to accept deliveries.');
    }

    await deliveryBot.answerCallbackQuery(query.id);
  });
};

// Initialize all bots
const initializeTelegramBots = () => {
  try {
    setupCustomerBot();
    setupDeliveryBot();
    setupCallbackHandlers();
    logger.info('✅ Telegram bots initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Telegram bots:', error);
  }
};

module.exports = {
  initializeTelegramBots,
  customerBot,
  deliveryBot
};