import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Menu from './pages/Menu';
import News from './pages/News';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrdersDetails';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';
import Debug from './pages/Debug';

// Determine basename for SPA routing. Prefer explicit Vite env, otherwise detect common Telegram subpath.
const envBase = import.meta.env.VITE_BASE_PATH;
let basename = '/';
if (envBase) basename = envBase;
else if (typeof window !== 'undefined') {
  // If the app is served under /customer (Telegram WebApp), use that as basename
  if (window.location.pathname.startsWith('/customer')) basename = '/customer';
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Menu />
      },
      {
        path: 'news',
        element: <News />
      },
      {
        path: 'cart',
        element: <Cart />
      },
      {
        path: 'checkout',
        element: <Checkout />
      },
      {
        path: 'orders',
        element: <Orders />
      },
      {
        path: 'orders/:orderId',
        element: <OrderDetails />
      },
      {
        path: 'profile',
        element: <Profile />
      },
      {
        path: 'addresses',
        element: <Addresses />
      },
      {
        path: 'debug',
        element: <Debug />
      }
    ]
  }
], { basename });

export default router;