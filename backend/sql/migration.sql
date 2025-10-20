-- Migration SQL for Food Delivery Platform
-- Creates types, tables, constraints and indexes matching Sequelize models

-- Enable uuid-ossp extension for UUID generation functions if desired
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- If old enum types exist (from previous runs) rename or convert them to Sequelize-style enum names
DO $$
BEGIN
  -- Rename simple legacy types to Sequelize naming when possible
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
    BEGIN
      EXECUTE 'ALTER TYPE user_role RENAME TO enum_users_role';
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_status') THEN
    BEGIN
      EXECUTE 'ALTER TYPE order_status RENAME TO enum_orders_status';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_payment_status') THEN
    BEGIN
      EXECUTE 'ALTER TYPE payment_status RENAME TO enum_orders_payment_status';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_payment_method') THEN
    BEGIN
      EXECUTE 'ALTER TYPE payment_method RENAME TO enum_orders_payment_method';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_deliveries_status') THEN
    BEGIN
      EXECUTE 'ALTER TYPE delivery_status RENAME TO enum_deliveries_status';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_notifications_type') THEN
    BEGIN
      EXECUTE 'ALTER TYPE notification_type RENAME TO enum_notifications_type';
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  -- If both old and new types exist (or rename didn't apply), attempt safe column conversions via text casts
  BEGIN
    ALTER TABLE users ALTER COLUMN role TYPE text USING role::text;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE orders ALTER COLUMN status TYPE text USING status::text;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE orders ALTER COLUMN payment_status TYPE text USING payment_status::text;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE orders ALTER COLUMN payment_method TYPE text USING payment_method::text;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE deliveries ALTER COLUMN status TYPE text USING status::text;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE notifications ALTER COLUMN type TYPE text USING type::text;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END$$;

-- ENUM types
-- Create enum types with names matching Sequelize's naming convention (enum_<table>_<column>)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
    CREATE TYPE enum_users_role AS ENUM ('customer', 'delivery', 'admin');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_status') THEN
    CREATE TYPE enum_orders_status AS ENUM ('pending','paid','confirmed','preparing','ready','out_for_delivery','delivered','cancelled');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_payment_status') THEN
    CREATE TYPE enum_orders_payment_status AS ENUM ('pending','paid','failed','refunded');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_payment_method') THEN
    CREATE TYPE enum_orders_payment_method AS ENUM ('card','cash','payme','click');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_deliveries_status') THEN
    CREATE TYPE enum_deliveries_status AS ENUM ('pending','assigned','accepted','picked_up','in_transit','delivered','failed');
  END IF;
END$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_notifications_type') THEN
    CREATE TYPE enum_notifications_type AS ENUM (
      'order_created','order_confirmed','order_preparing','order_ready','order_out_for_delivery','order_delivered','order_cancelled','payment_success','payment_failed','delivery_assigned','delivery_accepted'
    );
  END IF;
END$$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id VARCHAR UNIQUE,
  email VARCHAR UNIQUE,
  phone VARCHAR,
  password_hash TEXT,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR,
  role enum_users_role NOT NULL DEFAULT 'customer',
  avatar_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users (telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  name_uz VARCHAR,
  name_ru VARCHAR,
  description TEXT,
  image_url VARCHAR,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories (is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories (sort_order);

-- Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  name_uz VARCHAR,
  name_ru VARCHAR,
  description TEXT,
  description_uz TEXT,
  description_ru TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url VARCHAR,
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  preparation_time INTEGER DEFAULT 15,
  calories INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items (category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_available ON menu_items (is_available);
CREATE INDEX IF NOT EXISTS idx_menu_items_is_featured ON menu_items (is_featured);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR,
  street_address VARCHAR NOT NULL,
  apartment VARCHAR,
  entrance VARCHAR,
  floor VARCHAR,
  city VARCHAR DEFAULT 'Tashkent',
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  is_default BOOLEAN DEFAULT false,
  delivery_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_is_default ON addresses (is_default);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  delivery_partner_id UUID REFERENCES users(id),
  address_id UUID NOT NULL REFERENCES addresses(id),
  status enum_orders_status NOT NULL DEFAULT 'pending',
  payment_status enum_orders_payment_status NOT NULL DEFAULT 'pending',
  payment_method enum_orders_payment_method DEFAULT 'card',
  payment_intent_id VARCHAR,
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee NUMERIC(10,2) DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  delivery_notes TEXT,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  preparing_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner_id ON orders (delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id ON order_items (menu_item_id);

-- Deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  delivery_partner_id UUID REFERENCES users(id),
  status enum_deliveries_status NOT NULL DEFAULT 'pending',
  pickup_latitude NUMERIC(10,8),
  pickup_longitude NUMERIC(11,8),
  dropoff_latitude NUMERIC(10,8),
  dropoff_longitude NUMERIC(11,8),
  current_latitude NUMERIC(10,8),
  current_longitude NUMERIC(11,8),
  distance_km NUMERIC(5,2),
  estimated_duration_minutes INTEGER,
  assigned_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries (order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_partner_id ON deliveries (delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries (status);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  type enum_notifications_type NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  telegram_message_id VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications (order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);

-- Banners (site banners / small news banners)
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  subtitle VARCHAR,
  image_url VARCHAR,
  link VARCHAR,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners (is_active);
CREATE INDEX IF NOT EXISTS idx_banners_sort_order ON banners (sort_order);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications (order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);

-- Additional helper indexes or constraints can be added here

-- Trigger to update updated_at timestamp on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger to tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
    'users','categories','menu_items','addresses','orders','order_items','deliveries','notifications')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_update_updated_at ON %I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_%s_update_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()', tbl, tbl);
  END LOOP;
END$$;

-- Ensure existing enum-typed columns (from prior runs or different enum names) are converted safely to the new enum types
DO $$
BEGIN
  -- users.role: convert from any existing enum to enum_users_role via text cast
  BEGIN
    ALTER TABLE users ALTER COLUMN role TYPE enum_users_role USING (role::text::enum_users_role);
  EXCEPTION WHEN others THEN
    -- ignore if conversion fails/column already correct
    NULL;
  END;

  -- orders.status
  BEGIN
    ALTER TABLE orders ALTER COLUMN status TYPE enum_orders_status USING (status::text::enum_orders_status);
  EXCEPTION WHEN others THEN NULL; END;

  -- orders.payment_status
  BEGIN
    ALTER TABLE orders ALTER COLUMN payment_status TYPE enum_orders_payment_status USING (payment_status::text::enum_orders_payment_status);
  EXCEPTION WHEN others THEN NULL; END;

  -- orders.payment_method
  BEGIN
    ALTER TABLE orders ALTER COLUMN payment_method TYPE enum_orders_payment_method USING (payment_method::text::enum_orders_payment_method);
  EXCEPTION WHEN others THEN NULL; END;

  -- deliveries.status
  BEGIN
    ALTER TABLE deliveries ALTER COLUMN status TYPE enum_deliveries_status USING (status::text::enum_deliveries_status);
  EXCEPTION WHEN others THEN NULL; END;

  -- notifications.type
  BEGIN
    ALTER TABLE notifications ALTER COLUMN type TYPE enum_notifications_type USING (type::text::enum_notifications_type);
  EXCEPTION WHEN others THEN NULL; END;
END$$;

-- Some DBs may still have textual defaults that can't be auto-cast to enum types.
-- Drop string defaults first, alter the column type via text cast, then reapply enum defaults with explicit cast.
DO $$
BEGIN
  -- users.role
  BEGIN
    ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE users ALTER COLUMN role TYPE enum_users_role USING (role::text::enum_users_role);
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'::enum_users_role;
    ALTER TABLE users ALTER COLUMN role SET NOT NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- orders.status
  BEGIN
    ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE orders ALTER COLUMN status TYPE enum_orders_status USING (status::text::enum_orders_status);
    ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'::enum_orders_status;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- orders.payment_status
  BEGIN
    ALTER TABLE orders ALTER COLUMN payment_status DROP DEFAULT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE orders ALTER COLUMN payment_status TYPE enum_orders_payment_status USING (payment_status::text::enum_orders_payment_status);
    ALTER TABLE orders ALTER COLUMN payment_status SET DEFAULT 'pending'::enum_orders_payment_status;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- orders.payment_method
  BEGIN
    ALTER TABLE orders ALTER COLUMN payment_method DROP DEFAULT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE orders ALTER COLUMN payment_method TYPE enum_orders_payment_method USING (payment_method::text::enum_orders_payment_method);
    ALTER TABLE orders ALTER COLUMN payment_method SET DEFAULT 'card'::enum_orders_payment_method;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- deliveries.status
  BEGIN
    ALTER TABLE deliveries ALTER COLUMN status DROP DEFAULT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE deliveries ALTER COLUMN status TYPE enum_deliveries_status USING (status::text::enum_deliveries_status);
    ALTER TABLE deliveries ALTER COLUMN status SET DEFAULT 'pending'::enum_deliveries_status;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- notifications.type
  BEGIN
    ALTER TABLE notifications ALTER COLUMN type DROP DEFAULT;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN
    ALTER TABLE notifications ALTER COLUMN type TYPE enum_notifications_type USING (type::text::enum_notifications_type);
  EXCEPTION WHEN OTHERS THEN NULL; END;
END$$;

-- End of migration.sql
