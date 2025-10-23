const { sequelize, testConnection, logger } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const migrate = async () => {
  try {
    logger.info('Starting sales_count migration...');

    const connected = await testConnection();
    if (!connected) {
      throw new Error('Database connection failed');
    }

    const sqlPath = path.join(__dirname, '../../sql/add_sales_count.sql');
    logger.info(`Running migration from ${sqlPath}`);
    const sql = await fs.readFile(sqlPath, 'utf8');

    const transaction = await sequelize.transaction();
    try {
      await sequelize.query(sql, { transaction });
      await transaction.commit();
      logger.info('✅ Sales count migration completed successfully');
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
