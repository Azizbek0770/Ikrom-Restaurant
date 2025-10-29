import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Header = () => {
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await axios.get((import.meta.env.VITE_API_BASE_URL || '') + '/settings/site');
        const site = resp?.data?.data?.settings || {};
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const chosen = (prefersDark && site.logo_dark) || (!prefersDark && site.logo_light) || site.logo_url || import.meta.env.VITE_APP_LOGO || '';
        if (mounted) setLogoUrl(chosen);
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
        />
      ) : (
        <div className="w-10 h-10 rounded bg-white/20" />
      )}
      <h1 className="text-xl font-bold">Delivery</h1>
    </div>
  );
};

export default Header;


