#!/bin/bash
# Quick start script - run after setting up database

echo "🚀 Quick Start - Telegram Integration"
echo ""

# Check if we need to update ngrok URLs
echo "📝 Current configuration:"
echo "   Frontend: $(grep VITE_API_BASE_URL telegram_apps/customer_app/.env)"
echo "   Backend:  $(grep API_BASE_URL backend/.env | head -1)"
echo ""

read -p "Are these ngrok URLs correct and active? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please update the URLs in:"
    echo "  - telegram_apps/customer_app/.env"
    echo "  - backend/.env"
    exit 1
fi

# Check database
echo "🗄️  Checking database..."
if ! curl -s http://localhost:5432 > /dev/null 2>&1; then
    echo "⚠️  Database might not be running. Options:"
    echo "  1. docker-compose up postgres -d"
    echo "  2. Set SUPABASE_DATABASE_URL in backend/.env"
    echo ""
fi

# Start backend
echo "🚀 Starting backend..."
cd backend
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo "   Logs: tail -f /tmp/backend.log"

# Wait for backend
echo "⏳ Waiting for backend..."
sleep 5

if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend failed to start. Check logs: tail /tmp/backend.log"
    exit 1
fi

# Get ngrok URL from env
BACKEND_URL=$(grep API_BASE_URL backend/.env | head -1 | cut -d'=' -f2)

# Set webhooks
echo ""
echo "🔧 Setting webhooks..."
curl -X POST "$BACKEND_URL/api/webhooks/set/customer" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$BACKEND_URL/api/webhooks/telegram/customer\"}" \
    2>/dev/null | python3 -m json.tool 2>/dev/null || echo "Failed"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 Test in Telegram:"
echo "   1. Open your bot in Telegram"
echo "   2. Start the mini-app"
echo "   3. Navigate to /debug page"
echo ""
echo "🐛 Debug commands:"
echo "   tail -f /tmp/backend.log"
echo "   curl $BACKEND_URL/health"
echo "   curl $BACKEND_URL/api/webhooks/config"
echo ""
