# Delivery Partner Telegram Bot

Telegram bot for delivery partner interactions and job management.

## Features

- View available delivery jobs
- Accept and manage deliveries
- Real-time delivery notifications
- Track earnings and statistics
- Location sharing during delivery
- Quick access to delivery dashboard

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

Add your bot token and settings.

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
- `/available` - View available delivery jobs
- `/active` - View active deliveries
- `/stats` - View delivery statistics
- `/help` - Help and support information

## Bot Flow

1. Partner starts bot → Welcome message + Dashboard button
2. Partner views available jobs → List of pending deliveries
3. Partner accepts job → Opens Mini App for details
4. Partner updates status → Notifications sent
5. Delivery completed → Earnings tracked

## Features

### Available Jobs
- Shows list of ready-to-deliver orders
- Displays distance and earnings
- Quick accept via Mini App

### Active Deliveries
- Current delivery status
- Customer information
- Navigation assistance

### Statistics
- Total deliveries completed
- Total earnings
- Average per delivery

### Location Sharing
- Partners can share location
- Updates customer tracking
- Works during active delivery

## Webhook Mode (Production)

For production, set up webhook:
```javascript
bot.setWebHook(`${WEBHOOK_URL}/api/webhooks/telegram/delivery`);
```

## Integration with Backend

The bot communicates with backend API for:
- Partner authentication
- Delivery job management
- Real-time status updates
- Statistics tracking