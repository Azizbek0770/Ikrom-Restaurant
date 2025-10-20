# Customer Telegram Bot

Telegram bot for customer interactions and notifications.

## Features

- Welcome message with menu access
- Quick access to orders
- Help and support information
- Real-time order notifications
- Deep linking to specific orders

## Setup

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

Add your bot token and other settings.

4. Start the bot:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Commands

- `/start` - Welcome message and main menu
- `/menu` - Browse restaurant menu
- `/orders` - View order history
- `/help` - Help and support information

## Bot Flow

1. User starts bot → Welcome message + Menu button
2. User taps "Open Menu" → Opens Mini App
3. User places order → Confirmation message
4. Order updates → Real-time notifications

## Webhook Mode (Production)

For production, set up webhook instead of polling:
```javascript
bot.setWebHook(`${WEBHOOK_URL}/api/webhooks/telegram/customer`);
```

## Integration with Backend

The bot communicates with the backend API for:
- User authentication
- Order retrieval
- Real-time notifications