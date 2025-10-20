const { Op } = require('sequelize');
const { User } = require('../models');
const { logger } = require('../config/database');

// GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = parseInt(req.query.per_page, 10) || 20;
    const { role, search, active_only } = req.query;

    const where = {};
    if (role) where.role = role;
    if (active_only === 'true') where.is_active = true;

    if (search) {
      const like = `%${search}%`;
      where[Op.or] = [
        { first_name: { [Op.iLike]: like } },
        { last_name: { [Op.iLike]: like } },
        { email: { [Op.iLike]: like } },
        { phone: { [Op.iLike]: like } }
      ];
    }

    const offset = (page - 1) * perPage;

    const { rows: users, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'refresh_token'] },
      order: [['created_at', 'DESC']],
      limit: perPage,
      offset
    });

    const totalPages = Math.ceil(count / perPage) || 1;

    res.json({
      success: true,
      data: {
        users,
        meta: {
          total: count,
          page,
          perPage,
          totalPages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash', 'refresh_token'] }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// POST /api/users
const createUser = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role, phone, avatar_url, is_active, is_verified } = req.body;

    if (email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'User with this email already exists' });
      }
    }

    const user = await User.create({
      email: email || null,
      password_hash: password || null,
      first_name,
      last_name: last_name || null,
      role: role || 'customer',
      phone: phone || null,
      avatar_url: avatar_url || null,
      is_active: typeof is_active === 'boolean' ? is_active : true,
      is_verified: typeof is_verified === 'boolean' ? is_verified : false
    });

    logger.info(`User created: ${user.id} by admin ${req.user?.id}`);

    res.status(201).json({ success: true, message: 'User created successfully', data: { user: user.toJSON() } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If password provided, set password_hash so hooks will re-hash on save
    if (updates.password) {
      updates.password_hash = updates.password;
      delete updates.password;
    }

    // Prevent updating protected fields from the body directly
    delete updates.refresh_token;

    await user.update(updates);

    logger.info(`User updated: ${user.id} by admin ${req.user?.id}`);

    const cleaned = await User.findByPk(id, { attributes: { exclude: ['password_hash', 'refresh_token'] } });

    res.json({ success: true, message: 'User updated successfully', data: { user: cleaned } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.destroy();

    logger.info(`User deleted: ${id} by admin ${req.user?.id}`);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
