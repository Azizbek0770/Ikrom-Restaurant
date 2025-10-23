# Sales Count Feature Update

## Overview
This update adds a sales tracking system that automatically sorts menu items by popularity (most sold items appear first).

## Changes Made

### Backend Changes

1. **MenuItem Model** (`backend/src/models/MenuItem.js`)
   - Added `sales_count` field to track total quantity sold for each menu item
   - Added index on `sales_count` for better query performance

2. **Menu Controller** (`backend/src/controllers/menuController.js`)
   - Updated `getMenuItems` to sort by `sales_count DESC` (highest sales first)
   - Items are now sorted by: sales_count → sort_order → name

3. **Order Controller** (`backend/src/controllers/orderController.js`)
   - When an order is confirmed, the `sales_count` for each menu item is automatically incremented
   - Uses atomic increment operation to prevent race conditions

4. **Database Migration** (`backend/sql/add_sales_count.sql`)
   - Adds `sales_count` column to `menu_items` table
   - Creates index for performance
   - Calculates initial sales count from existing orders

### Frontend Changes

1. **Customer App UI** (`telegram_apps/customer_app/src/index.css`)
   - Removed all scrollbars (vertical and horizontal) for a cleaner look
   - Maintained full scroll functionality

2. **Menu Page** (`telegram_apps/customer_app/src/pages/Menu.jsx`)
   - Items now automatically sorted by popularity
   - Top 6 items with sales > 0 show a "🔥 HOT" badge
   - Added "Most Popular Items" section header
   - Removed separate "Hot Sales" section (no longer needed since all items are sorted by sales)

## How to Apply the Migration

### Option 1: Using npm script (Recommended)
```bash
cd backend
npm run migrate:sales-count
```

### Option 2: Using psql directly
```bash
cd backend
psql -h localhost -U postgres -d food_delivery -f sql/add_sales_count.sql
```

### Option 3: Docker environment
```bash
docker-compose exec backend npm run migrate:sales-count
```

## How It Works

1. **Initial Setup**: The migration calculates existing sales from order history
2. **Ongoing Updates**: When an order is confirmed, sales_count automatically increments
3. **Menu Display**: Items are fetched sorted by sales_count, so the most popular items appear first
4. **Visual Indicators**: The top 6 selling items display a "🔥 HOT" badge

## Testing

After applying the migration:

1. Check menu items are sorted correctly:
   ```sql
   SELECT name, sales_count FROM menu_items ORDER BY sales_count DESC LIMIT 10;
   ```

2. Confirm an order through the admin dashboard
3. Verify the sales_count increases for the ordered items
4. Check the customer app shows items in the correct order

## Benefits

- **Improved UX**: Customers see popular items first
- **Better Engagement**: Hot items are visually highlighted
- **Performance**: Indexed sorting ensures fast queries
- **Automatic**: No manual intervention needed
- **Clean UI**: No annoying scrollbars

## Notes

- Sales count only increases when orders are **confirmed** (not just created)
- The count tracks total quantity sold, not number of orders
- Items with 0 sales appear after items with sales (sorted by sort_order and name)
