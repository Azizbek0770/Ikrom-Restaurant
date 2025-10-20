# 🍽️ Single-Restaurant Food Ordering & Delivery Platform

A complete, production-ready food ordering and delivery system with Telegram Mini Apps integration.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### Customer Features
- 🍔 Browse menu by categories
- 🛒 Shopping cart with quantity management
- 📍 Multiple delivery addresses
- 💳 Multiple payment methods (Card, Cash, Payme, Click)
- 📦 Real-time order tracking
- 🔔 Push notifications via Telegram
- 👤 User profile management

### Delivery Partner Features
- 📦 View available delivery jobs
- ✅ Accept/decline deliveries
- 🗺️ Navigation to pickup/delivery locations
- 📞 Contact customers
- 📍 Real-time location tracking
- 💰 Earnings tracking
- 📊 Performance statistics

### Admin Features
- 📊 Real-time dashboard with analytics
- 🍔 Menu & category management
- 📦 Order management
- 🚗 Delivery monitoring
- 👥 User management
- 💳 Payment tracking
- 🤖 Bot management

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 15
- **ORM:** Sequelize
- **Authentication:** JWT
- **Real-time:** Socket.IO
- **Payment:** Stripe
- **Telegram:** node-telegram-bot-api

### Frontend
- **Admin Dashboard:** React 18 + Vite
- **Mini Apps:** React 18 + Telegram SDK
- **State Management:** Zustand + TanStack Query
- **Styling:** Tailwind CSS
- **Charts:** Recharts

### DevOps
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **Process Management:** PM2 (optional)

## 📁 Project Structure
```
food-delivery-platform/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── models/            # Database models
│   │   ├── controllers/       # Request handlers
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Custom middleware
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utility functions
│   ├── tests/                 # Test files
│   └── Dockerfile
├── admin_dashboard/            # React admin panel
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── store/             # State management
│   └── Dockerfile
├── telegram_apps/
│   ├── customer_app/          # Customer Mini App
│   ├── delivery_app/          # Delivery Partner Mini App
│   ├── customer_bot/          # Customer Bot
│   └── delivery_bot/          # Delivery Bot
├── docker-compose.yml
├── Makefile
└── README.md
```

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Telegram Account** for creating bots
- **Stripe Account** for payments (optional)

## 🚀 Installation

### Option 1: Docker (Recommended)

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/food-delivery-platform.git
cd food-delivery-platform
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Build and start services:**
```bash
make build
make start
```

4. **Run migrations and seed data:**
```bash
make migrate
make seed
```

### Option 2: Manual Installation

1. **Clone and configure:**
```bash
git clone https://github.com/yourusername/food-delivery-platform.git
cd food-delivery-platform
cp .env.example .env
```

2. **Install dependencies:**
```bash
make install
```

3. **Setup PostgreSQL database:**
```bash
createdb food_delivery_db
```

4. **Run migrations and seed:**
```bash
cd backend
npm run migrate
npm run seed
```

5. **Start services:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Admin Dashboard
cd admin_dashboard
npm run dev

# Terminal 3 - Customer Bot
cd telegram_apps/customer_bot
npm start

# Terminal 4 - Delivery Bot
cd telegram_apps/delivery_bot
npm start
```

## ⚙️ Configuration

### 1. Create Telegram Bots

Create two bots via [@BotFather](https://t.me/botfather):

**Customer Bot:**
```
/newbot
Bot name: Your Restaurant Bot
Username: your_restaurant_bot
```

**Delivery Bot:**
```
/newbot
Bot name: Your Restaurant Delivery Bot
Username: your_restaurant_delivery_bot
```

Save the bot tokens.

### 2. Setup Telegram Mini Apps

1. **Register Mini Apps with @BotFather:**
```
/newapp
Select your bot
App title: Menu & Orders (for customer)
Description: Browse menu and place orders
Photo: Upload app icon
Web App URL: https://yourdomain.com/customer
```

Repeat for delivery app.

2. **Update bot menu buttons:**
```
/setmenubutton
Select bot
Button text: 🍽️ Open Menu
Web App URL: https://yourdomain.com/customer
```

### 3. Configure Stripe (Optional)

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard
3. Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Environment Variables

Edit `.env` with your configuration:
```env
# Database
DB_NAME=food_delivery_db
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT Secrets (generate strong random strings)
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Telegram
TELEGRAM_BOT_TOKEN_CUSTOMER=123456:ABC-DEF...
TELEGRAM_BOT_TOKEN_DELIVERY=789012:GHI-JKL...
CUSTOMER_WEBAPP_URL=https://yourdomain.com/customer
DELIVERY_WEBAPP_URL=https://yourdomain.com/delivery

# Restaurant
RESTAURANT_NAME=Your Restaurant Name
RESTAURANT_PHONE=+998901234567
RESTAURANT_ADDRESS=Your Address
```

## 💻 Development

### Start Development Servers
```bash
# Start all services
make dev

# Or individually:
make dev-backend      # Backend on :5000
make dev-admin        # Admin on :3000
make dev-customer-app # Customer app on :3001
make dev-delivery-app # Delivery app on :3002
```

### View Logs
```bash
# All services
make logs

# Specific service
make logs-backend
make logs-admin
make logs-bots
```

### Run Tests
```bash
# All tests
make test

# Backend only
cd backend && npm test

# With coverage
cd backend && npm test -- --coverage
```

## 🚢 Deployment

### Production Deployment with Docker

1. **Setup production environment:**
```bash
cp .env.example .env.production
# Configure production values
```

2. **Build images:**
```bash
docker-compose -f docker-compose.yml build
```

3. **Start services:**
```bash
docker-compose -f docker-compose.yml up -d
```

4. **Run migrations:**
```bash
docker-compose exec backend npm run migrate
docker-compose exec backend npm run seed
```

### Deploy to VPS (Ubuntu 22.04)

1. **Install prerequisites:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **Clone and configure:**
```bash
git clone https://github.com/yourusername/food-delivery-platform.git
cd food-delivery-platform
cp .env.example .env
nano .env  # Configure production values
```

3. **Setup SSL (with Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

4. **Start services:**
```bash
docker-compose up -d
```

5. **Setup automatic backups:**
```bash
# Add to crontab
crontab -e

# Add this line (daily backup at 2 AM)
0 2 * * * cd /path/to/food-delivery-platform && make backup-db
```

### Deploy Mini Apps

1. **Build mini apps:**
```bash
cd telegram_apps/customer_app
npm run build

cd ../delivery_app
npm run build
```

2. **Upload to hosting:**
- Deploy `dist` folders to your web server
- Configure HTTPS (required for Telegram Mini Apps)
- Update bot menu buttons with production URLs

3. **Configure Telegram webhooks (optional):**
```bash
# Set webhook for customer bot
curl -F "url=https://yourdomain.com/api/webhooks/telegram/customer" \
  https://api.telegram.org/bot<TOKEN>/setWebhook

# Set webhook for delivery bot
curl -F "url=https://yourdomain.com/api/webhooks/telegram/delivery" \
  https://api.telegram.org/bot<TOKEN>/setWebhook
```

## 📚 API Documentation

### Authentication

**Register:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Orders

**Create Order:**
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "menu_item_id": "uuid",
      "quantity": 2,
      "special_instructions": "No onions"
    }
  ],
  "address_id": "uuid",
  "payment_method": "card",
  "delivery_notes": "Ring the bell"
}
```

**Get My Orders:**
```http
GET /api/orders/my-orders?status=pending&limit=20
Authorization: Bearer {token}
```

For complete API documentation, see [API.md](./docs/API.md)

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js

# Watch mode
npm run test:watch
```

### Test Structure
```javascript
// Example test
describe('Authentication', () => {
  it('should register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Test@123456',
        first_name: 'Test'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
```

## 🔧 Troubleshooting

### Common Issues

**1. Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection details in .env
DB_HOST=localhost
DB_PORT=5432
```

**2. Port Already in Use**
```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

**3. Telegram Bot Not Responding**
```bash
# Check bot token is correct
# Verify webhook is not set (for polling mode)
curl https://api.telegram.org/bot<TOKEN>/deleteWebhook

# Check bot logs
make logs-bots
```

**4. Mini App Not Loading**
```bash
# Verify HTTPS is configured (required by Telegram)
# Check CORS settings in backend
# Verify Web App URL in bot settings
```

**5. Docker Build Fails**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

### Debug Mode

Enable debug logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Get Help

- 📧 Email: support@yourrestaurant.com
- 💬 Telegram: @your_support
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/food-delivery-platform/issues)

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 👏 Acknowledgments

- Telegram for Mini Apps platform
- Stripe for payment processing
- All open-source contributors

---

Made with ❤️ for the food delivery industry