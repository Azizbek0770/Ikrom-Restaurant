const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  menu_item_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'menu_items',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  special_instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'order_items',
  indexes: [
    { fields: ['order_id'] },
    { fields: ['menu_item_id'] }
  ]
});

// Calculate subtotal before save
OrderItem.beforeSave(async (orderItem) => {
  orderItem.subtotal = (parseFloat(orderItem.unit_price) * orderItem.quantity).toFixed(2);
});

module.exports = OrderItem;