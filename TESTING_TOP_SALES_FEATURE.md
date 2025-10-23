# Testing Guide - Top Sales Feature

## Quick Test Checklist

### 1. Visual Elements
- [ ] Food images are larger (192px height vs previous 128px)
- [ ] Top 10 items show "TOP 1" through "TOP 10" badges
- [ ] Badges have fire emoji (🔥)
- [ ] Badges have gradient background (amber/orange/red)
- [ ] Badges animate on page load (scale + rotate + fade)
- [ ] Badge is positioned at top-left corner of each card

### 2. Sorting Verification
- [ ] Items are displayed in order of sales count (highest first)
- [ ] "Top Sellers" banner appears above the menu grid
- [ ] Banner shows: "All items sorted by popularity • Top 10 highlighted"

### 3. Category Filtering
- [ ] When "All" is selected: All items shown, sorted by sales
- [ ] When specific category selected: Only that category's items shown
- [ ] Top 10 badges still work for category-filtered views
- [ ] Banner hides when category is selected

### 4. Search Functionality
- [ ] Search bar still works correctly
- [ ] Top badges hide during search (to avoid confusion)
- [ ] Search results are relevant
- [ ] Clearing search restores top badges

### 5. Responsive Behavior
- [ ] Grid displays 2 columns on mobile
- [ ] Images scale properly
- [ ] Badges remain visible and readable
- [ ] Touch interactions work smoothly

### 6. Performance
- [ ] Page loads quickly
- [ ] Animations are smooth (60fps)
- [ ] Infinite scroll still works
- [ ] No lag when scrolling

### 7. Edge Cases
- [ ] What happens if no items have sales_count > 0?
- [ ] What happens with exactly 10 items?
- [ ] What happens with fewer than 10 items?
- [ ] What happens with large sales numbers?

## How to Test

### Option 1: Development Server
```bash
cd /workspace/telegram_apps/customer_app
npm install
npm run dev
```

### Option 2: Production Build
```bash
cd /workspace/telegram_apps/customer_app
npm install
npm run build
npm run preview
```

### Option 3: Docker
```bash
cd /workspace
docker-compose up customer_app
```

## Expected Behavior

### Main Menu View (No Filters)
1. Top banner shows with fire emoji and description
2. All items displayed in 2-column grid
3. First 10 items have animated TOP badges
4. Items are sorted from most sold to least sold
5. Images are prominent and clear

### Category View
1. Banner disappears
2. Only selected category items shown
3. Items still sorted by sales within that category
4. Top 10 badges show for that category's top sellers

### Search View
1. Banner remains visible (if viewing all items)
2. Top badges hidden during search
3. Search results shown instantly
4. Badges reappear when search is cleared

## Sample Test Data

If you need to populate sales_count for testing:

```sql
-- Update some items with sales counts
UPDATE menu_items 
SET sales_count = 150 
WHERE name LIKE '%Pizza%' 
LIMIT 1;

UPDATE menu_items 
SET sales_count = 120 
WHERE name LIKE '%Burger%' 
LIMIT 1;

UPDATE menu_items 
SET sales_count = 100 
WHERE name LIKE '%Pasta%' 
LIMIT 1;

-- Continue for more items...
```

Or use the backend script if available:
```bash
cd /workspace/backend
npm run seed
```

## Visual Verification Points

### Badge Appearance
- **Colors**: Gradient from amber-400 → orange-500 → red-500
- **Size**: Small but readable (text-xs)
- **Position**: Top-left, 8px from edges (top-2 left-2)
- **Shadow**: Orange glow effect
- **Animation**: Bouncy entrance with rotation

### Image Size Comparison
| Before | After |
|--------|-------|
| h-32 (128px) | h-48 (192px) |
| Static | Hover zoom (scale-105) |

### Layout Changes
| Before | After |
|--------|-------|
| "Hot Sales" section | "Top Sellers" banner |
| Featured items separate | All items in one grid |
| Fixed "HOT" badge | Dynamic "TOP N" badge |

## Common Issues & Solutions

### Issue: Badges not showing
**Solution**: Check that items have sales_count > 0 and are properly sorted

### Issue: Animation not working
**Solution**: Clear browser cache, check that style tag is appended

### Issue: Images too large on some screens
**Solution**: Verify aspect-ratio and object-cover are working

### Issue: Top 10 shows wrong items
**Solution**: Verify backend is returning items sorted by sales_count DESC

## Success Criteria

✅ All menu items display with larger, clearer food images  
✅ Top 10 items show animated rank badges  
✅ Items are sorted by sales count (most popular first)  
✅ UI is intuitive and visually appealing  
✅ Performance is smooth on mobile devices  
✅ Search and filtering work correctly  
✅ Animations enhance rather than distract  

## Screenshots to Capture

1. Full menu view showing top 10 badges
2. Close-up of TOP 1 item with badge
3. Category filter applied
4. Search results (without badges)
5. Mobile view (2-column grid)
6. Badge animation sequence (if possible)

## Reporting Issues

If you find any bugs or unexpected behavior:
1. Note the specific action that caused it
2. Check browser console for errors
3. Note device/browser being used
4. Check if issue persists after refresh
5. Document with screenshots if possible
