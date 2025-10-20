const { Banner } = require('../models');

// GET /api/banners (public active banners)
const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']]
    });

    res.json({ success: true, data: { banners } });
  } catch (error) {
    next(error);
  }
};

// Admin: list banners
const listBanners = async (req, res, next) => {
  try {
    const banners = await Banner.findAll({ order: [['sort_order', 'ASC']] });
    res.json({ success: true, data: { banners } });
  } catch (error) {
    next(error);
  }
};

// Admin: create
const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image_url, link, sort_order, is_active } = req.body;
    const banner = await Banner.create({ title, subtitle, image_url, link, sort_order, is_active });
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


