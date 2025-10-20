import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Categories from './pages/Categories';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Deliveries from './pages/Deliveries';
import Users from './pages/Users';
import useAuthStore from './store/authStore';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'categories',
        element: <Categories />
      },
      {
        path: 'menu',
        element: <Menu />
      },
      {
        path: 'orders',
        element: <Orders />
      },
      {
        path: 'deliveries',
        element: <Deliveries />
      }
      ,
      {
        path: 'users',
        element: <Users />
      }
      ,
      {
        path: 'banners',
        element: React.createElement(React.lazy(() => import('./pages/Banners')))
      }
    ]
  }
]);

export default router;