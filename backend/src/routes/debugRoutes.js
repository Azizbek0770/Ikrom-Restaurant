const express = require('express');
const router = express.Router();
const { sequelize, logger } = require('../config/database');

// GET /api/debug/db - non-destructive health check and basic counts
router.get('/db', async (req, res) => {
  try {
    // Test connection
    await sequelize.authenticate();

    // Collect lightweight counts for a few important tables
    const tables = ['users', 'categories', 'menu_items'];
    const counts = {};

    for (const t of tables) {
      try {
        const [rows] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM ${t}`);
        counts[t] = rows && rows[0] && (rows[0].count ?? rows[0].count) ? (rows[0].count || rows[0].count) : 0;
      } catch (err) {
        // If table doesn't exist or query fails, report null rather than throwing
        counts[t] = null;
      }
    }

    return res.json({ success: true, connected: true, counts });
  } catch (error) {
    logger.error('DB health check failed:', error);
    return res.status(500).json({ success: false, connected: false, error: error.message });
  }
});

module.exports = router;


