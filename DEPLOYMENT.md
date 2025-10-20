# 🚀 Deployment Guide

Complete guide for deploying the Food Delivery Platform to production.

## Table of Contents

1. [Server Requirements](#server-requirements)
2. [Initial Setup](#initial-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [SSL Configuration](#ssl-configuration)
6. [Telegram Configuration](#telegram-configuration)
7. [Monitoring](#monitoring)
8. [Backup Strategy](#backup-strategy)
9. [Scaling](#scaling)

## Server Requirements

### Minimum Specifications
- **OS:** Ubuntu 22.04 LTS
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Storage:** 40 GB SSD
- **Network:** 100 Mbps

### Recommended Specifications
- **OS:** Ubuntu 22.04 LTS
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Storage:** 100 GB SSD
- **Network:** 1 Gbps

## Initial Setup

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 2. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 3. Install Node.js (Optional - for non-Docker deployment)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### 4. Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5. Configure Firewall
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Database Setup

### 1. Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 2. Create Database and User
```bash
sudo -u postgres psql << EOF
CREATE DATABASE food_delivery_db;
CREATE USER food_delivery_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE food_delivery_db TO food_delivery_user;
\q
EOF
```

### 3. Configure PostgreSQL for Remote Access (if needed)
```bash
sudo nano /etc/postgresql/15/main/postgresql.conf
# Change: listen_addresses = '*'

sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

## Application Deployment

### 1. Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/yourusername/food-delivery-platform.git
cd food-delivery-platform
sudo chown -R $USER:$USER /var/www/food-delivery-platform
```

### 2. Configure Environment
```bash
cp .env.example .env
nano .env
```

Production `.env` configuration:
```env
# Production Settings
NODE_ENV=production
PORT=5000

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=food_delivery_db
DB_USER=food_delivery_user
DB_PASSWORD=your_secure_password

# JWT Secrets (use strong random strings)
JWT_SECRET=your_production_jwt_secret_min_64_chars
JWT_REFRESH_SECRET=your_production_refresh_secret_min_64_chars

# API URLs
API_BASE_URL=https://api.yourdomain.com/api
SOCKET_URL=https://api.yourdomain.com

# Telegram
TELEGRAM_BOT_TOKEN_CUSTOMER=your_customer_bot_token
TELEGRAM_BOT_TOKEN_DELIVERY=your_delivery_bot_token
CUSTOMER_WEBAPP_URL=https://app.yourdomain.com/customer
DELIVERY_WEBAPP_URL=https://app.yourdomain.com/delivery

# Stripe
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Restaurant
RESTAURANT_NAME=Your Restaurant Name
RESTAURANT_PHONE=+998901234567
RESTAURANT_ADDRESS=Your Full Address
DELIVERY_FEE=5000
MIN_ORDER_AMOUNT=15000

# Admin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=VerySecurePassword123!

# Security
ALLOWED_ORIGINS=https://admin.yourdomain.com,https://app.yourdomain.com

# Logging
LOG_LEVEL=info
```

### 3. Build and Start with Docker
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Run Migrations and Seed
```bash
# Run migrations
docker-compose exec backend npm run migrate

# Seed initial data
docker-compose exec backend npm run seed
```

### 5. Verify Deployment
```bash
# Check backend health
curl http://localhost:5000/health

# Check admin dashboard
curl http://localhost:3000
```

## SSL Configuration

### 1. Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificates
```bash
# For main domain and subdomains
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com -d admin.yourdomain.com -d app.yourdomain.com
```

### 3. Configure Nginx

**File: `/etc/nginx/sites-available/food-delivery`**
```nginx
# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API proxy
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

# Admin Dashboard
server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;

    root /var/www/food-delivery-platform/admin_dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Telegram Mini Apps
server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    # Customer App
    location /customer {
        alias /var/www/food-delivery-platform/telegram_apps/customer_app/dist;
        try_files $uri $uri/ /customer/index.html;
    }

    # Delivery App
    location /delivery {
        alias /var/www/food-delivery-platform/telegram_apps/delivery_app/dist;
        try_files $uri $uri/ /delivery/index.html;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.yourdomain.com admin.yourdomain.com app.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/food-delivery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e

# Add this line
0 3 * * * certbot renew --quiet && systemctl reload nginx
```

## Telegram Configuration

### 1. Set Webhook URLs
```bash
# Customer Bot
curl -F "url=https://api.yourdomain.com/api/webhooks/telegram/customer" \
  https://api.telegram.org/bot<CUSTOMER_BOT_TOKEN>/setWebhook

# Delivery Bot
curl -F "url=https://api.yourdomain.com/api/webhooks/telegram/delivery" \
  https://api.telegram.org/bot<DELIVERY_BOT_TOKEN>/setWebhook
```

### 2. Update Bot Menu Buttons

Via @BotFather:
```
/setmenubutton
Select bot: @your_restaurant_bot
Button text: 🍽️ Open Menu
Web App URL: https://app.yourdomain.com/customer
```

### 3. Configure Bot Commands
```
/setcommands
Select bot

Customer Bot Commands:
start - Start the bot
menu - Browse menu
orders - View my orders
help - Get help

Delivery Bot Commands:
start - Start the bot
available - View available jobs
active - View active deliveries
stats - View statistics
help - Get help
```

## Monitoring

### 1. Setup PM2 (Alternative to Docker for process management)
```bash
# Install PM2
sudo npm install -g pm2

# Create ecosystem file
pm2 ecosystem

# Edit ecosystem.config.js
# Start all processes
pm2 start ecosystem.config.js

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### 2. Log Monitoring
```bash
# View logs
docker-compose logs -f

# Or with PM2
pm2 logs

# Setup log rotation
pm2 install pm2-logrotate
```

### 3. System Monitoring
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Check system resources
htop

# Check disk usage
df -h

# Check memory
free -h