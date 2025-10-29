-- Migration for News and Enhanced Banner System
-- Run this after the main migration.sql

-- Create News table
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url VARCHAR,
  sublinks JSONB,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  author VARCHAR,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_is_published ON news (is_published);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news (published_at);
CREATE INDEX IF NOT EXISTS idx_news_sort_order ON news (sort_order);

-- Update Banners table to support news-linked banners
DO $$
BEGIN
  -- Add banner_type enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_banners_banner_type') THEN
    CREATE TYPE enum_banners_banner_type AS ENUM ('standard', 'news_linked');
  END IF;
END$$;

-- Add new columns to banners table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='banner_type') THEN
    ALTER TABLE banners ADD COLUMN banner_type enum_banners_banner_type DEFAULT 'standard';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='banners' AND column_name='news_id') THEN
    ALTER TABLE banners ADD COLUMN news_id UUID REFERENCES news(id) ON DELETE CASCADE;
  END IF;
END$$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_banners_banner_type ON banners (banner_type);
CREATE INDEX IF NOT EXISTS idx_banners_news_id ON banners (news_id);

-- Add trigger for news updated_at
DROP TRIGGER IF EXISTS trg_news_update_updated_at ON news;
CREATE TRIGGER trg_news_update_updated_at 
  BEFORE UPDATE ON news 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Migration complete
