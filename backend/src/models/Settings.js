const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Simple key-value settings table to store small site-wide values (like logo)
const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  value: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'settings',
  timestamps: true,
  underscored: true
});

module.exports = Settings;


