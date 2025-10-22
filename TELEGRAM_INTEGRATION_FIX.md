# Telegram Mini-App Integration Fix Summary

## Root Cause
1. **Missing Environment Files**: Both frontend and backend `.env` files didn't exist
2. **Backend Not Running**: The ngrok endpoint `backend.ngrok-free.app` was offline
3. **Case-sensitivity Bug**: `errorHandler.js` was imported as `errorhandler`
4. **Supabase Configuration**: Supabase client was being instantiated even when not configured
5. **Database Connection**: Backend requires a database connection to start

## Files Changed

### 1. Frontend Environment (`telegram_apps/customer_app/.env`)
```env
VITE_API_BASE_URL=https://backend.ngrok-free.app/api
VITE_BASE_PATH=/customer
VITE_APP_NAME=Food Customer App
```

### 2. Backend Environment (`backend/.env`)
Key changes:
```env
API_BASE_URL=https://backend.ngrok-free.app
ALLOWED_ORIGINS=https://frontend.loclx.io,https://backend.ngrok-free.app,https://brh9vuov5x.loclx.io
TELEGRAM_WEBAPP_URL=https://frontend.loclx.io/customer
SUPABASE_URL=https://dummy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dummy_key_for_local_development_only
```

### 3. Backend Code Fixes

#### `backend/src/app.js` (line 10)
```javascript
// Fixed case-sensitivity issue
const { errorHandler, notFound } = require('./middleware/errorHandler');
```

#### `backend/src/config/supabase.js`
```javascript
// Made Supabase optional
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('Supabase config missing - upload features will use local storage');
}

module.exports = supabase;
```

## Setup Instructions

### Prerequisites
1. Database connection (choose one):
   - **Option A**: Supabase - Set `SUPABASE_DATABASE_URL` in `backend/.env`
   - **Option B**: Local PostgreSQL - Run `docker-compose up postgres` or install PostgreSQL locally

2. Install ngrok: https://ngrok.com/download

### Step 1: Start Backend Locally
```bash
cd /workspace/backend
npm install  # Already done
npm start
```

### Step 2: Start ngrok Tunnels

**Terminal 1 - Backend tunnel:**
```bash
ngrok http 5000
# Note the URL (e.g., https://abc123.ngrok-free.app)
```

**Terminal 2 - Frontend tunnel:**
```bash
# Build frontend first
cd /workspace/telegram_apps/customer_app
npm install
npm run build

# Serve it (or use ngrok with dev server)
npx serve dist -p 5173

# In another terminal:
ngrok http 5173
# Note the URL (e.g., https://xyz789.loclx.io)
```

### Step 3: Update Environment Files

Update `backend/.env` and `telegram_apps/customer_app/.env` with your actual ngrok URLs.

### Step 4: Set Webhooks

**Using the helper script:**
```bash
/workspace/setup-telegram-integration.sh
```

**Or manually:**
```bash
# Set customer bot webhook
curl -X POST https://backend.ngrok-free.app/api/webhooks/set/customer \
  -H "Content-Type: application/json" \
  -d '{"url": "https://backend.ngrok-free.app/api/webhooks/telegram/customer"}'

# Set delivery bot webhook
curl -X POST https://backend.ngrok-free.app/api/webhooks/set/delivery \
  -H "Content-Type: application/json" \
  -d '{"url": "https://backend.ngrok-free.app/api/webhooks/telegram/delivery"}'
```

### Step 5: Verify Webhooks

```bash
# Check customer bot webhook
curl https://backend.ngrok-free.app/api/webhooks/info/customer

# Check delivery bot webhook
curl https://backend.ngrok-free.app/api/webhooks/info/delivery
```

## Runtime Tests

### Test 1: CORS Preflight
```bash
curl -X OPTIONS https://backend.ngrok-free.app/api/auth/telegram \
  -H "Origin: https://brh9vuov5x.loclx.io" \
  -H "Access-Control-Request-Method: POST" \
  -i
```

**Expected:** Should return `200 OK` with CORS headers:
```
Access-Control-Allow-Origin: https://brh9vuov5x.loclx.io
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
```

### Test 2: Auth Endpoint
```bash
curl -X POST https://backend.ngrok-free.app/api/auth/telegram \
  -H "Origin: https://brh9vuov5x.loclx.io" \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_id": "123456789",
    "first_name": "Test",
    "last_name": "User",
    "username": "testuser"
  }'
```

**Expected:** Should return user data with tokens or appropriate error (not CORS error).

### Test 3: Webhook Config
```bash
curl https://backend.ngrok-free.app/api/webhooks/config
```

**Expected:**
```json
{
  "telegram_webapp_url": "https://frontend.loclx.io/customer",
  "allowed_origins": "https://frontend.loclx.io,https://backend.ngrok-free.app,https://brh9vuov5x.loclx.io"
}
```

### Test 4: Health Check
```bash
curl https://backend.ngrok-free.app/health
```

**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T...",
  "uptime": 123.456
}
```

## Mobile WebView Debugging

### Debug Page
Navigate to: `https://frontend.loclx.io/customer/debug`

This page will show:
- Current location URL
- Referrer
- User agent
- Telegram user data
- Backend config fetch result

### Expected Debug Output (Success)
```json
{
  "location": "https://frontend.loclx.io/customer/debug",
  "referrer": "...",
  "ua": "Mozilla/5.0 ...",
  "tgUser": {
    "id": 123456789,
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe"
  },
  "backendConfig": {
    "telegram_webapp_url": "https://frontend.loclx.io/customer",
    "allowed_origins": "https://frontend.loclx.io,..."
  }
}
```

### If "TypeError: Failed to fetch"
This means:
1. Backend is not accessible from mobile (ngrok tunnel down)
2. CORS is blocking the request (check ALLOWED_ORIGINS)
3. Network issue (try from desktop browser first)

## Quick Diagnostic Commands

```bash
# Check if backend is running locally
curl http://localhost:5000/health

# Check if ngrok tunnel is active
curl https://backend.ngrok-free.app/health

# Check backend logs
tail -f /tmp/backend.log

# Rebuild and serve frontend
cd /workspace/telegram_apps/customer_app
npm run build
npx serve dist -p 5173

# Test from desktop browser
open https://frontend.loclx.io/customer/debug
```

## Common Issues

### Issue 1: "ERR_NGROK_3200"
**Cause**: ngrok tunnel is not running or expired
**Fix**: Restart ngrok tunnel and update URLs in .env files

### Issue 2: "CORS policy error"
**Cause**: Origin not in ALLOWED_ORIGINS
**Fix**: Add the origin to `backend/.env` ALLOWED_ORIGINS and restart backend

### Issue 3: "Failed to fetch"
**Cause**: Backend not accessible or wrong URL
**Fix**: Verify backend URL in `VITE_API_BASE_URL` matches ngrok URL

### Issue 4: "Database connection refused"
**Cause**: No database running
**Fix**: Set up Supabase DB URL or start PostgreSQL

## Build and Deploy Frontend to Backend

To serve the customer app from the backend (optional):
```bash
# Build frontend
cd /workspace/telegram_apps/customer_app
npm run build

# Copy to backend static folder (backend already configured to serve from /customer)
# No need to copy - backend src/app.js already serves from telegram_apps/customer_app/dist

# Just restart backend after building
pkill -f "node src/app.js"
cd /workspace/backend
node src/app.js > /tmp/backend.log 2>&1 &
```

## Final Checklist

- [ ] Backend `.env` created with correct URLs
- [ ] Frontend `.env` created with correct URLs  
- [ ] Database connection configured
- [ ] Backend running on localhost:5000
- [ ] ngrok tunnel for backend active
- [ ] ngrok tunnel for frontend active (or frontend built and served)
- [ ] Webhooks set for both bots
- [ ] Webhook info verified
- [ ] CORS test passes
- [ ] Auth endpoint responds (not CORS error)
- [ ] Debug page loads in Telegram WebView
- [ ] Backend config fetch succeeds in mobile

## Summary

**Root cause**: The ngrok backend endpoint was offline because:
1. Environment files didn't exist
2. Backend wasn't running (dependencies not installed, database not connected)
3. Code had bugs preventing startup (case-sensitivity, Supabase config)

**Fix**: 
1. Created environment files with correct ngrok URLs and CORS origins
2. Fixed code bugs (errorHandler case, Supabase optional)
3. Provided setup script and instructions to start backend with database
4. Verified webhook endpoints exist and are properly configured in code

**To complete**: User must start backend with database connection and ngrok tunnels, then run setup script or manual commands to set webhooks.
