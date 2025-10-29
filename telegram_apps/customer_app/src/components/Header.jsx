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

  // Compute available width for expanding input
  useEffect(() => {
    if (expanded) {
      setVisible(true);
      if (inputRef.current) inputRef.current.focus();
      try {
        const logo = logoRef.current.getBoundingClientRect();
        const controls = controlsRef.current.getBoundingClientRect();
        const width = controls.left - logo.right - 24; // space between logo and controls
        setInputWidth(width > 100 ? width : 0);
      } catch {
        setInputWidth(0);
      }
    } else {
      const timeout = setTimeout(() => setVisible(false), 300);
      setInputWidth(0);
      return () => clearTimeout(timeout);
    }
  }, [expanded]);

  const [logoUrl, setLogoUrl] = useState('');
  const [logoRetry, setLogoRetry] = useState(0);

  // Load theme-specific logo from server settings and update when theme changes
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const base = import.meta.env.VITE_API_BASE_URL || '';
        const resp = await axios.get(base ? `${base}/settings/site` : `/settings/site`);
        const site = resp?.data?.data?.settings || {};

        // Choose logo based on current theme (store-driven)
        const chosen = theme === 'dark'
          ? (site.logo_dark || site.logo_url || import.meta.env.VITE_APP_LOGO || '')
          : (site.logo_light || site.logo_url || import.meta.env.VITE_APP_LOGO || '');

        if (mounted) setLogoUrl(chosen);
      } catch (err) {
        // ignore fetch errors
      }
    };

    load();
    return () => { mounted = false; };
  }, [theme]);

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
    if (!expanded) setExpanded(true);
    else {
      setSearchQuery(localValue);
      setExpanded(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setExpanded(false);
    if (e.key === 'Enter') {
      setSearchQuery(localValue);
      setExpanded(false);
    }
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
        {/* Logo (server-controlled) */}
        <div ref={logoRef} className="flex items-center space-x-3">
          <div className="w-30vw h-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            {logoUrl ? (
              <img
                id="app-logo-img"
                src={logoUrl}
                alt="logo"
                className="w-full h-full object-cover"
                onError={() => {
                  // retry once with cache-buster to avoid stale CDN cache or transient failures
                  if (logoRetry < 2) {
                    setLogoRetry((r) => r + 1);
                    setLogoUrl((s) => (s ? `${s}${s.includes('?') ? '&' : '?'}cb=${Date.now()}` : s));
                  } else {
                    console.warn('Failed to load logo after retries:', logoUrl);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full" />
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
                right: '90px', // ✅ moved slightly more left (was 68px)
                // width: expanded ? `${inputWidth}px` : '0px',
                width: expanded ? `35vw` : '0px',
                height: '90vh',
                opacity: expanded ? 1 : 0,
                overflow: 'hidden',
                transition: expanded
                  ? 'width 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease-out'
                  : 'width 0.45s cubic-bezier(0.55, 0, 0.1, 1), opacity 0.35s ease-out',
              }}
            >
              <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl shadow-sm px-3 py-1 ml-2 w-full">
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
                  className="p-1 ml-2 hover:opacity-80 transition"
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
            <div key={theme} className="animate-fadeRotate transition-transform duration-500">
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
