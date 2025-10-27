import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import router from './router';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import telegramService from './services/telegram';
import './loader.css'; // 👈 import the CSS file below

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  const { authenticate, isLoading } = useAuthStore();
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    telegramService.init();
    authenticate();
  }, [authenticate, initTheme]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
          <div className="icon-wrapper mb-4">
            {/* <span className="loader-icon text-5xl animate-breath">🍽️</span> */}
          </div>
          <h1 className="loader-title text-[1.5rem] text-gray-700 font-semibold dark:text-gray-100 tracking-wide mb-1">
            Ikrom Shashlikda
          </h1>
  
          <div className="word-carousel">
            <span className="word"> Mazzali taomlar 🥘</span>
            <span className="word"> Sara ichimliklar 🍹</span>
            <span className="word"> To‘yimli shashliklar 🍖</span>
            <span className="word"> Muomilali ishchilar 👨‍🍳🤵</span>
            <span className="word"> Yetkazib berish 🚗</span>
          </div>
        </div>
    );
  }  
  return <QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider>;
}
export default App;
