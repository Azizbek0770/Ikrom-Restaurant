import React, { useEffect, useState } from 'react';
import telegramService from '@/services/telegram';

const Debug = () => {
  const [info, setInfo] = useState({});

  useEffect(() => {
    const gather = async () => {
      const location = typeof window !== 'undefined' ? window.location.href : null;
      const referrer = typeof document !== 'undefined' ? document.referrer : null;
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : null;
      const tgUser = telegramService.getUser();

      let backendConfig = null;
      let fetchError = null;
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const cfgUrl = apiBase.replace(/\/$/, '') + '/webhooks/config';
        
        console.log('[Debug] Fetching config from:', cfgUrl);
        const resp = await fetch(cfgUrl, { 
          credentials: 'include',
          mode: 'cors',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('[Debug] Response status:', resp.status, resp.statusText);
        
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
        }
        
        backendConfig = await resp.json();
        console.log('[Debug] Config loaded:', backendConfig);
      } catch (err) {
        console.error('[Debug] Fetch error:', err);
        fetchError = {
          message: err.message,
          name: err.name,
          stack: err.stack,
          type: err.constructor.name
        };
        backendConfig = { error: String(err), details: fetchError };
      }

      setInfo({ 
        location, 
        referrer, 
        ua, 
        tgUser, 
        backendConfig,
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        basePath: import.meta.env.VITE_BASE_PATH,
        timestamp: new Date().toISOString()
      });
    };

    gather();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">Debug Info</h2>
      <pre className="text-sm bg-gray-100 p-3 rounded">{JSON.stringify(info, null, 2)}</pre>
      <p className="text-xs text-gray-500 mt-2">Open this page inside Telegram WebApp and paste the output here.</p>
    </div>
  );
};

export default Debug;


