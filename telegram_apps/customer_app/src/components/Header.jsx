import React, { useState, useRef, useEffect } from "react";
import { Moon, Sun, Search, X } from "lucide-react";
import useThemeStore from "@/store/themeStore";
import telegramService from "@/services/telegram";
import useSearchStore from "@/store/searchStore";

const Header = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { searchQuery, setSearchQuery } = useSearchStore();
  const [localValue, setLocalValue] = useState(searchQuery || "");
  const [expanded, setExpanded] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoError, setLogoError] = useState(false);
  const [isLoadingLogo, setIsLoadingLogo] = useState(true);
  const inputRef = useRef(null);

  // Slightly shorter header height
  const HEADER_HEIGHT = 54;

  useEffect(() => {
    const base = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
    const localLogo =
      theme === "dark"
        ? `${base}/assets/logo_dark.png`
        : `${base}/assets/logo_light.png`;
    setLogoUrl(localLogo);
    setIsLoadingLogo(false);
  }, [theme]);

  // Sync local search to store
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(localValue), 350);
    return () => clearTimeout(t);
  }, [localValue, setSearchQuery]);

  const handleThemeToggle = () => {
    telegramService.hapticImpact("light");
    toggleTheme();
  };

  const handleSearchClick = () => {
    setExpanded(!expanded);
    if (!expanded) setTimeout(() => inputRef.current?.focus(), 120);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setExpanded(false);
    if (e.key === "Enter") {
      setSearchQuery(localValue);
      setExpanded(false);
    }
  };

  return (
    <header
      className="
        sticky top-0 z-50
        backdrop-blur-lg bg-white/80 dark:bg-gray-900/80
        border-b border-gray-200/70 dark:border-gray-800/70
        shadow-sm transition-all duration-300
      "
      style={{ height: HEADER_HEIGHT }}
    >
      <div className="flex items-center justify-between px-3 sm:px-5 h-full relative">
        {/* === Logo === */}
        <div className="flex items-center">
          <div className="relative w-28 h-10 flex items-center justify-center">
            {isLoadingLogo ? (
              <div className="w-full h-full animate-pulse bg-gray-300 dark:bg-gray-700 rounded-lg" />
            ) : logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt="App Logo"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                {import.meta.env.VITE_APP_NAME || "App"}
              </span>
            )}
          </div>
        </div>

        {/* === Search Input (Expanding) === */}
        <div
          className={`flex items-center transition-all duration-500 ease-in-out overflow-hidden ${
            expanded ? "w-full max-w-sm opacity-100" : "w-0 opacity-0"
          } absolute left-1/2 -translate-x-1/2`}
        >
          <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 w-full shadow-sm">
            <input
              ref={inputRef}
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="bg-transparent outline-none w-full text-sm text-gray-900 dark:text-white placeholder-gray-500"
            />
            <button
              onClick={() => {
                setExpanded(false);
                setLocalValue("");
              }}
              className="p-1 ml-2 hover:opacity-80 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* === Right Controls === */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <button
            onClick={handleSearchClick}
            className={`p-2 rounded-xl transition-all duration-300 ${
              expanded
                ? "bg-indigo-500 text-white shadow-md"
                : "bg-gray-100/80 dark:bg-gray-800/70 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
            className="p-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/70 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-gray-700" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
