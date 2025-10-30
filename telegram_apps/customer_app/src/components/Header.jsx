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
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);

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

        const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const endpoint = baseUrl ? `${baseUrl}/settings/site` : '/settings/site';
        
        console.log('[Header] Fetching settings from:', endpoint);
        
        const response = await axios.get(endpoint, {
          timeout: 10000,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!mounted) return;

        const settings = response?.data?.data?.settings || response?.data?.settings || response?.data || {};
        
        console.log('[Header] Settings received:', settings);
        setSettingsData(settings);

        // Determine which logo to use based on theme
        let selectedLogo = '';
        
        if (theme === 'dark') {
          selectedLogo = settings.logo_dark || settings.logoDark || '';
        } else {
          selectedLogo = settings.logo_light || settings.logoLight || '';
        }

        // Fallback to default logo if theme-specific not available
        if (!selectedLogo) {
          selectedLogo = settings.logo_url || settings.logoUrl || settings.logo || '';
        }

        // Final fallback to env variable
        if (!selectedLogo) {
          selectedLogo = import.meta.env.VITE_APP_LOGO || '';
        }

        console.log(`[Header] Selected logo for ${theme} theme:`, selectedLogo);

        if (selectedLogo && mounted) {
          // Add timestamp to prevent caching issues
          const logoWithTimestamp = selectedLogo.includes('?') 
            ? `${selectedLogo}&t=${Date.now()}`
            : `${selectedLogo}?t=${Date.now()}`;
          
          setLogoUrl(logoWithTimestamp);
        } else if (mounted) {
          setLogoUrl('');
        }

        setIsLoadingLogo(false);

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
          <div className="relative w-32 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
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
