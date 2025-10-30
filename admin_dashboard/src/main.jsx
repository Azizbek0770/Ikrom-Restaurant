import React, { startTransition } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import router from './router';
import './index.css';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Ensure auth check runs once on app start so ProtectedRoute isn't stuck in loading */}
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
);

function AuthInitializer({ children }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Run auth check as a non-urgent transition to avoid suspending during sync input
    try {
      startTransition(() => {
        checkAuth();
      });
    } catch (e) {
      // Fallback if startTransition not available
      checkAuth();
    }
  }, [checkAuth]);

  return children;
}