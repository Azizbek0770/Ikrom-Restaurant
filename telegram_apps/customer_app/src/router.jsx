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
      }
    ]
  }
]);

export default router;