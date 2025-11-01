const { Address } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../config/database');

// Get user addresses
const getAddresses = async (req, res, next) => {
  try {
    const user_id = req.user.id;

    const addresses = await Address.findAll({
      where: { user_id },
      order: [['is_default', 'DESC'], ['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { addresses }
    });
  } catch (error) {
    next(error);
  }
};

// Get single address
const getAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const address = await Address.findOne({
      where: { id, user_id }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.json({
      success: true,
      data: { address }
    });
  } catch (error) {
    next(error);
  }
};

// Create address
const createAddress = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const {
      label,
      street_address,
      apartment,
      entrance,
      floor,
      city,
      latitude,
      longitude,
      is_default,
      delivery_instructions
    } = req.body;

    // Basic server-side validation: require latitude & longitude and delivery_instructions
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    }
    if (!delivery_instructions || !String(delivery_instructions).trim()) {
      return res.status(400).json({ success: false, message: 'Delivery instructions (description) are required' });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await Address.update(
        { is_default: false },
        { where: { user_id } }
      );
    }

    const address = await Address.create({
      user_id,
      label,
      street_address,
      apartment,
      entrance,
      floor,
      city: city || 'Tashkent',
      latitude,
      longitude,
      is_default: is_default || false,
      delivery_instructions
    });

    logger.info(`Address created: ${address.id} for user ${user_id}`);

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: { address }
    });
  } catch (error) {
    next(error);
  }
};

// Update address
const updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const updates = req.body;

    const address = await Address.findOne({
      where: { id, user_id }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Server-side validation: if latitude/longitude or delivery_instructions present, require both
    if ((updates.latitude && !updates.longitude) || (!updates.latitude && updates.longitude)) {
      return res.status(400).json({ success: false, message: 'Both latitude and longitude must be provided' });
    }
    if (updates.delivery_instructions !== undefined && !String(updates.delivery_instructions).trim()) {
      return res.status(400).json({ success: false, message: 'Delivery instructions (description) cannot be empty' });
    }

    // If setting as default, unset other defaults
    if (updates.is_default) {
      await Address.update(
        { is_default: false },
        { where: { user_id, id: { [Op.ne]: id } } }
      );
    }

    await address.update(updates);

    logger.info(`Address updated: ${id} by user ${user_id}`);

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: { address }
    });
  } catch (error) {
    next(error);
  }
};

// Delete address
const deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const address = await Address.findOne({
      where: { id, user_id }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    await address.destroy();

    logger.info(`Address deleted: ${id} by user ${user_id}`);

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Set default address
const setDefaultAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const address = await Address.findOne({
      where: { id, user_id }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Unset all defaults
    await Address.update(
      { is_default: false },
      { where: { user_id } }
    );

    // Set this as default
    await address.update({ is_default: true });

    res.json({
      success: true,
      message: 'Default address updated',
      data: { address }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};