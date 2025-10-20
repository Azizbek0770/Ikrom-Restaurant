const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  type: {
    type: DataTypes.ENUM(
      'order_created',
      'order_confirmed',
      'order_preparing',
      'order_ready',
      'order_out_for_delivery',
      'order_delivered',
      'order_cancelled',
      'payment_success',
      'payment_failed',
      'delivery_assigned',
      'delivery_accepted'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  is_read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  telegram_message_id: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['order_id'] },
    { fields: ['is_read'] },
    { fields: ['created_at'] }
  ]
});

module.exports = Notification;