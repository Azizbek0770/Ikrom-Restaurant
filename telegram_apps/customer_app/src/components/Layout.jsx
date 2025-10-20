import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import useThemeStore from '@/store/themeStore';

const Layout = () => {
  const { initTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme on mount
    initTheme();
  }, [initTheme]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Sticky Header */}
      <Header />

      {/* Main Content Area */}
      <main className="pb-20 pt-0">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Layout;