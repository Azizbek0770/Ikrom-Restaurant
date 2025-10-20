import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingBag, 
  Truck, 
  Users,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '@/utils/cn';
import useAuthStore from '@/store/authStore';

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Categories', href: '/categories', icon: UtensilsCrossed },
    { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
    { name: 'Banners', href: '/banners', icon: Settings },
    { name: 'Orders', href: '/orders', icon: ShoppingBag },
    { name: 'Deliveries', href: '/deliveries', icon: Truck },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings }
  ];

  return (
    <div className="flex flex-col w-64 bg-gray-900 h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-gray-800">
        <h1 className="text-xl font-bold text-white">
          {import.meta.env.VITE_APP_NAME}
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-800">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;