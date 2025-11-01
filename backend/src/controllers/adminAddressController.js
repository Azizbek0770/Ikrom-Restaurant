const { Address } = require('../models');
const { logger } = require('../config/database');
const { Op } = require('sequelize');

// Get addresses for a specific user (admin)
const getAddressesForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const addresses = await Address.findAll({ where: { user_id: userId }, order: [['is_default', 'DESC'], ['created_at', 'DESC']] });
    return res.json({ success: true, data: { addresses } });
  } catch (err) { next(err); }
};

const createAddressForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { street_address, latitude, longitude, label, is_default, delivery_instructions } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
    if (!delivery_instructions || !String(delivery_instructions).trim()) return res.status(400).json({ success: false, message: 'Delivery instructions are required' });

    if (is_default) await Address.update({ is_default: false }, { where: { user_id: userId } });

    const address = await Address.create({ user_id: userId, label, street_address: street_address || '', latitude, longitude, is_default: !!is_default, delivery_instructions });
    logger.info(`Admin created address ${address.id} for user ${userId}`);
    return res.status(201).json({ success: true, data: { address } });
  } catch (err) { next(err); }
};

const updateAddressForUser = async (req, res, next) => {
  try {
    const { userId, id } = req.params;
    const updates = req.body;
    const address = await Address.findOne({ where: { id, user_id: userId } });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    if ((updates.latitude && !updates.longitude) || (!updates.latitude && updates.longitude)) return res.status(400).json({ success: false, message: 'Both latitude and longitude must be provided' });
    if (updates.delivery_instructions !== undefined && !String(updates.delivery_instructions).trim()) return res.status(400).json({ success: false, message: 'Delivery instructions cannot be empty' });
    if (updates.is_default) await Address.update({ is_default: false }, { where: { user_id: userId, id: { [Op.ne]: id } } });
    await address.update(updates);
    logger.info(`Admin updated address ${id} for user ${userId}`);
    return res.json({ success: true, data: { address } });
  } catch (err) { next(err); }
};

const deleteAddressForUser = async (req, res, next) => {
  try {
    const { userId, id } = req.params;
    const address = await Address.findOne({ where: { id, user_id: userId } });
    if (!address) return res.status(404).json({ success: false, message: 'Address not found' });
    await address.destroy();
    logger.info(`Admin deleted address ${id} for user ${userId}`);
    return res.json({ success: true, message: 'Address deleted' });
  } catch (err) { next(err); }
};

module.exports = {
  getAddressesForUser,
  createAddressForUser,
  updateAddressForUser,
  deleteAddressForUser
};


