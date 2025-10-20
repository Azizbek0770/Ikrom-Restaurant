import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, MapPin, ShoppingBag, ChevronRight, Camera } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import telegramService from '@/services/telegram';
import ImageUpload from '@/components/ImageUpload';
import { cn } from '@/utils/cn';
import { usersAPI } from '@/services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => usersAPI.update(user.id, data),
    onSuccess: (response) => {
      // Update the user in the auth store
      useAuthStore.getState().setUser(response.data.data.user);
      queryClient.invalidateQueries(['user']);
      toast.success('Profile updated successfully');
      setIsEditingPhoto(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });

  const handlePhotoChange = (avatarUrl) => {
    updateProfileMutation.mutate({ avatar_url: avatarUrl });
  };

  const menuItems = [
    {
      icon: ShoppingBag,
      label: 'My Orders',
      description: 'View order history',
      onClick: () => navigate('/orders')
    },
    {
      icon: MapPin,
      label: 'Delivery Addresses',
      description: 'Manage saved addresses',
      onClick: () => navigate('/addresses')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.first_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <button
              onClick={() => setIsEditingPhoto(!isEditingPhoto)}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 dark:bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user?.first_name} {user?.last_name}
            </h2>
            {user?.phone && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{user.phone}</p>
            )}
            {user?.email && (
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            )}
          </div>
        </div>

        {/* Photo Upload Section */}
        {isEditingPhoto && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-center">
              <ImageUpload
                value={user?.avatar_url || ''}
                onChange={handlePhotoChange}
                type="avatars"
                className="text-center"
                uploadUrl={`/api/upload/avatars/${user?.id}`}
              />
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setIsEditingPhoto(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
          Account
        </h3>
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                telegramService.hapticImpact('light');
                item.onClick();
              }}
              className="w-full bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all flex items-center space-x-4 group"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-primary-50 dark:bg-primary-900/20 rounded-xl group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                <item.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {item.label}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className="p-4 mt-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-800">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🍽️</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {import.meta.env.VITE_APP_NAME || 'Food Delivery App'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Version 1.0.0
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
            Made with ❤️ for Telegram
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;