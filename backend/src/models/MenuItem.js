const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'categories',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 200]
    }
  },
  name_uz: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name_ru: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description_uz: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description_ru: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  preparation_time: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
    comment: 'Time in minutes'
  },
  calories: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'menu_items',
  indexes: [
    { fields: ['category_id'] },
    { fields: ['is_available'] },
    { fields: ['is_featured'] }
  ]
});

module.exports = MenuItem;