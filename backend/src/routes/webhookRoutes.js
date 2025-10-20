const express = require('express');
const { stripe } = require('../services/paymentService');
const { handleWebhook } = require('../services/paymentService');
const { logger } = require('../config/database');

const router = express.Router();

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