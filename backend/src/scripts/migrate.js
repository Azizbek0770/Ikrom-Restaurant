const { sequelize, testConnection, logger } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Ensure all models are loaded so sequelize.sync() creates tables defined by models
// This file intentionally requires the models index which registers models on the sequelize instance.
try {
  const models = require('../models');
  const modelNames = Object.keys(models).filter((k) => k !== 'sequelize');
  logger.info(`Loaded models: ${modelNames.join(', ')}`);
} catch (err) {
  logger.warn('No models loaded before migration:', err.message);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const ensureConnection = async (retries = 5, delayMs = 2000) => {
  for (let i = 0; i < retries; i++) {
    const ok = await testConnection();
    if (ok) return true;
    logger.warn(`DB connect attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
    await sleep(delayMs);
    delayMs *= 1.5; // exponential backoff
  }
  return false;
};

const migrate = async () => {
  try {
    logger.info('Starting database migration...');

    const connected = await ensureConnection();
    if (!connected) {
      throw new Error('Database connection failed after retries');
    }

    const useRaw = (process.env.USE_RAW_MIGRATION || '').toLowerCase() === 'true';

    const runRawMigration = async () => {
      const sqlPath = path.join(__dirname, '../../sql/migration.sql');
      logger.info(`Running raw migration from ${sqlPath}`);
      const sql = await fs.readFile(sqlPath, 'utf8'); 

      const transaction = await sequelize.transaction();
      try {
        // Execute the whole SQL script. Postgres supports multiple statements in a single query string.
        await sequelize.query(sql, { transaction });
        await transaction.commit();
        logger.info('✅ Raw migration completed successfully');
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    };

    if (useRaw) {
      await runRawMigration();
    } else {
      // Try Sequelize.sync with retries; fall back to raw SQL if it consistently fails
      const maxSyncAttempts = 3;
      let synced = false;
      for (let attempt = 1; attempt <= maxSyncAttempts; attempt++) {
        try {
          logger.info(`Running Sequelize.sync() attempt ${attempt}/${maxSyncAttempts}`);
          await sequelize.sync({ force: false, alter: true });
          logger.info('✅ Sequelize sync completed successfully');
          synced = true;
          break;
        } catch (syncErr) {
          logger.warn(`Sequelize.sync() attempt ${attempt} failed: ${syncErr.message}`);
          // If last attempt, will fall back
          await sleep(1500 * attempt);
        }
      }

      if (!synced) {
        logger.warn('Sequelize.sync() failed after multiple attempts, falling back to raw SQL migration');
        await runRawMigration();
      }
    }

    logger.info('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();