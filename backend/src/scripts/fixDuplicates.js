const { sequelize, logger } = require('../config/database');
require('dotenv').config();

/**
 * This script fixes duplicate telegram_id and email values in the users table
 * Run this before starting the server to resolve unique constraint violations
 */
const fixDuplicates = async () => {
  try {
    logger.info('🔧 Starting duplicate cleanup...');

    // Clean up duplicate telegram_id values
    const [telegramResults] = await sequelize.query(`
      DO $$
      DECLARE
        duplicate_value VARCHAR;
        fixed_count INTEGER := 0;
      BEGIN
        -- Fix duplicate telegram_id values (keep oldest, nullify others)
        FOR duplicate_value IN 
          SELECT telegram_id 
          FROM users 
          WHERE telegram_id IS NOT NULL 
          GROUP BY telegram_id 
          HAVING COUNT(*) > 1
        LOOP
          UPDATE users 
          SET telegram_id = NULL 
          WHERE telegram_id = duplicate_value 
            AND id NOT IN (
              SELECT id FROM users 
              WHERE telegram_id = duplicate_value 
              ORDER BY created_at ASC 
              LIMIT 1
            );
          
          fixed_count := fixed_count + 1;
          RAISE NOTICE 'Cleaned duplicate telegram_id: %', duplicate_value;
        END LOOP;
        
        IF fixed_count > 0 THEN
          RAISE NOTICE 'Fixed % duplicate telegram_id entries', fixed_count;
        ELSE
          RAISE NOTICE 'No duplicate telegram_id entries found';
        END IF;
      END$$;
    `);

    // Clean up duplicate email values
    const [emailResults] = await sequelize.query(`
      DO $$
      DECLARE
        duplicate_value VARCHAR;
        fixed_count INTEGER := 0;
      BEGIN
        -- Fix duplicate email values (keep oldest, nullify others)
        FOR duplicate_value IN 
          SELECT email 
          FROM users 
          WHERE email IS NOT NULL 
          GROUP BY email 
          HAVING COUNT(*) > 1
        LOOP
          UPDATE users 
          SET email = NULL 
          WHERE email = duplicate_value 
            AND id NOT IN (
              SELECT id FROM users 
              WHERE email = duplicate_value 
              ORDER BY created_at ASC 
              LIMIT 1
            );
          
          fixed_count := fixed_count + 1;
          RAISE NOTICE 'Cleaned duplicate email: %', duplicate_value;
        END LOOP;
        
        IF fixed_count > 0 THEN
          RAISE NOTICE 'Fixed % duplicate email entries', fixed_count;
        ELSE
          RAISE NOTICE 'No duplicate email entries found';
        END IF;
      END$$;
    `);

    logger.info('✅ Duplicate cleanup completed successfully');
    
    // Verify no duplicates remain
    const [telegramDuplicates] = await sequelize.query(`
      SELECT telegram_id, COUNT(*) as count 
      FROM users 
      WHERE telegram_id IS NOT NULL 
      GROUP BY telegram_id 
      HAVING COUNT(*) > 1
    `);
    
    const [emailDuplicates] = await sequelize.query(`
      SELECT email, COUNT(*) as count 
      FROM users 
      WHERE email IS NOT NULL 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);
    
    if (telegramDuplicates.length === 0 && emailDuplicates.length === 0) {
      logger.info('✅ Verification passed: No duplicates remain');
    } else {
      logger.warn('⚠️  Some duplicates may still exist:', {
        telegram: telegramDuplicates.length,
        email: emailDuplicates.length
      });
    }

    process.exit(0);
  } catch (error) {
    logger.error('❌ Duplicate cleanup failed:', error);
    process.exit(1);
  }
};

fixDuplicates();
