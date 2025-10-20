# Delivery Partner Mini App - Telegram Web App

Delivery partner-facing Telegram Mini App for managing deliveries.

## Features

- 📦 View available deliveries
- ✅ Accept delivery jobs
- 🗺️ Navigation to delivery address
- 📞 Contact customer
- 📍 Real-time location tracking
- ✔️ Mark orders as picked up/delivered
- 📊 Delivery history and earnings
- 👤 Profile management

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

## Project Structure
```
delivery_app/
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

## Features

### Dashboard
- Available deliveries list
- Active deliveries
- Quick stats

### Delivery Details
- Customer information with call button
- Delivery address with navigation
- Order items list
- Mark as picked up/delivered
- Real-time location updates

### History
- Completed deliveries
- Earnings statistics
- Performance metrics

## Location Tracking

The app uses browser geolocation API to track delivery partner location during active deliveries. Location is updated every 30 seconds.