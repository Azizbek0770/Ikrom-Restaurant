const express = require('express');
const router = express.Router();
const { sequelize, logger } = require('../config/database');

// GET /api/debug/db - non-destructive health check and basic counts
router.get('/db', async (req, res) => {
  try {
    // Test connection
    await sequelize.authenticate();

    // Collect lightweight counts for important tables and sample data for news/banners
    const counts = {};
    const tables = ['users', 'categories', 'menu_items', 'banners', 'news'];

    for (const t of tables) {
      try {
        const [rows] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM ${t}`);
        counts[t] = rows && rows[0] && typeof rows[0].count !== 'undefined' ? rows[0].count : 0;
      } catch (err) {
        counts[t] = null;
      }
    }

    // Fetch a small sample of published news (non-destructive)
    let newsSample = [];
    try {
      const [rows] = await sequelize.query(`SELECT id, title, is_published, published_at FROM news ORDER BY published_at DESC NULLS LAST LIMIT 5`);
      newsSample = rows || [];
    } catch (err) {
      newsSample = [];
    }

    // Fetch a small sample of active banners
    let bannerSample = [];
    try {
      const [rows] = await sequelize.query(`SELECT id, title, subtitle, image_url, banner_type, news_id, is_active FROM banners WHERE is_active = true ORDER BY sort_order ASC LIMIT 10`);
      bannerSample = rows || [];
    } catch (err) {
      bannerSample = [];
    }

    return res.json({ success: true, connected: true, counts, newsSample, bannerSample });
  } catch (error) {
    logger.error('DB health check failed:', error);
    return res.status(500).json({ success: false, connected: false, error: error.message });
  }
});

module.exports = router;


