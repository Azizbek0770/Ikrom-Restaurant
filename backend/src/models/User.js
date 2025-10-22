const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  telegram_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    index: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^\+?[1-9]\d{1,14}$/
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  role: {
    type: DataTypes.ENUM('customer', 'delivery', 'admin'),
    defaultValue: 'customer',
    allowNull: false
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  }
  ,
  created_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  indexes: [
    { fields: ['telegram_id'] },
    { fields: ['email'] },
    { fields: ['role'] }
  ]
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  if (!this.password_hash) return false;
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password_hash;
  delete values.refresh_token;
  return values;
};

// Hooks
User.beforeCreate(async (user) => {
  if (user.password_hash) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password_hash') && user.password_hash) {
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(user.password_hash, salt);
  }
});

module.exports = User;