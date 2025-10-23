const { News, Banner } = require('../models');
const { Op } = require('sequelize');

// GET /api/news (public - only published news)
const getPublishedNews = async (req, res, next) => {
  try {
    const news = await News.findAll({
      where: { is_published: true },
      order: [['published_at', 'DESC'], ['sort_order', 'ASC']]
    });

    res.json({ success: true, data: { news } });
  } catch (error) {
    next(error);
  }
};

// GET /api/news/:id (public - single news item)
const getNewsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const news = await News.findOne({
      where: { 
        id,
        is_published: true 
      }
    });

    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }

    res.json({ success: true, data: { news } });
  } catch (error) {
    next(error);
  }
};

// Admin: list all news
const listNews = async (req, res, next) => {
  try {
    const news = await News.findAll({ 
      order: [['created_at', 'DESC']] 
    });
    res.json({ success: true, data: { news } });
  } catch (error) {
    next(error);
  }
};

// Admin: create news
const createNews = async (req, res, next) => {
  try {
    const { title, content, excerpt, image_url, is_published, author, sort_order, add_to_banner } = req.body;
    
    // Create news item
    const news = await News.create({ 
      title, 
      content, 
      excerpt, 
      image_url, 
      is_published, 
      author, 
      sort_order,
      published_at: is_published ? new Date() : null
    });

    // If add_to_banner is true, create a news-linked banner
    if (add_to_banner && is_published) {
      await Banner.create({
        title: news.title,
        subtitle: news.excerpt,
        image_url: news.image_url,
        banner_type: 'news_linked',
        news_id: news.id,
        is_active: true,
        sort_order: 0
      });
    }

    res.status(201).json({ success: true, data: { news } });
  } catch (error) {
    next(error);
  }
};

// Admin: update news
const updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { add_to_banner } = updates;
    delete updates.add_to_banner;

    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }

    // Update published_at if publishing for the first time
    if (updates.is_published && !news.is_published) {
      updates.published_at = new Date();
    } else if (updates.is_published === false) {
      updates.published_at = null;
    }

    await news.update(updates);

    // Handle banner creation/update based on add_to_banner flag
    const existingBanner = await Banner.findOne({ 
      where: { 
        news_id: news.id,
        banner_type: 'news_linked'
      } 
    });

    if (add_to_banner && news.is_published) {
      if (existingBanner) {
        // Update existing banner
        await existingBanner.update({
          title: news.title,
          subtitle: news.excerpt,
          image_url: news.image_url,
          is_active: true
        });
      } else {
        // Create new banner
        await Banner.create({
          title: news.title,
          subtitle: news.excerpt,
          image_url: news.image_url,
          banner_type: 'news_linked',
          news_id: news.id,
          is_active: true,
          sort_order: 0
        });
      }
    } else if (!add_to_banner && existingBanner) {
      // Remove banner if add_to_banner is false
      await existingBanner.destroy();
    }

    // If news is unpublished, deactivate associated banner
    if (!news.is_published && existingBanner) {
      await existingBanner.update({ is_active: false });
    }

    res.json({ success: true, data: { news } });
  } catch (error) {
    next(error);
  }
};

// Admin: delete news
const deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);
    
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }

    // Delete news (cascade will handle linked banners)
    await news.destroy();
    
    res.json({ success: true, message: 'News deleted' });
  } catch (error) {
    next(error);
  }
};

// Admin: publish/unpublish news
const togglePublish = async (req, res, next) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);
    
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }

    const newPublishState = !news.is_published;
    await news.update({ 
      is_published: newPublishState,
      published_at: newPublishState ? new Date() : null
    });

    // Update associated banner visibility
    const banner = await Banner.findOne({ 
      where: { 
        news_id: news.id,
        banner_type: 'news_linked'
      } 
    });

    if (banner) {
      await banner.update({ is_active: newPublishState });
    }

    res.json({ success: true, data: { news } });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getPublishedNews, 
  getNewsById, 
  listNews, 
  createNews, 
  updateNews, 
  deleteNews,
  togglePublish
};
