const Stripe = require('stripe');
const { Order } = require('../models');
const { logger } = require('../config/database');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
const createPaymentIntent = async (order, user) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(order.total_amount) * 100), // Convert to cents
      currency: 'uzs',
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        customer_id: user.id,
        customer_name: `${user.first_name} ${user.last_name || ''}`.trim()
      },
      description: `Order #${order.order_number}`
    });

    logger.info(`Payment intent created: ${paymentIntent.id} for order ${order.id}`);

    return paymentIntent;
  } catch (error) {
    logger.error(`Payment intent creation failed: ${error.message}`);
    throw error;
  }
};

// Handle webhook events
const handleWebhook = async (event) => {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      
      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (error) {
    logger.error(`Webhook handling error: ${error.message}`);
    throw error;
  }
};

// Handle successful payment
const handlePaymentSuccess = async (paymentIntent) => {
  const { order_id } = paymentIntent.metadata;

  const order = await Order.findByPk(order_id);
  
  if (!order) {
    logger.error(`Order not found for payment intent: ${paymentIntent.id}`);
    return;
  }

  await order.update({
    payment_status: 'paid',
    status: order.status === 'pending' ? 'paid' : order.status
  });

  // Create notification
  const { createNotification } = require('./notificationService');
  await createNotification(order.customer_id, order.id, 'payment_success', {
    title: 'Payment Successful',
    message: `Payment of ${order.total_amount} UZS received for order #${order.order_number}`
  });

  logger.info(`Payment successful for order ${order_id}`);
};

// Handle failed payment
const handlePaymentFailure = async (paymentIntent) => {
  const { order_id } = paymentIntent.metadata;

  const order = await Order.findByPk(order_id);
  
  if (!order) {
    logger.error(`Order not found for payment intent: ${paymentIntent.id}`);
    return;
  }

  await order.update({
    payment_status: 'failed'
  });

  // Create notification
  const { createNotification } = require('./notificationService');
  await createNotification(order.customer_id, order.id, 'payment_failed', {
    title: 'Payment Failed',
    message: `Payment failed for order #${order.order_number}. Please try again.`
  });

  logger.info(`Payment failed for order ${order_id}`);
};

module.exports = {
  createPaymentIntent,
  handleWebhook,
  stripe
};