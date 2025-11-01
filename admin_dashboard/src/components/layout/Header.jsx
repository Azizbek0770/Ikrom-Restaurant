import React, { useEffect, useState } from 'react';
import { Bell, User } from 'lucide-react';
import useAuthStore from '@/store/authStore';
import axios from 'axios';

const Header = () => {
  const user = useAuthStore((state) => state.user);
  const [logoUrl, setLogoUrl] = useState('');
  const [settingsObj, setSettingsObj] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
    const resp = await axios.get((import.meta.env.VITE_API_BASE_URL || '') + '/settings/site');
        // Always use local app assets from public/assets (traditional approach)
        const base = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
        const localLogo = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? `${base}/assets/logo_dark.png`
          : `${base}/assets/logo_light.png`;
        if (mounted) {
          setLogoUrl(localLogo);
          setSettingsObj(resp?.data?.data?.settings || {});
        }
      } catch (err) { }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 h-16 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex-1 flex items-center gap-4">
          {logoUrl ? (
            <img
              id="admin-logo-img"
              src={logoUrl}
              alt="logo"
              className="w-8 h-8 rounded"
              onError={() => {
                console.warn('Admin logo failed to load:', logoUrl);
              }}
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-100" />
          )}
          {/* Debug: show current settings received from server (dev only) */}
          {settingsObj && (
            <pre className="ml-2 text-xs text-gray-500 max-w-lg overflow-auto" style={{ maxHeight: 48 }}>
              {JSON.stringify(settingsObj)}
            </pre>
          )}
          {/* Search or breadcrumbs can go here */}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;