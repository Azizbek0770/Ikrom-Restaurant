# News and Banner System - Complete Implementation Guide

## 📰 Overview

This document outlines the complete implementation of the News and Banner system across the entire food delivery platform, including backend, customer app, and admin dashboard.

## 🎯 Features Implemented

### 1. News System
- **Full CRUD Operations** for news articles
- **Publish/Unpublish** functionality
- Individual news detail pages accessible from list
- News list page in customer app
- News management in admin dashboard

### 2. Enhanced Banner System
Two types of banners are now supported:

#### Standard Banner
- Consists of: image, title, and description
- Optional external link
- Manual content management

#### News-Linked Banner
- Automatically created from News section
- Uses news article's image, title, and excerpt
- Clicking redirects to news detail page
- Auto-syncs with news publish/unpublish status
- Auto-deleted when linked news is deleted

### 3. Banner Carousel
- Responsive automatic slider on Menu page
- Auto-scrolling every 5 seconds
- Manual navigation (arrows + dots)
- Clickable banners with appropriate actions
- Smooth transitions and animations

---

## 🗄️ Database Schema

### News Table
```sql
CREATE TABLE news (
  id UUID PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url VARCHAR,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  author VARCHAR,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Updated Banners Table
```sql
ALTER TABLE banners ADD COLUMN banner_type enum_banners_banner_type DEFAULT 'standard';
ALTER TABLE banners ADD COLUMN news_id UUID REFERENCES news(id) ON DELETE CASCADE;
```

**Banner Types:**
- `standard`: Traditional banner with manual content
- `news_linked`: Banner linked to a news article

---

## 🔌 Backend API Endpoints

### Public Endpoints

#### Get Published News
```
GET /api/news
Response: { success: true, data: { news: [...] } }
```

#### Get Single News
```
GET /api/news/:id
Response: { success: true, data: { news: {...} } }
```

#### Get Active Banners
```
GET /api/banners
Response: { success: true, data: { banners: [...] } }
```

### Admin Endpoints

#### News Management
```
GET    /api/news/admin/all           - List all news
POST   /api/news/admin/create        - Create news
PUT    /api/news/admin/:id           - Update news
DELETE /api/news/admin/:id           - Delete news
PATCH  /api/news/admin/:id/toggle-publish - Toggle publish status
```

#### Banner Management
```
GET    /api/admin/banners            - List all banners
POST   /api/admin/banners            - Create banner
PUT    /api/admin/banners/:id        - Update banner
DELETE /api/admin/banners/:id        - Delete banner
```

---

## 📱 Customer App Implementation

### Routes
- `/news` - News list page
- `/news/:id` - News detail page

### Components

#### News List Page (`/pages/News.jsx`)
- Displays all published news
- Click to view full article
- Shows publication date
- Empty state when no news

#### News Detail Page (`/pages/NewsDetail.jsx`)
- Full news article view
- Back navigation
- Author and date display
- Featured image

#### Banner Carousel (`Menu.jsx`)
- Auto-rotating banner slider
- Manual navigation controls
- Clickable banners:
  - News-linked → Navigate to `/news/:id`
  - Standard → Open external link

---

## 🖥️ Admin Dashboard Implementation

### News Management (`/admin/news`)

Features:
- Create, edit, delete news articles
- Publish/unpublish toggle
- Rich content editor (textarea)
- Image upload
- **"Add to banner too" checkbox** - Creates news-linked banner automatically

Form Fields:
- Title (required)
- Excerpt (optional, shown in list/banner)
- Content (required, full article)
- Image (optional)
- Author (optional)
- Publish status
- Add to banner checkbox

### Banner Management (`/admin/banners`)

Features:
- Create, edit, delete banners
- Reorder banners (up/down arrows)
- Toggle active/inactive status
- **Banner type selection**:
  - Standard: Manual content entry
  - News-Linked: Select from published news

---

## 🔄 Synchronization Logic

The system maintains data consistency through automatic synchronization:

### When News is Deleted
→ All linked banners are automatically deleted (CASCADE)

### When News is Unpublished
→ Linked banner is automatically deactivated

### When News is Published Again
→ Linked banner is automatically reactivated

### When "Add to banner" is Checked
- If banner exists → Updates it
- If no banner → Creates new news-linked banner

### When "Add to banner" is Unchecked
→ Existing news-linked banner is removed

---

## 📝 Models & Associations

### Backend Models (`/backend/src/models/`)

**News Model** (`News.js`)
- Fields: id, title, content, excerpt, image_url, is_published, published_at, author, sort_order

**Banner Model** (`Banner.js`)
- Fields: id, title, subtitle, image_url, link, banner_type, news_id, sort_order, is_active

**Associations:**
```javascript
News.hasMany(Banner, { foreignKey: 'news_id', as: 'banners' });
Banner.belongsTo(News, { foreignKey: 'news_id', as: 'news' });
```

---

## 🚀 Deployment & Migration

### Step 1: Run SQL Migration
```bash
cd backend
psql $DATABASE_URL -f sql/news_and_banner_migration.sql
```

This creates:
- `news` table
- Updates `banners` table with new columns
- Creates necessary indexes

### Step 2: Restart Backend
```bash
cd backend
npm install
npm start
```

### Step 3: Rebuild Frontend Apps
```bash
# Customer App
cd telegram_apps/customer_app
npm install
npm run build

# Admin Dashboard
cd admin_dashboard
npm install
npm run build
```

---

## 🧪 Testing Checklist

### Backend
- [ ] Create news via admin API
- [ ] Publish/unpublish news
- [ ] Create standard banner
- [ ] Create news-linked banner
- [ ] Delete news (verify cascade to banners)
- [ ] Fetch published news from public endpoint

### Customer App
- [ ] View news list at `/news`
- [ ] Click news item → Navigate to detail page
- [ ] View banner carousel on menu page
- [ ] Click news-linked banner → Navigate to news detail
- [ ] Auto-scroll works (5 seconds)
- [ ] Manual navigation arrows work

### Admin Dashboard
- [ ] Access News page from sidebar
- [ ] Create new news article
- [ ] Check "Add to banner" → Verify banner created
- [ ] Edit news → Update linked banner
- [ ] Unpublish news → Verify banner deactivated
- [ ] Delete news → Verify banner removed
- [ ] Create standard banner
- [ ] Create news-linked banner from dropdown
- [ ] Reorder banners

---

## 🎨 UI/UX Features

### Customer App
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Respects user theme preference
- **Smooth Animations**: Carousel transitions, hover effects
- **Loading States**: Skeleton screens while data loads
- **Empty States**: Friendly messages when no content

### Admin Dashboard
- **Intuitive Forms**: Clear labels and validation
- **Visual Feedback**: Toast notifications for actions
- **Type Indicators**: Badge showing banner type
- **Status Toggles**: Quick publish/unpublish buttons
- **Reordering**: Drag-free up/down arrow controls

---

## 📦 File Structure

```
backend/
├── src/
│   ├── models/
│   │   ├── News.js                 # News model
│   │   ├── Banner.js               # Updated banner model
│   │   └── index.js                # Model associations
│   ├── controllers/
│   │   ├── newsController.js       # News CRUD logic
│   │   └── bannerController.js     # Updated banner logic
│   └── routes/
│       ├── newsRoutes.js           # News API routes
│       └── index.js                # Main router
└── sql/
    └── news_and_banner_migration.sql  # Database migration

telegram_apps/customer_app/src/
├── pages/
│   ├── News.jsx                    # News list page
│   ├── NewsDetail.jsx              # News detail page
│   └── Menu.jsx                    # Updated with carousel
└── router.jsx                      # Updated routes

admin_dashboard/src/
├── pages/
│   ├── News.jsx                    # News CRUD page
│   └── Banners.jsx                 # Updated banners page
├── components/layout/
│   └── Sidebar.jsx                 # Added News menu
├── services/
│   └── api.js                      # Added newsAPI
└── router.jsx                      # Added news route
```

---

## 🔐 Security Notes

- All admin endpoints require authentication
- Only users with `admin` role can manage news/banners
- Public endpoints only return published content
- SQL injection prevention via Sequelize ORM
- XSS protection via React's built-in escaping

---

## 🐛 Troubleshooting

### Banner not showing on Menu page
- Check banner `is_active` is true
- Verify image URL is accessible
- Check browser console for errors

### News not appearing in customer app
- Verify news is published (`is_published = true`)
- Check `published_at` field is set
- Ensure API endpoint is accessible

### News-linked banner not working
- Verify news article is published
- Check `news_id` foreign key is valid
- Ensure banner `banner_type` is 'news_linked'

### Admin can't create news
- Check authentication token is valid
- Verify user role is 'admin'
- Check all required fields are filled

---

## 🎯 Future Enhancements (Optional)

- [ ] Rich text editor for news content (WYSIWYG)
- [ ] News categories/tags
- [ ] Comments on news articles
- [ ] Push notifications for new news
- [ ] Banner analytics (click tracking)
- [ ] Scheduled publishing
- [ ] Multiple images per news article
- [ ] News search and filtering

---

## 📞 Support

For issues or questions about this implementation, refer to:
- Backend API documentation
- Component documentation in code comments
- Database schema in migration files

---

**Implementation Date:** 2025-10-23
**Version:** 1.0.0
**Status:** ✅ Complete
