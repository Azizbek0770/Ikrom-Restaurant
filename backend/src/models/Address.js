const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Address = sequelize.define('Address', {
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
  label: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Home, Work, etc.'
  },
  street_address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  apartment: {
    type: DataTypes.STRING,
    allowNull: true
  },
  entrance: {
    type: DataTypes.STRING,
    allowNull: true
  },
  floor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    defaultValue: 'Tashkent'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  delivery_instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'addresses',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_default'] }
  ]
});

module.exports = Address;