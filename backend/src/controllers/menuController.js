const { MenuItem, Category } = require('../models');
const { logger } = require('../config/database');

// Get all menu items
const getMenuItems = async (req, res, next) => {
  try {
    const { category_id, available_only, featured_only, search } = req.query;

    const where = {};
    
    if (category_id) {
      where.category_id = category_id;
    }
    
    if (available_only === 'true') {
      where.is_available = true;
    }
    
    if (featured_only === 'true') {
      where.is_featured = true;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const menuItems = await MenuItem.findAll({
      where,
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'name_uz', 'name_ru']
      }],
      order: [['sales_count', 'DESC'], ['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { menuItems }
    });
  } catch (error) {
    next(error);
  }
};

// Get single menu item
const getMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByPk(id, {
      include: [{
        model: Category,
        as: 'category'
      }]
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: { menuItem }
    });
  } catch (error) {
    next(error);
  }
};

// Create menu item (Admin only)
const createMenuItem = async (req, res, next) => {
  try {
    const {
      category_id,
      name,
      name_uz,
      name_ru,
      description,
      description_uz,
      description_ru,
      price,
      image_url,
      preparation_time,
      calories,
      sort_order
    } = req.body;

    // Verify category exists
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const menuItem = await MenuItem.create({
      category_id,
      name,
      name_uz,
      name_ru,
      description,
      description_uz,
      description_ru,
      price,
      image_url,
      preparation_time: preparation_time || 15,
      calories,
      sort_order: sort_order || 0
    });

    logger.info(`Menu item created: ${menuItem.id} by admin ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { menuItem }
    });
  } catch (error) {
    next(error);
  }
};

// Update menu item (Admin only)
const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const menuItem = await MenuItem.findByPk(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    // If updating category, verify it exists
    if (updates.category_id) {
      const category = await Category.findByPk(updates.category_id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    await menuItem.update(updates);

    logger.info(`Menu item updated: ${menuItem.id} by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { menuItem }
    });
  } catch (error) {
    next(error);
  }
};

// Delete menu item (Admin only)
const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByPk(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await menuItem.destroy();

    logger.info(`Menu item deleted: ${id} by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Toggle availability (Admin only)
const toggleAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByPk(id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await menuItem.update({ is_available: !menuItem.is_available });

    logger.info(`Menu item availability toggled: ${id} by admin ${req.user.id}`);

    res.json({
      success: true,
      message: `Menu item ${menuItem.is_available ? 'enabled' : 'disabled'}`,
      data: { menuItem }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
};