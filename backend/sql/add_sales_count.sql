-- Add sales_count column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_menu_items_sales_count ON menu_items(sales_count DESC);

-- Update sales_count based on existing orders (initial calculation)
UPDATE menu_items m
SET sales_count = COALESCE((
  SELECT SUM(oi.quantity)
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE oi.menu_item_id = m.id
    AND o.status IN ('pending', 'preparing', 'ready', 'out_for_delivery', 'delivered')
), 0);

-- Add comment to the column
COMMENT ON COLUMN menu_items.sales_count IS 'Total number of times this item has been ordered';
