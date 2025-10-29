-- Migration: add settings table and sublinks column to news
BEGIN;

-- Create settings table if missing
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR NOT NULL UNIQUE,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add sublinks column to news if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='sublinks'
  ) THEN
    ALTER TABLE news ADD COLUMN sublinks JSONB;
  END IF;
END$$;

COMMIT;


