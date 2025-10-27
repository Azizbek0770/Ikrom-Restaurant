import React, { useState, useRef, useEffect } from 'react';
import { Moon, Sun, Search, X } from 'lucide-react';
import useThemeStore from '@/store/themeStore';
import telegramService from '@/services/telegram';
import useSearchStore from '@/store/searchStore';

const Header = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { searchQuery, setSearchQuery } = useSearchStore();
  const [localValue, setLocalValue] = useState(searchQuery || '');
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const logoRef = useRef(null);
  const controlsRef = useRef(null);
  const [overlayStyle, setOverlayStyle] = useState(null);

  useEffect(() => {
    if (expanded) {
      if (inputRef.current) inputRef.current.focus();
      // compute overlay bounds inside header container so it overlays without shifting
      try {
        const cont = containerRef.current.getBoundingClientRect();
        const logo = logoRef.current.getBoundingClientRect();
        const controls = controlsRef.current.getBoundingClientRect();
        const left = Math.max(8, logo.right - cont.left + 8);
        const right = Math.max(8, cont.right - controls.left + 8);
        setOverlayStyle({ left: `${left}px`, right: `${right}px`, top: '50%', transform: 'translateY(-50%)' });
      } catch (err) {
        setOverlayStyle(null);
      }
      document.body.style.overflow = 'hidden';
    } else {
      setOverlayStyle(null);
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [expanded]);

  // Debounce updating global search store
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(localValue);
    }, 400);
    return () => clearTimeout(t);
  }, [localValue, setSearchQuery]);

  const handleThemeToggle = () => {
    telegramService.hapticImpact('light');
    toggleTheme();
  };

  return (
    <header
      className="
        sticky top-0 z-50 
        backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 
        border-b border-gray-200/70 dark:border-gray-800/70 
        shadow-sm transition-all duration-300
        supports-[backdrop-filter]:backdrop-blur-md
      "
    >
        <div ref={containerRef} className="relative flex items-center justify-between px-3 py-2 sm:px-4">
          {expanded && (
            <div
              className="absolute inset-x-0 z-40 flex items-center"
              style={{
                left: overlayStyle?.left || '72px',
                right: overlayStyle?.right || '88px',
                top: overlayStyle?.top || '50%',
                transform: overlayStyle?.transform || 'translateY(-50%)',
                transition: 'left 220ms ease, right 220ms ease, opacity 200ms ease',
                opacity: expanded ? 1 : 0
              }}
            >
              <div className="w-full">
                <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl shadow-sm px-3 py-1 transition">
                  <input
                    ref={inputRef}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setExpanded(false);
                      }
                      if (e.key === 'Enter') {
                        setSearchQuery(localValue);
                        setExpanded(false);
                      }
                    }}
                    placeholder="Search menu..."
                    className="bg-transparent outline-none w-full text-sm text-gray-900 dark:text-white placeholder-gray-500"
                  />
                  <button onClick={() => { setExpanded(false); setSearchQuery(''); }} className="p-1 ml-2">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          )}
        {/* Logo & Title */}
        <div ref={logoRef} className="flex items-center space-x-3">
          <div
            className="
              w-10 h-10 rounded-xl flex items-center justify-center 
              bg-gradient-to-br from-indigo-500 to-indigo-600 
              dark:from-indigo-600 dark:to-indigo-700 
              shadow-md shadow-indigo-500/20 dark:shadow-indigo-900/30 
              transition-transform duration-300 hover:scale-105
            "
          >
            <span className="text-white text-xl font-bold select-none">🍽️</span>
          </div>

          <div className="leading-tight select-none">
            <h1
              className="
                text-base sm:text-lg font-semibold 
                text-gray-900 dark:text-gray-100 tracking-tight
              "
            >
              {import.meta.env.VITE_APP_NAME || 'Food Delivery'}
            </h1>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
              Order delicious food easily 🍱
            </p>
          </div>
        </div>

        {/* Search + Theme */}
        <div ref={controlsRef} className="flex items-center gap-2">
          <div className="relative">
            {!expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/70 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                aria-label="Open search"
              >
                <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>

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
