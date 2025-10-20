const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN_DELIVERY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-domain.com/delivery';

const bot = new TelegramBot(token, { polling: true });

console.log('✅ Delivery bot started successfully');

// Helper function to authenticate delivery partner
async function authenticateUser(telegramId, firstName, lastName) {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/telegram`, {
      telegram_id: telegramId.toString(),
      first_name: firstName,
      last_name: lastName || '',
      role: 'delivery'
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
👋 Welcome to *Delivery Partner Portal*, ${firstName}!

I'm your delivery assistant. Here's what you can do:

📦 *View Available Deliveries* - See orders ready for pickup
🚗 *Manage Active Deliveries* - Track your current deliveries
📊 *View Statistics* - Check your earnings and performance
📍 *Update Location* - Share your location during delivery

Tap the button below to open your delivery dashboard! 🚀
  `;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🚗 Open Dashboard',
          web_app: { url: WEBAPP_URL }
        }
      ],
      [
        { text: '📦 Available Jobs', callback_data: 'available_jobs' },
        { text: '📊 My Stats', callback_data: 'my_stats' }
      ],
      [
        { text: '❓ Help', callback_data: 'help' }
      ]
    ]
  };

  bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Available jobs command
bot.onText(/\/available/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name;

  try {
    const token = await authenticateUser(telegramId, firstName, lastName);
    if (!token) {
      bot.sendMessage(chatId, '❌ Authentication failed. Please make sure you are registered as a delivery partner.');
      return;
    }

    const result = await apiCall('/deliveries/available', token);
    
    if (!result || !result.data || result.data.deliveries.length === 0) {
      bot.sendMessage(
        chatId,
        '📦 *No Available Deliveries*\n\nThere are no deliveries available at the moment. Check back soon!',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🔄 Refresh',
                  callback_data: 'available_jobs'
                }
              ]
            ]
          }
        }
      );
      return;
    }

    let message = '📦 *Available Deliveries*\n\n';
    
    result.data.deliveries.slice(0, 5).forEach((delivery, index) => {
      const order = delivery.order;
      message += `${index + 1}. *Order #${order.order_number}*\n`;
      message += `   💰 Amount: ${formatCurrency(order.total_amount)}\n`;
      message += `   📍 Distance: ${delivery.distance_km ? `~${delivery.distance_km} km` : 'N/A'}\n`;
      message += `   📦 Items: ${order.items?.length || 0}\n`;
      message += `   🕐 ${formatTimeAgo(order.created_at)}\n\n`;
    });

    message += '\nTap "Open Dashboard" to accept deliveries.';

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🚗 Open Dashboard',
            web_app: { url: WEBAPP_URL }
          }
        ],
        [
          {
            text: '🔄 Refresh',
            callback_data: 'available_jobs'
          }
        ]
      ]
    };

    bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error fetching available deliveries:', error);
    bot.sendMessage(chatId, '❌ Failed to fetch available deliveries. Please try again later.');
  }
});

// Active deliveries command
bot.onText(/\/active/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name;

  try {
    const token = await authenticateUser(telegramId, firstName, lastName);
    if (!token) {
      bot.sendMessage(chatId, '❌ Authentication failed.');
      return;
    }

    const result = await apiCall('/deliveries/my-deliveries?status=accepted,picked_up,in_transit', token);
    
    if (!result || !result.data || result.data.deliveries.length === 0) {
      bot.sendMessage(
        chatId,
        '🚗 *No Active Deliveries*\n\nYou don\'t have any active deliveries at the moment.',
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '📦 View Available',
                  callback_data: 'available_jobs'
                }
              ]
            ]
          }
        }
      );
      return;
    }

    let message = '🚗 *Your Active Deliveries*\n\n';
    
    result.data.deliveries.forEach((delivery, index) => {
      const order = delivery.order;
      const statusEmoji = {
        accepted: '✅',
        picked_up: '📦',
        in_transit: '🚗'
      }[delivery.status] || '📦';

      message += `${index + 1}. ${statusEmoji} *Order #${order.order_number}*\n`;
      message += `   Status: ${delivery.status.replace('_', ' ')}\n`;
      message += `   Amount: ${formatCurrency(order.total_amount)}\n`;
      message += `   Address: ${order.deliveryAddress?.street_address?.substring(0, 40)}...\n\n`;
    });

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🚗 Manage Deliveries',
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
    console.error('Error fetching active deliveries:', error);
    bot.sendMessage(chatId, '❌ Failed to fetch active deliveries. Please try again later.');
  }
});

// Stats command
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name;

  try {
    const token = await authenticateUser(telegramId, firstName, lastName);
    if (!token) {
      bot.sendMessage(chatId, '❌ Authentication failed.');
      return;
    }

    const result = await apiCall('/deliveries/my-deliveries?status=delivered', token);
    
    if (!result || !result.data) {
      bot.sendMessage(chatId, '❌ Failed to fetch statistics.');
      return;
    }

    const deliveries = result.data.deliveries || [];
    const totalDeliveries = deliveries.length;
    const totalEarnings = deliveries.reduce((sum, d) => sum + parseFloat(d.order?.total_amount || 0), 0);
    const avgPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

    const statsMessage = `
📊 *Your Statistics*

✅ *Total Deliveries:* ${totalDeliveries}
💰 *Total Earnings:* ${formatCurrency(totalEarnings)}
📈 *Average per Delivery:* ${formatCurrency(avgPerDelivery)}

Keep up the great work! 🎉
    `;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '📊 View Full History',
            web_app: { url: `${WEBAPP_URL}/history` }
          }
        ],
        [
          {
            text: '📦 Available Jobs',
            callback_data: 'available_jobs'
          }
        ]
      ]
    };

    bot.sendMessage(chatId, statsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    bot.sendMessage(chatId, '❌ Failed to fetch statistics. Please try again later.');
  }
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
❓ *Help & Commands*

*Available Commands:*
/start - Start the bot and see main menu
/available - View available delivery jobs
/active - View your active deliveries
/stats - View your delivery statistics
/help - Show this help message

*How Delivery Works:*
1. Check available deliveries
2. Accept a delivery from the app
3. Navigate to restaurant
4. Mark as "Picked Up"
5. Navigate to customer
6. Mark as "Delivered"
7. Earnings are tracked automatically

*Important Notes:*
- Always confirm pickup before leaving restaurant
- Keep customer informed of any delays
- Handle food with care
- Be polite and professional

*Need Help?*
Contact support: @support_username
Phone: ${process.env.RESTAURANT_PHONE || '+998901234567'}

*Payment:*
Earnings are calculated automatically and paid weekly.
  `;

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '🚗 Open Dashboard',
          web_app: { url: WEBAPP_URL }
        }
      ],
      [
        { text: '📦 Available Jobs', callback_data: 'available_jobs' },
        { text: '📊 My Stats', callback_data: 'my_stats' }
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
    case 'available_jobs':
      bot.sendMessage(chatId, '📦 Fetching available deliveries...');
      bot.emit('message', {
        chat: { id: chatId },
        from: { id: telegramId, first_name: firstName, last_name: lastName },
        text: '/available'
      });
      break;

    case 'my_stats':
      bot.sendMessage(chatId, '📊 Fetching your statistics...');
      bot.emit('message', {
        chat: { id: chatId },
        from: { id: telegramId, first_name: firstName, last_name: lastName },
        text: '/stats'
      });
      break;

    case 'help':
      bot.emit('message', {
        chat: { id: chatId },
        text: '/help'
      });
      break;

    default:
      if (data.startsWith('accept_delivery_')) {
        const deliveryId = data.replace('accept_delivery_', '');
        const keyboard = {
          inline_keyboard: [
            [
              {
                text: '✅ Accept Delivery',
                web_app: { url: `${WEBAPP_URL}/delivery/${deliveryId}` }
              }
            ]
          ]
        };

        bot.sendMessage(
          chatId,
          `📦 Delivery Details\n\nTap the button below to accept and view full details.`,
          { reply_markup: keyboard }
        );
      }
      break;
  }
});

// Handle location sharing
bot.on('location', async (msg) => {
  const chatId = msg.chat.id;
  const telegramId = msg.from.id;
  const firstName = msg.from.first_name;
  const lastName = msg.from.last_name;
  const location = msg.location;

  try {
    const token = await authenticateUser(telegramId, firstName, lastName);
    if (!token) {
      bot.sendMessage(chatId, '❌ Authentication failed.');
      return;
    }

    // Get active delivery
    const result = await apiCall('/deliveries/my-deliveries?status=picked_up,in_transit', token);
    
    if (!result || !result.data || result.data.deliveries.length === 0) {
      bot.sendMessage(chatId, 'ℹ️ You don\'t have any active deliveries to update location for.');
      return;
    }

    // Update location for the first active delivery
    const delivery = result.data.deliveries[0];
    const updateResult = await apiCall(
      `/deliveries/${delivery.id}/location`,
      token,
      'PATCH',
      {
        latitude: location.latitude,
        longitude: location.longitude
      }
    );

    if (updateResult) {
      bot.sendMessage(
        chatId,
        '✅ Location updated successfully!\n\nCustomer can now track your location.',
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚗 View Delivery',
                  web_app: { url: `${WEBAPP_URL}/delivery/${delivery.id}` }
                }
              ]
            ]
          }
        }
      );
    } else {
      bot.sendMessage(chatId, '❌ Failed to update location. Please try again.');
    }
  } catch (error) {
    console.error('Error updating location:', error);
    bot.sendMessage(chatId, '❌ Failed to update location. Please try again.');
  }
});

// Handle any text message
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands and special message types
  if (text && text.startsWith('/')) {
    return;
  }

  if (msg.location) {
    return;
  }

  if (msg.web_app_data) {
    return;
  }

  // Default response for non-command messages
  if (text) {
    const keyboard = {
      inline_keyboard: [
        [
          {
            text: '🚗 Open Dashboard',
            web_app: { url: WEBAPP_URL }
          }
        ],
        [
          { text: '📦 Available Jobs', callback_data: 'available_jobs' },
          { text: '📊 My Stats', callback_data: 'my_stats' }
        ],
        [
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
  if (data.type === 'delivery_accepted') {
    bot.sendMessage(
      chatId,
      `✅ *Delivery Accepted!*\n\nOrder #${data.orderNumber}\nAmount: ${formatCurrency(data.amount)}\n\nNavigate to the restaurant to pick up the order.`,
      { parse_mode: 'Markdown' }
    );
  } else if (data.type === 'delivery_picked_up') {
    bot.sendMessage(
      chatId,
      `📦 *Order Picked Up!*\n\nOrder #${data.orderNumber}\n\nNavigate to customer location for delivery.`,
      { parse_mode: 'Markdown' }
    );
  } else if (data.type === 'delivery_completed') {
    bot.sendMessage(
      chatId,
      `🎉 *Delivery Completed!*\n\nOrder #${data.orderNumber}\nEarnings: ${formatCurrency(data.amount)}\n\nGreat job! Check /stats to see your updated statistics.`,
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
  console.log('Stopping delivery bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Stopping delivery bot...');
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

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}