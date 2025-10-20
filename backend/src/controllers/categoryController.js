const { Category, MenuItem } = require('../models');
const { logger } = require('../config/database');

// Get all categories
const getCategories = async (req, res, next) => {
  try {
    const { include_items, active_only } = req.query;

    const where = {};
    if (active_only === 'true') {
      where.is_active = true;
    }

    const include = [];
    if (include_items === 'true') {
      include.push({
        model: MenuItem,
        as: 'items',
        where: active_only === 'true' ? { is_available: true } : {},
        required: false
      });
    }

    const categories = await Category.findAll({
      where,
      include,
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

// Get single category
const getCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id, {
      include: [{
        model: MenuItem,
        as: 'items',
        where: { is_available: true },
        required: false,
        order: [['sort_order', 'ASC'], ['name', 'ASC']]
      }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

// Create category (Admin only)
const createCategory = async (req, res, next) => {
  try {
    const { name, name_uz, name_ru, description, image_url, sort_order } = req.body;

    const category = await Category.create({
      name,
      name_uz,
      name_ru,
      description,
      image_url,
      sort_order: sort_order || 0
    });

    logger.info(`Category created: ${category.id} by admin ${req.user.id}`);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

// Update category (Admin only)
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    await category.update(updates);

    logger.info(`Category updated: ${category.id} by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

// Delete category (Admin only)
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check if category has items
    const itemCount = await MenuItem.count({ where: { category_id: id } });
    
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing menu items'
      });
    }

    await category.destroy();

    logger.info(`Category deleted: ${id} by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};