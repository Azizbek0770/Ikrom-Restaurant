import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Header = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [settingsObj, setSettingsObj] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await axios.get((import.meta.env.VITE_API_BASE_URL || '') + '/settings/site');
        // Use local app assets from public/assets
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
    <div className="bg-primary-600 text-white p-4 flex items-center gap-3">
      {logoUrl ? (
        <img
          id="delivery-app-logo"
          src={logoUrl}
          alt="logo"
          className="w-10 h-10 rounded"
          onError={() => console.warn('Delivery logo failed to load:', logoUrl)}
          crossOrigin="anonymous"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-white/20" />
      )}
      {settingsObj && (
        <pre className="hidden sm:block ml-2 text-xs text-white/80 max-w-xs overflow-auto" style={{ maxHeight: 48 }}>
          {JSON.stringify(settingsObj)}
        </pre>
      )}
      <h1 className="text-xl font-bold">Delivery</h1>
    </div>
  );
};

export default Header;


