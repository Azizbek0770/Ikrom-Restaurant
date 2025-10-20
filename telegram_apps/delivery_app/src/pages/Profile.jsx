import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, History, HelpCircle, LogOut } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import telegramService from '@/services/telegram';

const Profile = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    telegramService.showBackButton(() => {
      navigate('/');
    });

    return () => {
      telegramService.hideBackButton();
    };
  }, [navigate]);

  const menuItems = [
    {
      icon: History,
      label: 'Delivery History',
      onClick: () => navigate('/history')
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      onClick: () => {
        telegramService.openTelegramLink('https://t.me/support');
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4">
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {/* User Info */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.first_name}
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <User className="w-8 h-8 text-primary-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-600 capitalize">{user?.role}</p>
            {user?.phone && (
              <p className="text-sm text-gray-500 mt-1">{user.phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              telegramService.hapticImpact('light');
              item.onClick();
            }}
            className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex items-center space-x-3"
          >
            <item.icon className="w-6 h-6 text-gray-600" />
            <span className="flex-1 text-left font-medium text-gray-900">
              {item.label}
            </span>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>

      {/* App Info */}
      <div className="p-4 mt-8">
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            Delivery Partner App v1.0.0
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Made with ❤️ for Telegram
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;