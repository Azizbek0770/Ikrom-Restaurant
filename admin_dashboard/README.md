# Food Delivery Admin Dashboard

React-based admin dashboard for managing the food delivery platform.

## Features

- 📊 Real-time Dashboard with Statistics
- 🍔 Menu & Category Management
- 📦 Order Management & Tracking
- 🚗 Delivery Monitoring
- 👥 User Management
- 🔔 Real-time Notifications via Socket.IO
- 📱 Responsive Design

## Tech Stack

- React 18
- React Router v6
- TanStack Query (React Query)
- Zustand (State Management)
- Tailwind CSS
- Socket.IO Client
- Recharts (Charts)
- Axios

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Food Delivery Admin
```

### 3. Start Development Server
```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

## Default Login Credentials
```
Email: admin@restaurant.com
Password: Admin@123456
```

## Project Structure
```
admin_dashboard/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   │   ├── layout/      # Layout components
│   │   └── ui/          # UI components
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── store/           # State management
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Root component
│   ├── main.jsx         # Entry point
│   └── router.jsx       # Route configuration
├── index.html
├── package.json
└── vite.config.js
```

## Available Routes

- `/` - Dashboard
- `/categories` - Category Management
- `/menu` - Menu Management
- `/orders` - Order Management
- `/deliveries` - Delivery Monitoring
- `/login` - Admin Login

## Features by Page

### Dashboard
- Total orders statistics
- Revenue overview
- Active deliveries count
- Order status distribution chart
- Recent orders list

### Categories
- View all categories
- Create new category
- Edit category details
- Delete category
- Multi-language support (EN, UZ, RU)

### Menu
- View all menu items
- Filter by category
- Create new item
- Edit item details
- Toggle availability
- Delete item
- Multi-language support

### Orders
- View all orders
- Filter by status/payment status
- Real-time order updates
- View detailed order information
- Update order status
- Track delivery

### Deliveries
- Monitor active deliveries
- View delivery statistics
- Track delivery partners
- View delivery status

## Real-time Updates

The dashboard uses Socket.IO for real-time updates:
- New order notifications
- Order status changes
- Delivery updates

## API Integration

All API calls are handled through centralized services in `/src/services/api.js`:
- Automatic token refresh
- Error handling
- Request/response interceptors

## State Management

Using Zustand for global state:
- Authentication state
- User data
- Socket connection

## Styling

Tailwind CSS with custom configuration:
- Custom color palette
- Responsive design
- Dark mode ready

## License

MIT