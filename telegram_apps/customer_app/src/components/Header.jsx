import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Search, X } from 'lucide-react';
import useThemeStore from '@/store/themeStore';
import telegramService from '@/services/telegram';
import useSearchStore from '@/store/searchStore';
import axios from 'axios';

const Header = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { searchQuery, setSearchQuery } = useSearchStore();
  const [localValue, setLocalValue] = useState(searchQuery || '');
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const controlsRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(0);

  // Logo state management
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState(false);
  const [settingsData, setSettingsData] = useState(null);
  const [settingsRaw, setSettingsRaw] = useState(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);
  const [logoRetryCount, setLogoRetryCount] = useState(0);

  // Compute available width for expanding input
  useEffect(() => {
    if (expanded) {
      setVisible(true);
      if (inputRef.current) inputRef.current.focus();
      try {
        const logo = logoRef.current?.getBoundingClientRect();
        const controls = controlsRef.current?.getBoundingClientRect();
        if (logo && controls) {
          const width = controls.left - logo.right - 24;
          setInputWidth(width > 100 ? width : 0);
        }
      } catch {
        setInputWidth(0);
      }
    } else {
      const timeout = setTimeout(() => setVisible(false), 300);
      setInputWidth(0);
      return () => clearTimeout(timeout);
    }
  }, [expanded]);

  // Load and update logo based on theme
  useEffect(() => {
    let mounted = true;
    let retryTimeout = null;

    const loadSettings = async (retryCount = 0) => {
      if (!mounted) return;

      try {
        setIsLoadingLogo(true);
        setLogoError(false);

        // Use traditional local assets from each app's public/assets folder.
        // Vite serves `public` at the server root, so assets are available at `/assets/...`.
        const base = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
        const localLogo = theme === 'dark' ? `${base}/assets/logo_dark.png` : `${base}/assets/logo_light.png`;
        if (mounted) {
          setSettingsData({});
          setSettingsRaw(null);
          setLogoUrl(localLogo);
          setIsLoadingLogo(false);
        }

      } catch (error) {
        console.error('[Header] Error loading settings:', error);
        
        if (!mounted) return;

        // Retry logic with exponential backoff
        if (retryCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          console.log(`[Header] Retrying in ${delay}ms... (attempt ${retryCount + 1}/3)`);
          
          retryTimeout = setTimeout(() => {
            loadSettings(retryCount + 1);
          }, delay);
        } else {
          setLogoError(true);
          setIsLoadingLogo(false);
          
          // Use fallback logo from env
          const fallbackLogo = import.meta.env.VITE_APP_LOGO || '';
          if (fallbackLogo) {
            setLogoUrl(fallbackLogo);
          }
        }
      }
    };

    loadSettings();

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [theme]); // Re-fetch when theme changes

  // Debounce search sync
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(localValue), 400);
    return () => clearTimeout(t);
  }, [localValue, setSearchQuery]);

  const handleThemeToggle = () => {
    telegramService.hapticImpact('light');
    toggleTheme();
  };

  const handleSearchClick = () => {
    if (!expanded) {
      setExpanded(true);
    } else {
      setSearchQuery(localValue);
      setExpanded(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setExpanded(false);
    }
    if (e.key === 'Enter') {
      setSearchQuery(localValue);
      setExpanded(false);
    }
  };

  const handleLogoError = () => {
    console.warn('[Header] Logo failed to load:', logoUrl);
    // Try fallback strategy: if we had a signed URL, try the raw public URL from settings_raw
    if (logoRetryCount === 0) {
      // prefer explicit raw settings returned from backend
      const fallbackRaw = settingsRaw?.logo_light || settingsRaw?.logo_dark || settingsRaw?.logo_url || null;
      if (fallbackRaw) {
        setLogoRetryCount((c) => c + 1);
        setLogoError(false);
        setLogoUrl(fallbackRaw);
        return;
      }

      // Otherwise try any non-signed URL from settingsData
      const candidate = settingsData?.logo_light || settingsData?.logo_dark || settingsData?.logo_url || '';
      if (candidate && !/\/object\/sign\//.test(candidate)) {
        setLogoRetryCount((c) => c + 1);
        setLogoError(false);
        setLogoUrl(candidate);
        return;
      }
    }

    // If we get here, mark error and fall back to env logo
    setLogoError(true);
  };

  return (
    <header
      className="
        sticky top-0 z-50 
        backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 
        border-b border-gray-200/70 dark:border-gray-800/70 
        shadow-sm transition-all duration-300
      "
    >
      <div ref={containerRef} className="relative flex items-center justify-between px-3 py-2 sm:px-4">
        {/* Logo Section */}
        <div ref={logoRef} className="flex items-center space-x-3">
          <div className="relative w-37 h-16 rounded-xl overflow-hidden flex items-center justify-center">
            {isLoadingLogo ? (
              // Loading skeleton
              <div className="w-full h-full animate-pulse bg-gray-300 dark:bg-gray-700" />
            ) : logoUrl && !logoError ? (
              // Logo image
              <img
                src={logoUrl}
                alt="App Logo"
                className="w-full h-full object-contain p-1 transition-opacity duration-300"
                onError={handleLogoError}
                loading="eager"
                crossOrigin="anonymous"
              />
            ) : (
              // Fallback when no logo
              <div className="text-center px-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {import.meta.env.VITE_APP_NAME || 'App'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div ref={controlsRef} className="flex items-center gap-2 relative">
          {/* Animated Search Input */}
          {visible && (
            <div
              className="absolute flex items-center"
              style={{
                right: '90px',
                width: expanded ? '35vw' : '0px',
                maxWidth: expanded ? '400px' : '0px',
                minWidth: expanded ? '200px' : '0px',
                height: '40px',
                opacity: expanded ? 1 : 0,
                overflow: 'hidden',
                transition: expanded
                  ? 'width 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease-out'
                  : 'width 0.45s cubic-bezier(0.55, 0, 0.1, 1), opacity 0.35s ease-out',
              }}
            >
              <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 ml-2 w-full">
                <input
                  ref={inputRef}
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search menu..."
                  className="bg-transparent outline-none w-full text-sm text-gray-900 dark:text-white placeholder-gray-500"
                />
                <button
                  onClick={() => {
                    setExpanded(false);
                    setLocalValue('');
                  }}
                  className="p-1 ml-2 hover:opacity-80 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearchClick}
            className={`p-2.5 rounded-xl transition-all duration-300 
              ${
                expanded
                  ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100/80 dark:bg-gray-800/70 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
            className="relative p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/70 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 ease-out shadow-inner"
          >
            <div key={theme} className="transition-transform duration-500">
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400 drop-shadow-sm" />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
