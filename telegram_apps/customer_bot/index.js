const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN_CUSTOMER;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
  const WEBAPP_URL = process.env.WEBAPP_URL || 'https://679b0f6d4fbd.ngrok-free.app';

const bot = new TelegramBot(token, { polling: true });

console.log('✅ Customer bot started successfully');

// Helper function to get user from database
async function getUser(telegramId) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/telegram`, {
      telegram_id: telegramId.toString(),
      first_name: 'User',
      last_name: ''
    });
    return response.data.data.user;
  } catch (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
}

// Helper function to get user token
async function authenticateUser(telegramId, firstName, lastName) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/telegram`, {
      telegram_id: telegramId.toString(),
      first_name: firstName,
      last_name: lastName || ''
    });
    return response.data.data.accessToken;
  } catch (error) {
    console.error('Authentication error:', error.message);
    return null;
  }
}

// Helper function to make authenticated API calls
async function apiCall(endpoint, token, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('API call error:', error.message);
    return null;
  }
}

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;

  const welcomeMessage = `
👋 Welcome to *Food Delivery*, ${firstName}!

I'm your personal food ordering assistant. Here's what I can help you with:

🍽️ *Browse Menu* - Explore our delicious dishes
🛒 *Place Orders* - Quick and easy ordering
📦 *Track Orders* - Real-time order tracking
📍 *Manage Addresses* - Save delivery locations
💳 *Payment* - Multiple payment options

Tap the button below to open our menu and start ordering! 🚀
  `;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🍽️ Open Menu',
          web_app: { url: WEBAPP_URL }
        }
      ],
      [
        { text: '📦 My Orders', callback_data: 'my_orders' },
        { text: '❓ Help', callback_data: 'help' }
      ]
    ]
  };

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Menu command
bot.onText(/\/menu/, async (msg) => {
  const chatId = msg.chat.id;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🍽️ Browse Full Menu',
          web_app: { url: WEBAPP_URL }
        }
      ]
    ]
  };

  bot.sendMessage(
    chatId,
    '🍽️ *Our Menu*\n\nTap the button below to browse our complete menu with photos, descriptions, and prices!',
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  );
});

// My Orders command
bot.onText(/\/orders/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name;

  try {
    const token = await authenticateUser(telegramId, firstName, lastName);
    if (!token) {
      bot.sendMessage(chatId, '❌ Authentication failed. Please try again.');
      return;
    }

    const result = await apiCall('/orders/my-orders?limit=5', token);
    
    if (!result || !result.data || result.data.orders.length === 0) {
      bot.sendMessage(
        chatId,
        '📦 *No orders found*\n\nYou haven\'t placed any orders yet. Start ordering from our menu!',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🍽️ Browse Menu',
                  web_app: { url: WEBAPP_URL }
                }
              ]
            ]
          }
        }
      );
      return;
    }

    let message = '📦 *Your Recent Orders*\n\n';
    
    result.data.orders.slice(0, 5).forEach((order, index) => {
      const statusEmoji = {
        pending: '⏳',
        paid: '💳',
        confirmed: '✅',
        preparing: '👨‍🍳',
        ready: '📦',
        out_for_delivery: '🚗',
        delivered: '✅',
        cancelled: '❌'
      }[order.status] || '📦';

      message += `${index + 1}. *Order #${order.order_number}*\n`;
      message += `   Status: ${statusEmoji} ${order.status.replace('_', ' ')}\n`;
      message += `   Total: ${formatCurrency(order.total_amount)}\n`;
      message += `   Date: ${formatDate(order.created_at)}\n\n`;
    });

    message += '\nTap "View All Orders" to see complete order history.';

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📦 View All Orders',
            web_app: { url: `${WEBAPP_URL}/orders` }
          }
        ],
        [
          {
            text: '🍽️ Order Again',
            web_app: { url: WEBAPP_URL }
          }
        ]
      ]
    };

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    bot.sendMessage(chatId, '❌ Failed to fetch orders. Please try again later.');
  }
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
❓ *Help & Commands*

*Available Commands:*
/start - Start the bot and see main menu
/menu - Browse our food menu
/orders - View your order history
/help - Show this help message

*How to Order:*
1. Tap "Open Menu" button
2. Browse and add items to cart
3. Proceed to checkout
4. Enter delivery address
5. Choose payment method
6. Confirm your order

*Payment Methods:*
💳 Credit/Debit Card
💵 Cash on Delivery

*Need Help?*
Contact support: @support_username
Phone: ${process.env.RESTAURANT_PHONE || '+998901234567'}

*Delivery Time:*
Estimated 30-45 minutes

*Minimum Order:*
15,000 UZS
  `;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🍽️ Start Ordering',
          web_app: { url: WEBAPP_URL }
        }
      ],
      [
        { text: '📦 My Orders', callback_data: 'my_orders' },
        { text: '📞 Contact', callback_data: 'contact' }
      ]
    ]
  };

  bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Callback query handler
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  const telegramId = query.from.id;
  const firstName = query.from.first_name;
  const lastName = query.from.last_name;

  bot.answerCallbackQuery(query.id);

  switch (data) {
    case 'my_orders':
      bot.sendMessage(chatId, '📦 Fetching your orders...');
      // Trigger /orders command
      bot.emit('message', {
        chat: { id: chatId },
        from: { id: telegramId, first_name: firstName, last_name: lastName },
        text: '/orders'
      });
      break;

    case 'help':
      // Trigger /help command
      bot.emit('message', {
        chat: { id: chatId },
        text: '/help'
      });
      break;

    case 'contact':
      const contactMessage = `
📞 *Contact Information*

*Restaurant:* ${process.env.RESTAURANT_NAME || 'Delicious Bites'}
*Phone:* ${process.env.RESTAURANT_PHONE || '+998901234567'}
*Address:* ${process.env.RESTAURANT_ADDRESS || '123 Main Street, Tashkent'}

*Support Hours:*
Monday - Sunday: 10:00 - 22:00

*Email:* support@restaurant.com
      `;

      bot.sendMessage(chatId, contactMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🍽️ Back to Menu',
                web_app: { url: WEBAPP_URL }
              }
            ]
          ]
        }
      });
      break;

    default:
      if (data.startsWith('view_order_')) {
        const orderId = data.replace('view_order_', '');
        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '👁️ View Order Details',
                web_app: { url: `${WEBAPP_URL}/orders/${orderId}` }
              }
            ]
          ]
        };

        bot.sendMessage(
          chatId,
          `📦 Order Details\n\nTap the button below to view full order details.`,
          { reply_markup: keyboard }
        );
      }
      break;
  }
});

// Handle any text message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands
  if (text && text.startsWith('/')) {
    return;
  }

  // Default response for non-command messages
  if (text && !msg.web_app_data) {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🍽️ Open Menu',
            web_app: { url: WEBAPP_URL }
          }
        ],
        [
          { text: '📦 My Orders', callback_data: 'my_orders' },
          { text: '❓ Help', callback_data: 'help' }
        ]
      ]
    };

    bot.sendMessage(
      chatId,
      'Hi! 👋 Use the buttons below to get started, or type /help for more information.',
      { reply_markup: keyboard }
    );
  }
});

// Handle web app data
bot.on('web_app_data', async (msg) => {
  const chatId = msg.chat.id;
  const data = JSON.parse(msg.web_app_data.data);

  console.log('Received web app data:', data);

  // Handle different types of data from web app
  if (data.type === 'order_placed') {
    bot.sendMessage(
      chatId,
      `✅ *Order Placed Successfully!*\n\nOrder #${data.orderNumber}\nTotal: ${formatCurrency(data.total)}\n\nYou can track your order status in "My Orders".`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Stopping bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping bot...');
  bot.stopPolling();
  process.exit(0);
});

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' UZS';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}