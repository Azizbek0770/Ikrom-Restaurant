const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subtitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  banner_type: {
    type: DataTypes.ENUM('standard', 'news_linked'),
    defaultValue: 'standard'
  },
  news_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'news',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'banners',
  indexes: [
    { fields: ['is_active'] },
    { fields: ['sort_order'] },
    { fields: ['banner_type'] },
    { fields: ['news_id'] }
  ]
});

module.exports = Banner;


