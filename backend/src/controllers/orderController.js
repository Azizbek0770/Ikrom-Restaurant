const { Order, OrderItem, MenuItem, Address, User, Delivery } = require('../models');
const { logger } = require('../config/database');
const { createPaymentIntent } = require('../services/paymentService');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');

// Create order
const createOrder = async (req, res, next) => {
  const transaction = await Order.sequelize.transaction();
  
  try {
    const { items, address_id, delivery_notes, payment_method } = req.body;
    const customer_id = req.user.id;

    // Validate address
    const address = await Address.findOne({
      where: { id: address_id, user_id: customer_id }
    });

    if (!address) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Delivery address not found'
      });
    }

    // Validate menu items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menu_item_id);
      
      if (!menuItem) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: `Menu item ${item.menu_item_id} not found`
        });
      }

      if (!menuItem.is_available) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `${menuItem.name} is currently unavailable`
        });
      }

      const itemSubtotal = parseFloat(menuItem.price) * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        menu_item_id: menuItem.id,
        quantity: item.quantity,
        unit_price: menuItem.price,
        subtotal: itemSubtotal,
        special_instructions: item.special_instructions
      });
    }

    // Check minimum order amount
    const minOrderAmount = parseFloat(process.env.MIN_ORDER_AMOUNT || 15000);
    if (subtotal < minOrderAmount) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ${minOrderAmount} UZS`
      });
    }

    const delivery_fee = parseFloat(process.env.DELIVERY_FEE || 5000);
    const total_amount = subtotal + delivery_fee;

    // Calculate estimated delivery time (current time + 45 minutes)
    const estimated_delivery_time = new Date(Date.now() + 45 * 60 * 1000);

    // Create order
    const order = await Order.create({
      customer_id,
      address_id,
      subtotal,
      delivery_fee,
      total_amount,
      delivery_notes,
      payment_method: payment_method || 'card',
      estimated_delivery_time,
      status: 'pending',
      payment_status: 'pending'
    }, { transaction });

    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        order_id: order.id,
        ...item
      }, { transaction });
    }

    // Create delivery record
    await Delivery.create({
      order_id: order.id,
      dropoff_latitude: address.latitude,
      dropoff_longitude: address.longitude,
      status: 'pending'
    }, { transaction });

    // Create payment intent if paying by card
    let paymentIntent = null;
    if (payment_method === 'card') {
      paymentIntent = await createPaymentIntent(order, req.user);
      await order.update({
        payment_intent_id: paymentIntent.id
      }, { transaction });
    }

    await transaction.commit();

    // Send notification
    await createNotification(customer_id, order.id, 'order_created', {
      title: 'Order Created',
      message: `Your order #${order.order_number} has been created. Total: ${total_amount} UZS`
    });

    // Fetch complete order with relations
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        { model: Address, as: 'deliveryAddress' },
        { model: Delivery, as: 'delivery' }
      ]
    });

    logger.info(`Order created: ${order.id} by customer ${customer_id}`);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: completeOrder,
        payment: paymentIntent ? {
          client_secret: paymentIntent.client_secret,
          payment_intent_id: paymentIntent.id
        } : null
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// Get user orders
const getMyOrders = async (req, res, next) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const customer_id = req.user.id;

    const where = { customer_id };
    if (status) {
      where.status = status;
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        { model: Address, as: 'deliveryAddress' },
        { model: User, as: 'deliveryPartner', attributes: ['id', 'first_name', 'last_name', 'phone'] },
        { model: Delivery, as: 'delivery' }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        total: orders.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get single order
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const where = { id };
    
    // Non-admin users can only see their own orders
    if (userRole !== 'admin') {
      where[Op.or] = [
        { customer_id: userId },
        { delivery_partner_id: userId }
      ];
    }

    const order = await Order.findOne({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        { model: Address, as: 'deliveryAddress' },
        { model: User, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'phone', 'telegram_id'] },
        { model: User, as: 'deliveryPartner', attributes: ['id', 'first_name', 'last_name', 'phone', 'telegram_id'] },
        { model: Delivery, as: 'delivery' }
      ]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res, next) => {
  try {
    const { status, payment_status, date_from, date_to, limit = 50, offset = 0 } = req.query;

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (payment_status) {
      where.payment_status = payment_status;
    }
    
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) where.created_at[Op.lte] = new Date(date_to);
    }

    const orders = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [{ model: MenuItem, as: 'menuItem' }]
        },
        { model: Address, as: 'deliveryAddress' },
        { model: User, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'phone'] },
        { model: User, as: 'deliveryPartner', attributes: ['id', 'first_name', 'last_name', 'phone'] },
        { model: Delivery, as: 'delivery' }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        orders: orders.rows,
        total: orders.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ['paid', 'cancelled'],
      paid: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready'],
      ready: ['out_for_delivery'],
      out_for_delivery: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.status} to ${status}`
      });
    }

    // Update order with timestamp
    const updates = { status };
    const now = new Date();

    switch (status) {
      case 'confirmed':
        updates.accepted_at = now;
        // Increment sales_count for each menu item in the order
        const orderItems = await OrderItem.findAll({ where: { order_id: id } });
        for (const item of orderItems) {
          await MenuItem.increment('sales_count', {
            by: item.quantity,
            where: { id: item.menu_item_id }
          });
        }
        break;
      case 'preparing':
        updates.preparing_at = now;
        break;
      case 'ready':
        updates.ready_at = now;
        break;
      case 'out_for_delivery':
        updates.picked_up_at = now;
        // Update delivery status
        await Delivery.update(
          { status: 'in_transit', picked_up_at: now },
          { where: { order_id: id } }
        );
        break;
      case 'delivered':
        updates.delivered_at = now;
        // Update delivery status
        await Delivery.update(
          { status: 'delivered', delivered_at: now },
          { where: { order_id: id } }
        );
        break;
      case 'cancelled':
        updates.cancelled_at = now;
        break;
    }

    await order.update(updates);

    // Send notification
    const notificationMessages = {
      confirmed: 'Order confirmed and being prepared',
      preparing: 'Your order is being prepared',
      ready: 'Your order is ready for pickup',
      out_for_delivery: 'Your order is on the way',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled'
    };

    await createNotification(order.customer_id, order.id, `order_${status}`, {
      title: `Order ${status}`,
      message: notificationMessages[status] || `Order status updated to ${status}`
    });

    logger.info(`Order ${id} status updated to ${status} by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellation_reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions
    if (order.customer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this order'
      });
    }

    // Can only cancel pending or paid orders
    if (!['pending', 'paid', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    await order.update({
      status: 'cancelled',
      cancelled_at: new Date(),
      cancellation_reason: cancellation_reason || 'Cancelled by customer'
    });

    // Update delivery status
    await Delivery.update(
      { status: 'failed', failed_reason: 'Order cancelled' },
      { where: { order_id: id } }
    );

    // Send notification
    await createNotification(order.customer_id, order.id, 'order_cancelled', {
      title: 'Order Cancelled',
      message: `Order #${order.order_number} has been cancelled`
    });

    logger.info(`Order ${id} cancelled by user ${userId}`);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// Get order statistics (Admin only)
const getOrderStatistics = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;

    const where = {};
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) where.created_at[Op.lte] = new Date(date_to);
    }

    const totalOrders = await Order.count({ where });
    
    const ordersByStatus = await Order.findAll({
      where,
      attributes: [
        'status',
        [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const revenue = await Order.findOne({
      where: {
        ...where,
        payment_status: 'paid'
      },
      attributes: [
        [Order.sequelize.fn('SUM', Order.sequelize.col('total_amount')), 'total_revenue'],
        [Order.sequelize.fn('AVG', Order.sequelize.col('total_amount')), 'average_order_value']
      ]
    });

    res.json({
      success: true,
      data: {
        total_orders: totalOrders,
        orders_by_status: ordersByStatus,
        total_revenue: parseFloat(revenue.dataValues.total_revenue || 0),
        average_order_value: parseFloat(revenue.dataValues.average_order_value || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStatistics
};