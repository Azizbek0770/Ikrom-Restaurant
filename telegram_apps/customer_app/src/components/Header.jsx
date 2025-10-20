import React from 'react';
import { Moon, Sun } from 'lucide-react';
import useThemeStore from '@/store/themeStore';
import telegramService from '@/services/telegram';

const Header = () => {
  const { theme, toggleTheme } = useThemeStore();

  const handleThemeToggle = () => {
    telegramService.hapticImpact('light');
    toggleTheme();
  };

  return (
    <header
      className="
        sticky top-0 z-50 
        backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 
        border-b border-gray-200/70 dark:border-gray-800/70 
        shadow-sm transition-all duration-300
        supports-[backdrop-filter]:backdrop-blur-md
      "
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div
            className="
              w-10 h-10 rounded-xl flex items-center justify-center 
              bg-gradient-to-br from-indigo-500 to-indigo-600 
              dark:from-indigo-600 dark:to-indigo-700 
              shadow-md shadow-indigo-500/20 dark:shadow-indigo-900/30 
              transition-transform duration-300 hover:scale-105
            "
          >
            <span className="text-white text-xl font-bold select-none">🍽️</span>
          </div>

          <div className="leading-tight select-none">
            <h1
              className="
                text-base sm:text-lg font-semibold 
                text-gray-900 dark:text-gray-100 tracking-tight
              "
            >
              {import.meta.env.VITE_APP_NAME || 'Food Delivery'}
            </h1>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              Order delicious food easily 🍱
            </p>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          aria-label="Toggle theme"
          className="
            relative p-2.5 rounded-xl 
            bg-gray-100/80 dark:bg-gray-800/70 
            hover:bg-gray-200 dark:hover:bg-gray-700 
            transition-all duration-300 ease-out 
            shadow-inner
          "
        >
          <div
            key={theme}
            className="
              animate-fadeRotate 
              transition-transform duration-500
            "
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400 drop-shadow-sm" />
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

export default Header;
