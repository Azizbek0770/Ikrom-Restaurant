const { Delivery, Order, User, Address, OrderItem, MenuItem } = require('../models');
const { logger } = require('../config/database');
const { createNotification } = require('../services/notificationService');
const { Op } = require('sequelize');

// Get available deliveries (for delivery partners)
const getAvailableDeliveries = async (req, res, next) => {
  try {
    // Find deliveries that are pending and whose orders are ready
    const deliveries = await Delivery.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: Order,
          as: 'order',
          where: { status: 'ready' },
          include: [
            { model: Address, as: 'deliveryAddress' },
            { model: User, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'phone'] },
            { model: OrderItem, as: 'items', include: [{ model: MenuItem, as: 'menuItem' }] }
          ]
        }
      ],
      order: [['created_at', 'ASC']]
    });

    // In development return debug info about pending deliveries that were excluded (order not ready or missing)
    if (process.env.NODE_ENV === 'development') {
      const allPending = await Delivery.findAll({
        where: { status: 'pending' },
        include: [{ model: Order, as: 'order' }]
      });

      const excluded = allPending
        .filter(d => !d.order || d.order.status !== 'ready')
        .map(d => ({ id: d.id, order_id: d.order_id, order_status: d.order ? d.order.status : null }));

      return res.json({ success: true, data: { deliveries }, debug: { excluded } });
    }

    return res.json({ success: true, data: { deliveries } });
  } catch (error) {
    next(error);
  }
};

// Get my deliveries (for delivery partners)
const getMyDeliveries = async (req, res, next) => {
  try {
    const { status } = req.query;

    // Guard: ensure authenticated user exists
    const delivery_partner_id = req.user && req.user.id;
    if (!delivery_partner_id) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const where = { delivery_partner_id };

    // Support comma-separated status query (e.g. status=accepted,picked_up)
    if (status) {
      const statuses = String(status).split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { [Op.in]: statuses };
      }
    }

    const deliveries = await Delivery.findAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            { model: Address, as: 'deliveryAddress' },
            { model: User, as: 'customer', attributes: ['id', 'first_name', 'last_name', 'phone'] },
            {
              model: OrderItem,
              as: 'items',
              include: [{ model: MenuItem, as: 'menuItem' }]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { deliveries }
    });
  } catch (error) {
    next(error);
  }
};

// Accept delivery
const acceptDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery_partner_id = req.user.id;

    const delivery = await Delivery.findByPk(id, {
      include: [{ model: Order, as: 'order' }]
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (delivery.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Delivery is no longer available'
      });
    }

    // Disallow demo/test accounts from accepting deliveries in non-dev environments (or at all if configured)
    const demoEmail = process.env.DEMO_DELIVERY_EMAIL || 'demo_delivery@example.com';
    if (req.user && req.user.email && req.user.email === demoEmail) {
      return res.status(403).json({ success: false, message: 'Demo accounts cannot accept deliveries' });
    }

    // If delivery already has an assigned partner, only that partner may secure/accept it
    if (delivery.delivery_partner_id && delivery.delivery_partner_id !== delivery_partner_id) {
      return res.status(403).json({ success: false, message: 'Only assigned agents can secure!' });
    }

    await delivery.update({
      delivery_partner_id,
      status: 'accepted',
      accepted_at: new Date()
    });

    // Update order
    await Order.update(
      {
        delivery_partner_id,
        status: 'out_for_delivery',
        picked_up_at: new Date()
      },
      { where: { id: delivery.order_id } }
    );

    // Notify customer
    await createNotification(delivery.order.customer_id, delivery.order_id, 'delivery_accepted', {
      title: 'Delivery Partner Assigned',
      message: 'Your order is being delivered'
    });

    logger.info(`Delivery ${id} accepted by partner ${delivery_partner_id}`);

    res.json({
      success: true,
      message: 'Delivery accepted successfully',
      data: { delivery }
    });
  } catch (error) {
    next(error);
  }
};

// Update delivery location
const updateDeliveryLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    const delivery_partner_id = req.user.id;

    const delivery = await Delivery.findOne({
      where: {
        id,
        delivery_partner_id
      }
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (!['accepted', 'picked_up', 'in_transit'].includes(delivery.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update location for this delivery'
      });
    }

    await delivery.update({
      current_latitude: latitude,
      current_longitude: longitude
    });

    // Emit real-time location update via WebSocket
    req.app.get('io').to(`order_${delivery.order_id}`).emit('delivery_location_update', {
      order_id: delivery.order_id,
      latitude,
      longitude
    });

    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Mark as picked up
const markAsPickedUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery_partner_id = req.user.id;

    const delivery = await Delivery.findOne({
      where: {
        id,
        delivery_partner_id
      },
      include: [{ model: Order, as: 'order' }]
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (delivery.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery status'
      });
    }

    await delivery.update({
      status: 'picked_up',
      picked_up_at: new Date()
    });

    logger.info(`Delivery ${id} marked as picked up by partner ${delivery_partner_id}`);

    res.json({
      success: true,
      message: 'Delivery marked as picked up',
      data: { delivery }
    });
  } catch (error) {
    next(error);
  }
};

// Complete delivery
const completeDelivery = async (req, res, next) => {
  try {
    const { id } = req.params;
    const delivery_partner_id = req.user.id;

    const delivery = await Delivery.findOne({
      where: {
        id,
        delivery_partner_id
      },
      include: [{ model: Order, as: 'order' }]
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    if (!['picked_up', 'in_transit'].includes(delivery.status)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery cannot be completed at this stage'
      });
    }

    const now = new Date();

    await delivery.update({
      status: 'delivered',
      delivered_at: now
    });

    // Update order
    await Order.update(
      {
        status: 'delivered',
        delivered_at: now
      },
      { where: { id: delivery.order_id } }
    );

    // Notify customer
    await createNotification(delivery.order.customer_id, delivery.order_id, 'order_delivered', {
      title: 'Order Delivered',
      message: `Your order #${delivery.order.order_number} has been delivered`
    });

    logger.info(`Delivery ${id} completed by partner ${delivery_partner_id}`);

    res.json({
      success: true,
      message: 'Delivery completed successfully',
      data: { delivery }
    });
  } catch (error) {
    next(error);
  }
};

// Get delivery statistics (Admin only)
const getDeliveryStatistics = async (req, res, next) => {
  try {
    const { date_from, date_to } = req.query;

    const where = {};
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) where.created_at[Op.lte] = new Date(date_to);
    }

    const totalDeliveries = await Delivery.count({ where });
    
    // Use raw SQL for deliveries by status to avoid ambiguous column references
    let statusDateFilterSQL = '';
    const replacementsStatus = {};
    if (date_from) {
      replacementsStatus.date_from = new Date(date_from);
      statusDateFilterSQL += " AND d.created_at >= :date_from";
    }
    if (date_to) {
      replacementsStatus.date_to = new Date(date_to);
      statusDateFilterSQL += " AND d.created_at <= :date_to";
    }

    const deliveriesByStatusSql = `
      SELECT d.status, COUNT(d.id) AS count
      FROM deliveries d
      WHERE 1=1 ${statusDateFilterSQL}
      GROUP BY d.status
    `;

    const deliveriesByStatus = await Delivery.sequelize.query(deliveriesByStatusSql, {
      replacements: replacementsStatus,
      type: Delivery.sequelize.QueryTypes.SELECT
    });

    // Use raw SQL to avoid ambiguous column issues when joining and grouping
    const replacements = {};
    let dateFilterSQL = '';
    if (date_from) {
      replacements.date_from = new Date(date_from);
      dateFilterSQL += " AND d.created_at >= :date_from";
    }
    if (date_to) {
      replacements.date_to = new Date(date_to);
      dateFilterSQL += " AND d.created_at <= :date_to";
    }

    const topDeliveryPartnersSql = `
      SELECT d.delivery_partner_id,
             COUNT(d.id) AS delivery_count,
             u.id AS partner_id,
             u.first_name,
             u.last_name
      FROM deliveries d
      LEFT JOIN users u ON u.id = d.delivery_partner_id
      WHERE d.status = 'delivered' ${dateFilterSQL}
      GROUP BY d.delivery_partner_id, u.id, u.first_name, u.last_name
      ORDER BY delivery_count DESC
      LIMIT 10
    `;

    const topDeliveryPartners = await Delivery.sequelize.query(topDeliveryPartnersSql, {
      replacements,
      type: Delivery.sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        total_deliveries: totalDeliveries,
        deliveries_by_status: deliveriesByStatus,
        top_delivery_partners: topDeliveryPartners
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableDeliveries,
  getMyDeliveries,
  acceptDelivery,
  updateDeliveryLocation,
  markAsPickedUp,
  completeDelivery,
  getDeliveryStatistics
};