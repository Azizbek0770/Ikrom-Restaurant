# Customer Mini App - Telegram Web App

Customer-facing Telegram Mini App for browsing menu and placing orders.

## Features

- 🍔 Browse menu by categories
- 🛒 Shopping cart with quantity management
- 📍 Multiple delivery addresses
- 💳 Multiple payment methods
- 📦 Order tracking
- 🔔 Real-time order updates
- 👤 User profile management

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Start development:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Telegram Bot Integration

The mini app is opened via Telegram bot command or inline button.

## Project Structure
```
customer_app/
├── src/
│   ├── pages/          # Page components
│   ├── services/       # API & Telegram services
│   ├── store/          # Zustand stores
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Root component
│   └── main.jsx        # Entry point
├── index.html
└── package.json
```