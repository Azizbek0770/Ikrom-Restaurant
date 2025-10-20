import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DeliveryDetails from './pages/DeliveryDetails';
import History from './pages/History';
import Profile from './pages/Profile';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/delivery/:deliveryId',
    element: <DeliveryDetails />
  },
  {
    path: '/history',
    element: <History />
  },
  {
    path: '/profile',
    element: <Profile />
  }
]);

export default router;