const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const { User, Category, MenuItem, sequelize } = require('../models');
const { logger } = require('../config/database');
require('dotenv').config();

const seed = async () => {
  let transaction;
  try {
    logger.info('Starting database seeding...');

    const useRaw = (process.env.USE_RAW_SEED || '').toLowerCase() === 'true';

    // Start a transaction that will cover raw SQL (if used) and JS seeding for atomicity
    transaction = await sequelize.transaction();

    if (useRaw) {
      const sqlPath = path.join(__dirname, '../../sql/seed.sql');
      logger.info(`Running raw seed from ${sqlPath}`);
      const sql = await fs.readFile(sqlPath, 'utf8');
      await sequelize.query(sql, { transaction });
      logger.info('✅ Raw SQL seed executed');
    }

    // Create admin user (hashed by model hooks) if not exists
    const adminExists = await User.findOne({ where: { role: 'admin' }, transaction });
    if (!adminExists) {
      await User.create({
        email: process.env.ADMIN_EMAIL || 'admin@restaurant.com',
        password_hash: process.env.ADMIN_PASSWORD || 'Admin@123456',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true,
        is_verified: true
      }, { transaction });
      logger.info('✅ Admin user created');
    }

    // Create categories and menu items (idempotent using findOrCreate) within the transaction
    const categories = [
      {
        name: 'Burgers',
        name_uz: 'Burgerlar',
        name_ru: 'Бургеры',
        description: 'Delicious burgers made with fresh ingredients',
        sort_order: 1
      },
      {
        name: 'Pizza',
        name_uz: 'Pitsa',
        name_ru: 'Пицца',
        description: 'Traditional and specialty pizzas',
        sort_order: 2
      },
      {
        name: 'Drinks',
        name_uz: 'Ichimliklar',
        name_ru: 'Напитки',
        description: 'Refreshing beverages',
        sort_order: 3
      },
      {
        name: 'Desserts',
        name_uz: 'Shirinliklar',
        name_ru: 'Десерты',
        description: 'Sweet treats to end your meal',
        sort_order: 4
      }
    ];

    for (const catData of categories) {
      const [category] = await Category.findOrCreate({
        where: { name: catData.name },
        defaults: catData,
        transaction
      });
      logger.info(`✅ Category: ${category.name}`);

      // Add menu items for each category
      if (category.name === 'Burgers') {
        const burgerItems = [
          {
            name: 'Classic Burger',
            name_uz: 'Klassik Burger',
            name_ru: 'Классический Бургер',
            description: 'Beef patty, lettuce, tomato, cheese',
            price: 35000,
            preparation_time: 15,
            calories: 650
          },
          {
            name: 'Chicken Burger',
            name_uz: 'Tovuqli Burger',
            name_ru: 'Куриный Бургер',
            description: 'Grilled chicken, lettuce, mayo',
            price: 32000,
            preparation_time: 15,
            calories: 550
          }
        ];

        for (const item of burgerItems) {
          await MenuItem.findOrCreate({
            where: { category_id: category.id, name: item.name },
            defaults: { ...item, category_id: category.id },
            transaction
          });
        }
      }

      if (category.name === 'Pizza') {
        const pizzaItems = [
          {
            name: 'Margherita',
            name_uz: 'Margarita',
            name_ru: 'Маргарита',
            description: 'Tomato sauce, mozzarella, basil',
            price: 45000,
            preparation_time: 20,
            calories: 800
          },
          {
            name: 'Pepperoni',
            name_uz: 'Pepperoni',
            name_ru: 'Пепперони',
            description: 'Tomato sauce, mozzarella, pepperoni',
            price: 50000,
            preparation_time: 20,
            calories: 900
          }
        ];

        for (const item of pizzaItems) {
          await MenuItem.findOrCreate({
            where: { category_id: category.id, name: item.name },
            defaults: { ...item, category_id: category.id },
            transaction
          });
        }
      }

      if (category.name === 'Drinks') {
        const drinkItems = [
          {
            name: 'Coca Cola',
            name_uz: 'Koka Kola',
            name_ru: 'Кока Кола',
            description: '0.5L bottle',
            price: 8000,
            preparation_time: 2,
            calories: 200
          },
          {
            name: 'Fresh Orange Juice',
            name_uz: 'Yangi apelsin sharbati',
            name_ru: 'Свежий апельсиновый сок',
            description: 'Freshly squeezed',
            price: 12000,
            preparation_time: 5,
            calories: 150
          }
        ];

        for (const item of drinkItems) {
          await MenuItem.findOrCreate({
            where: { category_id: category.id, name: item.name },
            defaults: { ...item, category_id: category.id },
            transaction
          });
        }
      }

      if (category.name === 'Desserts') {
        const dessertItems = [
          {
            name: 'Chocolate Cake',
            name_uz: 'Shokoladli tort',
            name_ru: 'Шоколадныйторт',
            description: 'Rich chocolate cake with frosting',
            price: 18000,
            preparation_time: 5,
            calories: 450
          },
          {
            name: 'Ice Cream',
            name_uz: 'Muzqaymoq',
            name_ru: 'Мороженое',
            description: 'Vanilla, chocolate, or strawberry',
            price: 10000,
            preparation_time: 3,
            calories: 250
          }
        ];

        for (const item of dessertItems) {
          await MenuItem.findOrCreate({
            where: { category_id: category.id, name: item.name },
            defaults: { ...item, category_id: category.id },
            transaction
          });
        }
      }
    }

    await transaction.commit();
    logger.info('✅ Database seeded successfully');
    process.exit(0);
  } catch (error) {
    if (transaction) await transaction.rollback();
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seed();