#!/bin/bash

# Telegram Mini-App Integration Setup Script
# This script helps set up ngrok tunnels and configure webhooks

set -e

echo "🚀 Telegram Mini-App Integration Setup"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
if ! curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running on localhost:5000${NC}"
    echo "Please start the backend first with: cd backend && npm start"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}⚠️  ngrok not found. Please install it from https://ngrok.com/download${NC}"
    exit 1
fi

echo -e "${GREEN}✅ ngrok is installed${NC}"

# Get current ngrok URL or start new tunnel
echo ""
echo "📡 Starting ngrok tunnels..."
echo "Run these commands in separate terminals:"
echo ""
echo "  Terminal 1 (Backend tunnel):"
echo "  $ ngrok http 5000 --domain=backend.ngrok-free.app"
echo ""
echo "  Terminal 2 (Frontend tunnel):"
echo "  $ ngrok http 5173 --domain=frontend.loclx.io"
echo ""

read -p "Press Enter after you've started both ngrok tunnels..."

# Test backend accessibility
echo ""
echo "🔍 Testing backend accessibility..."
BACKEND_URL="https://backend.ngrok-free.app"

if curl -sf "$BACKEND_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is accessible at $BACKEND_URL${NC}"
else
    echo -e "${RED}❌ Backend is NOT accessible at $BACKEND_URL${NC}"
    echo "Please check your ngrok tunnel configuration"
    exit 1
fi

# Get bot tokens from env
source /workspace/backend/.env

if [ -z "$TELEGRAM_BOT_TOKEN_CUSTOMER" ] || [ "$TELEGRAM_BOT_TOKEN_CUSTOMER" == "your_customer_bot_token" ]; then
    echo -e "${RED}❌ TELEGRAM_BOT_TOKEN_CUSTOMER not set in backend/.env${NC}"
    exit 1
fi

if [ -z "$TELEGRAM_BOT_TOKEN_DELIVERY" ] || [ "$TELEGRAM_BOT_TOKEN_DELIVERY" == "your_delivery_bot_token" ]; then
    echo -e "${YELLOW}⚠️  TELEGRAM_BOT_TOKEN_DELIVERY not set in backend/.env${NC}"
fi

echo ""
echo "🔧 Setting up webhooks..."

# Set customer bot webhook
echo ""
echo "Setting webhook for customer bot..."
CUSTOMER_WEBHOOK_URL="$BACKEND_URL/api/webhooks/telegram/customer"
curl -X POST "$BACKEND_URL/api/webhooks/set/customer" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$CUSTOMER_WEBHOOK_URL\"}"

echo ""
echo ""

# Set delivery bot webhook if token exists
if [ ! -z "$TELEGRAM_BOT_TOKEN_DELIVERY" ] && [ "$TELEGRAM_BOT_TOKEN_DELIVERY" != "your_delivery_bot_token" ]; then
    echo "Setting webhook for delivery bot..."
    DELIVERY_WEBHOOK_URL="$BACKEND_URL/api/webhooks/telegram/delivery"
    curl -X POST "$BACKEND_URL/api/webhooks/set/delivery" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"$DELIVERY_WEBHOOK_URL\"}"
    echo ""
fi

echo ""
echo "✅ Webhook setup complete!"

echo ""
echo "🔍 Verifying webhooks..."

# Verify customer webhook
echo ""
echo "Customer bot webhook info:"
curl -s "$BACKEND_URL/api/webhooks/info/customer" | python3 -m json.tool || cat

# Verify delivery webhook if token exists
if [ ! -z "$TELEGRAM_BOT_TOKEN_DELIVERY" ] && [ "$TELEGRAM_BOT_TOKEN_DELIVERY" != "your_delivery_bot_token" ]; then
    echo ""
    echo "Delivery bot webhook info:"
    curl -s "$BACKEND_URL/api/webhooks/info/delivery" | python3 -m json.tool || cat
fi

echo ""
echo ""
echo "🧪 Testing CORS and Auth endpoints..."

# Test CORS preflight
echo ""
echo "Testing OPTIONS /api/auth/telegram with Origin: https://brh9vuov5x.loclx.io"
curl -X OPTIONS "$BACKEND_URL/api/auth/telegram" \
    -H "Origin: https://brh9vuov5x.loclx.io" \
    -H "Access-Control-Request-Method: POST" \
    -v 2>&1 | grep -E "< HTTP|< access-control"

echo ""
echo ""
echo "Testing GET /api/webhooks/config"
curl -s "$BACKEND_URL/api/webhooks/config" | python3 -m json.tool || cat

echo ""
echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 Next steps:"
echo "1. Open Telegram and navigate to your customer bot"
echo "2. Start the bot and open the mini-app"
echo "3. The mini-app should load at: https://frontend.loclx.io/customer"
echo "4. Check the Debug page at: https://frontend.loclx.io/customer/debug"
echo ""
echo "🐛 Debugging:"
echo "- Backend logs: tail -f /tmp/backend.log"
echo "- Test auth: curl -X POST $BACKEND_URL/api/auth/telegram -H 'Content-Type: application/json' -d '{\"telegram_id\":\"test\",\"first_name\":\"Test\"}'"
echo ""
