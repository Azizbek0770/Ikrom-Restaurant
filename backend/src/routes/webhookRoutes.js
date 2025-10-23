const express = require('express');
const { stripe } = require('../services/paymentService');
const { handleWebhook } = require('../services/paymentService');
const { logger } = require('../config/database');

const router = express.Router();
const axios = require('axios');

// Stripe webhook (raw body needed)
router.post('/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      await handleWebhook(event);

      res.json({ received: true });
    } catch (err) {
      logger.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Telegram webhook for customer bot
router.post('/telegram/customer',
  express.json(),
  async (req, res) => {
    try {
      const { customerBot } = require('../services/notificationService');
      await customerBot.processUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      logger.error(`Telegram webhook error: ${error.message}`);
      res.sendStatus(500);
    }
  }
);

// Telegram webhook for delivery bot
router.post('/telegram/delivery',
  express.json(),
  async (req, res) => {
    try {
      const { deliveryBot } = require('../services/notificationService');
      await deliveryBot.processUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      logger.error(`Telegram webhook error: ${error.message}`);
      res.sendStatus(500);
    }
  }
);

module.exports = router;

// Dev-only: Echo webhook route to inspect incoming Telegram updates (POST raw JSON)
// Use only for local debugging; remove or protect in production.
router.post('/telegram/debug', express.json(), async (req, res) => {
  try {
    console.log('DEBUG TELEGRAM UPDATE:', JSON.stringify(req.body));
    res.json({ received: true, body: req.body });
  } catch (err) {
    console.error('Debug webhook error:', err);
    res.status(500).send('Error');
  }
});

// Dev-only: expose current webapp config (TELEGRAM_WEBAPP_URL and ALLOWED_ORIGINS)
router.get('/config', (req, res) => {
  // Prefer explicit env value. If missing, try to derive from request origin so
  // the frontend served via ngrok/loclx can discover correct webapp URL.
  const envWebapp = process.env.TELEGRAM_WEBAPP_URL || null;
  const envAllowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) : [];

  // Derive request origin from headers (prefer Origin, fallback to Referer)
  const reqOrigin = (req.get('origin') || req.get('referer') || '').split('?')[0].replace(/\/customer.*$/i, '').replace(/\/$/, '');

  const derivedWebapp = reqOrigin ? `${reqOrigin}/customer` : null;

  // Build allowed origins: env list plus the request origin (if present)
  const allowedSet = new Set(envAllowed);
  if (reqOrigin) allowedSet.add(reqOrigin);

  res.json({
    telegram_webapp_url: envWebapp || derivedWebapp || null,
    allowed_origins: Array.from(allowedSet).join(',') || null
  });
});

// Admin: set Telegram webhook for a bot (customer|delivery)
router.post('/set/:bot', express.json(), async (req, res) => {
  try {
    const bot = req.params.bot;
    const url = req.body.url || (process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api/webhooks/telegram/${bot}` : null);

    if (!url) return res.status(400).json({ success: false, message: 'No webhook URL provided and API_BASE_URL not configured' });

    let token;
    if (bot === 'customer') token = process.env.TELEGRAM_BOT_TOKEN_CUSTOMER;
    else if (bot === 'delivery') token = process.env.TELEGRAM_BOT_TOKEN_DELIVERY;
    else return res.status(400).json({ success: false, message: 'Invalid bot, use customer or delivery' });

    if (!token) return res.status(400).json({ success: false, message: 'Bot token not configured in env' });

    const resp = await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, `url=${encodeURIComponent(url)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    return res.json({ success: true, data: resp.data });
  } catch (error) {
    console.error('Set webhook error:', error?.response?.data || error.message || error);
    return res.status(500).json({ success: false, error: error?.response?.data || error.message });
  }
});

// Admin: get webhook info for a bot
router.get('/info/:bot', async (req, res) => {
  try {
    const bot = req.params.bot;
    let token;
    if (bot === 'customer') token = process.env.TELEGRAM_BOT_TOKEN_CUSTOMER;
    else if (bot === 'delivery') token = process.env.TELEGRAM_BOT_TOKEN_DELIVERY;
    else return res.status(400).json({ success: false, message: 'Invalid bot, use customer or delivery' });

    if (!token) return res.status(400).json({ success: false, message: 'Bot token not configured in env' });

    const resp = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`, { timeout: 10000 });
    return res.json({ success: true, data: resp.data });
  } catch (error) {
    console.error('Get webhook info error:', error?.response?.data || error.message || error);
    return res.status(500).json({ success: false, error: error?.response?.data || error.message });
  }
});
