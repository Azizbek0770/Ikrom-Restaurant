const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const MenuItem = require('./MenuItem');
const Address = require('./Address');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Delivery = require('./Delivery');
const Notification = require('./Notification');
const Banner = require('./Banner');
const News = require('./News');

// Define associations
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Category.hasMany(MenuItem, { foreignKey: 'category_id', as: 'items' });
MenuItem.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

User.hasMany(Order, { foreignKey: 'customer_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

User.hasMany(Order, { foreignKey: 'delivery_partner_id', as: 'deliveries' });
Order.belongsTo(User, { foreignKey: 'delivery_partner_id', as: 'deliveryPartner' });

Order.belongsTo(Address, { foreignKey: 'address_id', as: 'deliveryAddress' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

MenuItem.hasMany(OrderItem, { foreignKey: 'menu_item_id', as: 'orderItems' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem' });

Order.hasOne(Delivery, { foreignKey: 'order_id', as: 'delivery' });
Delivery.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

User.hasMany(Delivery, { foreignKey: 'delivery_partner_id', as: 'assignedDeliveries' });
Delivery.belongsTo(User, { foreignKey: 'delivery_partner_id', as: 'deliveryPartner' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Order.hasMany(Notification, { foreignKey: 'order_id', as: 'notifications' });
Notification.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// News and Banner associations
News.hasMany(Banner, { foreignKey: 'news_id', as: 'banners' });
Banner.belongsTo(News, { foreignKey: 'news_id', as: 'news' });

const models = {
  User,
  Category,
  MenuItem,
  Address,
  Order,
  OrderItem,
  Delivery,
  Notification,
  Banner,
  News,
  sequelize
};

module.exports = models;