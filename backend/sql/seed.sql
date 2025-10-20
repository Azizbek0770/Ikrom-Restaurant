-- Seed SQL for Food Delivery Platform
-- Inserts static reference data (categories, menu items). Idempotent using ON CONFLICT DO NOTHING.

-- Categories (idempotent inserts using existence checks)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pizza') THEN
    INSERT INTO categories (id, name, name_uz, name_ru, description, image_url, sort_order, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Pizza', 'Pitsa', 'Пицца', 'Delicious stone-baked pizzas', '/uploads/categories/pizza.png', 1, true, now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Burgers') THEN
    INSERT INTO categories (id, name, name_uz, name_ru, description, image_url, sort_order, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Burgers', 'Burger', 'Бургеры', 'Juicy grilled burgers', '/uploads/categories/burgers.png', 2, true, now(), now());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Drinks') THEN
    INSERT INTO categories (id, name, name_uz, name_ru, description, image_url, sort_order, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Drinks', 'Ichimliklar', 'Напитки', 'Cold and hot beverages', '/uploads/categories/drinks.png', 3, true, now(), now());
  END IF;
  -- Banners
  IF NOT EXISTS (SELECT 1 FROM banners WHERE title = 'Welcome') THEN
    INSERT INTO banners (id, title, subtitle, image_url, link, sort_order, is_active, created_at, updated_at)
    VALUES (gen_random_uuid(), 'Welcome', 'Order fresh meals delivered fast', '/uploads/banners/welcome.png', NULL, 1, true, now(), now());
  END IF;
END$$;

-- Menu items (idempotent via existence checks on name+category)
DO $$
DECLARE
  cat_id UUID;
BEGIN
  SELECT id INTO cat_id FROM categories WHERE name = 'Pizza' LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Margherita' AND category_id = cat_id) THEN
    INSERT INTO menu_items (id, category_id, name, description, price, is_available, is_featured, preparation_time, calories, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), cat_id, 'Margherita', 'Classic margherita with tomato and mozzarella', 9.99, true, true, 15, 800, 1, now(), now());
  END IF;

  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Pepperoni' AND category_id = cat_id) THEN
    INSERT INTO menu_items (id, category_id, name, description, price, is_available, is_featured, preparation_time, calories, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), cat_id, 'Pepperoni', 'Spicy pepperoni with extra cheese', 11.99, true, false, 18, 900, 2, now(), now());
  END IF;

  SELECT id INTO cat_id FROM categories WHERE name = 'Burgers' LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Classic Beef Burger' AND category_id = cat_id) THEN
    INSERT INTO menu_items (id, category_id, name, description, price, is_available, is_featured, preparation_time, calories, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), cat_id, 'Classic Beef Burger', 'Beef patty with lettuce, tomato and special sauce', 7.99, true, true, 12, 650, 1, now(), now());
  END IF;

  SELECT id INTO cat_id FROM categories WHERE name = 'Drinks' LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM menu_items WHERE name = 'Cola' AND category_id = cat_id) THEN
    INSERT INTO menu_items (id, category_id, name, description, price, is_available, is_featured, preparation_time, calories, sort_order, created_at, updated_at)
    VALUES (gen_random_uuid(), cat_id, 'Cola', 'Chilled cola drink', 1.50, true, false, 0, 150, 1, now(), now());
  END IF;
END$$;

-- You can add more static lookup data here. Users and sensitive data should be created via seed.js (JS seeding) to allow password hashing.
