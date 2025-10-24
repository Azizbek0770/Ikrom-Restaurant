# Quick News System Testing Guide

## 🎯 Quick Verification Steps

### Step 1: Verify Database Schema
```bash
# Connect to your database and verify tables exist:
psql -U <username> -d <database> -c "\dt news"
psql -U <username> -d <database> -c "\d news"
psql -U <username> -d <database> -c "\d banners"
```

**Expected:** Both tables should exist with all the required columns.

---

### Step 2: Test Backend API

#### Test Public News Endpoint:
```bash
# Should return empty array or list of published news
curl http://localhost:5000/api/news
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "news": []
  }
}
```

#### Test Banners Endpoint:
```bash
# Should return empty array or list of active banners
curl http://localhost:5000/api/banners
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "banners": []
  }
}
```

---

### Step 3: Create First News Article

1. **Open Admin Dashboard**: Navigate to `http://localhost:3000` (or your admin URL)
2. **Login** with admin credentials
3. **Go to News section** (check if it's in the sidebar navigation)
4. **Click "Add News"**
5. **Fill in the form:**
   ```
   Title: "Welcome to Our Restaurant!"
   Excerpt: "Check out our amazing menu and special offers"
   Content: "We're excited to announce our new restaurant is now open! 
             Come visit us for the best food in town. Check out our 
             amazing menu with fresh ingredients and daily specials."
   Author: "Restaurant Manager"
   Image: Upload any food image
   ✓ Check "Publish immediately"
   ✓ Check "Add to banner carousel"
   ```
6. **Click "Save"**

**Expected:** 
- Toast notification: "Saved"
- News appears in the news list
- Status shows "✓ Published"

---

### Step 4: Verify in Customer App

#### A. Check News List:
1. Open Customer App: `http://localhost:5173` (or your customer app URL)
2. Click **"News"** tab in bottom navigation
3. **Expected:**
   - News article appears in the list
   - Shows image, title, excerpt, and published date
   - Card is clickable

#### B. Check News Detail:
1. Click on the news article card
2. **Expected:**
   - Opens detail page `/news/:id`
   - Shows full image at top
   - Title, author, published date visible
   - Full content displayed
   - Back button works

#### C. Check Banner Carousel:
1. Navigate to **Menu** page (Home tab)
2. Look at the top section
3. **Expected:**
   - Banner carousel appears
   - Shows the news article as a banner
   - Title and excerpt visible as overlay
   - Image displays correctly

#### D. Test Banner Navigation:
1. On Menu page, **click the banner**
2. **Expected:**
   - Navigates to `/news/:id`
   - Opens the same news detail page
   - All content displays correctly

---

### Step 5: Test Full CRUD Flow

#### Create Multiple News:
1. In Admin Panel, create 2-3 more news articles
2. Some with "add to banner" checked, some without
3. **Expected:**
   - All appear in news list
   - Only those with "add to banner" appear in carousel

#### Edit News:
1. Click "Edit" on any news article
2. Change title and content
3. **Expected:**
   - Changes appear immediately in customer app
   - If linked to banner, banner updates too

#### Unpublish News:
1. Click "Unpublish" button on published news
2. **Expected:**
   - Status changes to "Unpublished"
   - Disappears from customer app news list
   - Banner becomes inactive (disappears from carousel)

#### Re-publish News:
1. Click "Publish" button on unpublished news
2. **Expected:**
   - Status changes to "✓ Published"
   - Reappears in customer app news list
   - Banner reactivates (appears in carousel)

#### Delete News:
1. Click "Delete" on any news
2. Confirm deletion
3. **Expected:**
   - Removed from admin list
   - Disappears from customer app
   - Linked banner auto-deleted from carousel

---

## 🐛 Troubleshooting

### Issue: News API returns 404

**Check:**
```bash
# Verify routes are mounted
curl http://localhost:5000/api/debug
```

**Solution:** Ensure backend server is running and routes are properly mounted in `app.js`.

---

### Issue: News list is empty in customer app

**Check:**
1. Are there published news in database?
   ```sql
   SELECT id, title, is_published FROM news;
   ```
2. Is customer app hitting the correct API?
   - Check browser console for errors
   - Check Network tab for API calls

**Solution:** 
- Ensure `VITE_API_BASE_URL` env var is set correctly in customer app
- Verify news are published (`is_published = true`)

---

### Issue: Banner click doesn't navigate

**Check:**
1. Inspect banner data in browser console:
   ```javascript
   // On Menu page, check banners data structure
   console.log(banners);
   ```
2. Verify banner has `banner_type: 'news_linked'` and `news_id`

**Solution:**
- Ensure banner was created with news link
- Check banner controller returns `news_id` field
- Verify router has `/news/:id` route configured

---

### Issue: Banner doesn't show after creating news with "add to banner"

**Check:**
1. Verify in database:
   ```sql
   SELECT * FROM banners WHERE news_id = '<your-news-id>';
   ```
2. Check banner is active:
   ```sql
   SELECT is_active FROM banners WHERE news_id = '<your-news-id>';
   ```

**Solution:**
- Ensure news is published
- Check banner controller's `getActiveBanners` includes news data
- Verify `is_active = true` on banner

---

## ✅ Success Criteria

Your news system is working correctly if:

- [x] Admin can create news articles
- [x] Admin can publish/unpublish news
- [x] Admin can delete news
- [x] Admin can toggle "add to banner"
- [x] Published news appear in customer app news list
- [x] Clicking news card opens detail page
- [x] News-linked banners appear in carousel
- [x] Clicking banner opens correct news article
- [x] Banner carousel auto-slides
- [x] Manual banner navigation works
- [x] Deleting news removes linked banner
- [x] Unpublishing news hides banner

---

## 🎨 Visual Verification

### Expected Customer App Views:

**News List Page** (`/news`):
```
┌────────────────────────────────┐
│  News & Updates                │
│  Stay updated with...          │
├────────────────────────────────┤
│ ┌──────────────────────────┐   │
│ │     [News Image]         │   │
│ │  Welcome to Our...       │   │
│ │  Check out our...        │   │
│ │  📅 Oct 24, 2025     →   │   │
│ └──────────────────────────┘   │
│ ┌──────────────────────────┐   │
│ │     [News Image]         │   │
│ │  Summer Sale...          │   │
│ │  50% off all...          │   │
│ │  📅 Oct 23, 2025     →   │   │
│ └──────────────────────────┘   │
└────────────────────────────────┘
```

**News Detail Page** (`/news/:id`):
```
┌────────────────────────────────┐
│ ← News                         │
├────────────────────────────────┤
│ ┌──────────────────────────┐   │
│ │  [Full Width Image]      │   │
│ └──────────────────────────┘   │
│                                │
│ Welcome to Our Restaurant!     │
│                                │
│ 📅 Oct 24, 2025  👤 Manager    │
│ ─────────────────────────────  │
│                                │
│ We're excited to announce      │
│ our new restaurant is now      │
│ open! Come visit us for the    │
│ best food in town...           │
│                                │
└────────────────────────────────┘
```

**Banner Carousel** (on Menu page):
```
┌────────────────────────────────┐
│ ┌──────────────────────────┐   │
│ │  [Banner Image]          │   │
│ │                          │   │
│ │  ◀  ●●○  ▶              │   │
│ │                          │   │
│ │  Welcome to Our...       │   │
│ │  Check out our amazing...│   │
│ └──────────────────────────┘   │
└────────────────────────────────┘
```

---

## 📝 Sample Test Data

Create these news articles for comprehensive testing:

### News 1: With Banner
```
Title: "Welcome to Our Restaurant!"
Excerpt: "Check out our amazing menu and special offers"
Content: "Full welcome message with details about your restaurant..."
Author: "Restaurant Manager"
✓ Publish
✓ Add to Banner
```

### News 2: With Banner
```
Title: "Summer Sale - 50% Off!"
Excerpt: "Get amazing discounts on all pizzas this week"
Content: "Limited time offer! All pizzas are 50% off..."
Author: "Marketing Team"
✓ Publish
✓ Add to Banner
```

### News 3: Without Banner
```
Title: "New Menu Items Added"
Excerpt: "Try our delicious new pasta dishes"
Content: "We've expanded our menu with amazing pasta options..."
Author: "Chef"
✓ Publish
☐ Add to Banner (unchecked)
```

### News 4: Draft (Unpublished)
```
Title: "Coming Soon: Breakfast Menu"
Excerpt: "Stay tuned for our new breakfast offerings"
Content: "We're working on an exciting breakfast menu..."
Author: "Chef"
☐ Publish (unchecked)
☐ Add to Banner
```

**Expected Results:**
- Customer app news list shows: News 1, 2, 3 (published only)
- Banner carousel shows: News 1, 2 (has "add to banner")
- News 4 only visible in admin panel (draft)

---

## 🚀 Quick Start Command

```bash
# Terminal 1: Start Backend
cd /workspace/backend
npm start

# Terminal 2: Start Admin Dashboard
cd /workspace/admin_dashboard
npm run dev

# Terminal 3: Start Customer App
cd /workspace/telegram_apps/customer_app
npm run dev

# Open in browser:
# - Admin: http://localhost:3000
# - Customer: http://localhost:5173
# - API: http://localhost:5000/api
```

---

## 🎉 You're All Set!

If all tests pass, your news system is fully operational and ready for production use!

**Happy testing! 🎊**
