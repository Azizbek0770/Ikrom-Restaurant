const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  delivery_partner_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM(
      'pending',
      'assigned',
      'accepted',
      'picked_up',
      'in_transit',
      'delivered',
      'failed'
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  pickup_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  pickup_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  dropoff_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  dropoff_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  current_latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  current_longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  distance_km: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  estimated_duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  assigned_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  accepted_at: {
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
  failed_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'deliveries',
  indexes: [
    { fields: ['order_id'] },
    { fields: ['delivery_partner_id'] },
    { fields: ['status'] }
  ]
});

module.exports = Delivery;