const { Sequelize } = require('sequelize');
const winston = require('winston');
require('dotenv').config();

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Database connection configuration
let sequelize;

// Prefer Supabase-provided database URL if present, otherwise fall back to DATABASE_URL
const DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (DATABASE_URL) {
  // Prefer DATABASE_URL (or SUPABASE_DATABASE_URL) when provided
  sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: (process.env.DB_SSL && process.env.DB_SSL !== '0') ? {
      ssl: {
        require: true,
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === '0' ? false : true
      }
    } : {},
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      // Support SSL connections when required by the hosting provider.
      // Set DB_SSL to 'true' or 'require' to enable, and DB_SSL_REJECT_UNAUTHORIZED=0 to allow self-signed certs.
      dialectOptions: (process.env.DB_SSL && process.env.DB_SSL !== '0') ? {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === '0' ? false : true
        }
      } : {},
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
      }
    }
  );
}

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Unable to connect to database:', error);
    return false;
  }
};

module.exports = { sequelize, testConnection, logger };