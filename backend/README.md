# Food Delivery Platform - Backend

Backend API for single-restaurant food delivery platform with Telegram integration.

## Features

- 🔐 JWT Authentication (Email & Telegram)
- 🍔 Menu Management
- 📦 Order Processing
- 🚗 Delivery Management
- 💳 Payment Integration (Stripe)
- 🔔 Real-time Notifications (Socket.IO & Telegram)
- 📊 Admin Dashboard APIs

## Tech Stack

- Node.js + Express
- PostgreSQL + Sequelize ORM
- Socket.IO for real-time updates
- Telegram Bot API
- Stripe Payment Gateway
- JWT for authentication

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- Database credentials
- JWT secrets
- Telegram bot tokens
- Stripe API keys

### 3. Setup Database
```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/telegram` - Telegram authentication
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin)
- `PUT /api/categories/:id` - Update category (Admin)
- `DELETE /api/categories/:id` - Delete category (Admin)

### Menu
- `GET /api/menu` - Get all menu items
- `GET /api/menu/:id` - Get single item
- `POST /api/menu` - Create item (Admin)
- `PUT /api/menu/:id` - Update item (Admin)
- `DELETE /api/menu/:id` - Delete item (Admin)
- `PATCH /api/menu/:id/toggle-availability` - Toggle availability (Admin)

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user by id
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user info
- `DELETE /api/users/id` - Delete user

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Get customer orders
- `GET /api/orders/:id` - Get single order
- `GET /api/orders` - Get all orders (Admin)
- `PATCH /api/orders/:id/status` - Update status (Admin)
- `PATCH /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/statistics/overview` - Get statistics (Admin)

### Deliveries
- `GET /api/deliveries/available` - Get available deliveries
- `GET /api/deliveries/my-deliveries` - Get my deliveries
- `POST /api/deliveries/:id/accept` - Accept delivery
- `PATCH /api/deliveries/:id/location` - Update location
- `PATCH /api/deliveries/:id/picked-up` - Mark as picked up
- `PATCH /api/deliveries/:id/complete` - Complete delivery
- `GET /api/deliveries/statistics` - Get statistics (Admin)

### Addresses
- `GET /api/addresses` - Get user addresses
- `GET /api/addresses/:id` - Get single address
- `POST /api/addresses` - Create address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address
- `PATCH /api/addresses/:id/set-default` - Set as default

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark as read

### Webhooks
- `POST /api/webhooks/stripe` - Stripe payment webhook
- `POST /api/webhooks/telegram/customer` - Customer bot webhook
- `POST /api/webhooks/telegram/delivery` - Delivery bot webhook

## Testing
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## Project Structure
````
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Database models
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── scripts/         # Database scripts
│   └── app.js           # Main application
├── tests/               # Test files
└── package.json