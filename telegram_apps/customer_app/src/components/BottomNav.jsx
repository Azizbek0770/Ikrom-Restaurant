import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Newspaper, ShoppingCart, User, Bug } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import { cn } from '@/utils/cn';

const BottomNav = () => {
  const location = useLocation();
  const { getItemCount } = useCartStore();
  const cartItemCount = getItemCount();

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Menu',
      exact: true
    },
    {
      path: '/news',
      icon: Newspaper,
      label: 'News'
    },
    {
      path: '/cart',
      icon: ShoppingCart,
      label: 'Cart',
      badge: cartItemCount
    },
    {
      path: '/profile',
      icon: User,
      label: 'Profile'
    },
    // {
    //   path: '/debug',
    //   icon: Bug,
    //   label: 'Debug'
    // },
  ];

  const isActive = (path, exact) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-bottom z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center px-2 py-0.5 rounded-xl transition-all relative min-w-[60px]',
                active
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', active && 'scale-110')} />
                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-xs mt-0.5 font-medium',
                active && 'font-semibold'
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;