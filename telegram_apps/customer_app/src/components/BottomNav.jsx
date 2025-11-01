import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Newspaper, ShoppingCart, User } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import useAuthStore from '@/store/authStore'; // <-- add this to get the current user
import { cn } from '@/utils/cn';

const BottomNav = () => {
  const location = useLocation();
  const { getItemCount } = useCartStore();
  const { user } = useAuthStore(); // <-- get logged-in user
  const cartItemCount = getItemCount();

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Menu',
      exact: true,
    },
    {
      path: '/news',
      icon: Newspaper,
      label: 'News',
    },
    {
      path: '/cart',
      icon: ShoppingCart,
      label: 'Cart',
      badge: cartItemCount,
    },
    {
      path: '/profile',
      icon: 'profile',
      label: 'Profile',
    },
  ];

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          const Icon = item.icon !== 'profile' ? item.icon : null;

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
              <div className="relative flex items-center justify-center">
                {item.icon === 'profile' ? (
                  user && user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.first_name || 'User'}
                      className={cn(
                        'w-6 h-6 rounded-full object-cover border border-gray-300 dark:border-gray-700',
                        active && 'scale-110 border-primary-500'
                      )}
                    />
                  ) : (
                    <User className={cn('w-5 h-5', active && 'scale-110')} />
                  )
                ) : (
                  <Icon className={cn('w-5 h-5', active && 'scale-110')} />
                )}

                {item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              <span
                className={cn(
                  'text-xs mt-0.5 font-medium',
                  active && 'font-semibold'
                )}
              >
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
