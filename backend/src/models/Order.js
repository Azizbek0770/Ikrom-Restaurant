const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  delivery_partner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  address_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'addresses',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'paid',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'cancelled'
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('card', 'cash', 'payme', 'click'),
    defaultValue: 'card'
  },
  payment_intent_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  delivery_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  delivery_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estimated_delivery_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accepted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  preparing_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ready_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  picked_up_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'orders',
  indexes: [
    { fields: ['customer_id'] },
    { fields: ['delivery_partner_id'] },
    { fields: ['status'] },
    { fields: ['payment_status'] },
    { fields: ['order_number'] },
    { fields: ['created_at'] }
  ]
});

// Generate order number before creation
Order.beforeCreate(async (order) => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  order.order_number = `ORD-${timestamp}${random}`;
});

module.exports = Order;