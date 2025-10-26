const { Banner, News } = require('../models');

// GET /api/banners (public active banners)
const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']],
      include: [{
        model: News,
        as: 'news',
        attributes: ['id', 'title', 'excerpt', 'image_url'],
        required: false
      }]
    });

    // Normalize response to ensure frontend can open news detail from banner
    const normalized = banners.map(b => {
      const plain = b.toJSON ? b.toJSON() : b;
      // attach news_id from included relation if missing
      if (!plain.news_id && plain.news && plain.news.id) plain.news_id = plain.news.id;
      return plain;
    });

    res.json({ success: true, data: { banners: normalized } });
  } catch (error) {
    next(error);
  }
};

// Admin: list banners
const listBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({ 
      order: [['sort_order', 'ASC']],
      include: [{
        model: News,
        as: 'news',
        attributes: ['id', 'title', 'is_published'],
        required: false
      }]
    });
    res.json({ success: true, data: { banners } });
  } catch (error) {
    next(error);
  }
};

// Admin: create
const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image_url, link, sort_order, is_active, banner_type, news_id } = req.body;
    const banner = await Banner.create({ 
      title, 
      subtitle, 
      image_url, 
      link, 
      sort_order, 
      is_active,
      banner_type: banner_type || 'standard',
      news_id: banner_type === 'news_linked' ? news_id : null
    });
    res.status(201).json({ success: true, data: { banner } });
  } catch (error) {
    next(error);
  }
};

// Admin: update
const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const banner = await Banner.findByPk(id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    
    // If changing to standard type, clear news_id
    if (updates.banner_type === 'standard') {
      updates.news_id = null;
    }
    
    await banner.update(updates);
    res.json({ success: true, data: { banner } });
  } catch (error) {
    next(error);
  }
};

// Admin: delete
const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    await banner.destroy();
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActiveBanners, listBanners, createBanner, updateBanner, deleteBanner };


