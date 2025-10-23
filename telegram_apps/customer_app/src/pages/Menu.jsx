import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesAPI, menuAPI } from '@/services/api';
import {
  Plus, Search, X, Minus, ChevronLeft, ChevronRight, ZoomIn, ZoomOut
} from 'lucide-react';
import useCartStore from '@/store/cartStore';
import telegramService from '@/services/telegram';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

// ==========================
// Lightbox Modal (Swipe + Zoom)
// ==========================
const LightboxModal = ({ dishes, index, onClose, onAdd }) => {
  const [current, setCurrent] = useState(index);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(1);
  const startX = useRef(null);
  const isSwiping = useRef(false);
  const dish = dishes[current];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKey);
    };
  }, [current]);

  if (!dish) return null;

  const next = () => setCurrent((c) => (c + 1) % dishes.length);
  const prev = () => setCurrent((c) => (c - 1 + dishes.length) % dishes.length);

  const handleAddToCart = () => {
    onAdd(dish, quantity);
    onClose();
  };

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    isSwiping.current = false;
  };
  const handleTouchMove = (e) => {
    if (!startX.current) return;
    const diff = e.touches[0].clientX - startX.current;
    if (Math.abs(diff) > 40) isSwiping.current = true;
  };
  const handleTouchEnd = (e) => {
    if (!startX.current) return;
    const diff = e.changedTouches[0].clientX - startX.current;
    if (isSwiping.current && Math.abs(diff) > 60) diff > 0 ? prev() : next();
    startX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-[95%] max-w-md bg-white/90 dark:bg-gray-900/90 rounded-2xl overflow-hidden shadow-xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image */}
        <div
          className="relative w-full h-72 overflow-hidden group touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={dish.image_url}
            alt={dish.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out"
            style={{ transform: `scale(${zoom})` }}
          />
          {dishes.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
              className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{dish.name}</h2>
          {dish.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{dish.description}</p>
          )}
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-2">
            {formatCurrency(dish.price)}
          </p>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-800 dark:text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================
// MenuItem
// ==========================
const MenuItem = ({ item, onAddToCart, onImageClick, showBestseller }) => {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    telegramService.hapticImpact('light');
    onAddToCart(item);
    setTimeout(() => setIsAdding(false), 300);
  };

  return (
    <div className="relative bg-white/80 dark:bg-gray-900/70 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all">
      {showBestseller && (
        <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
          <span>🔥</span>
          <span>HOT</span>
        </div>
      )}
      <img
        src={item.image_url}
        alt={item.name}
        className="w-full h-32 object-cover cursor-pointer"
        onClick={onImageClick}
      />
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(item.price)}
          </p>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className={cn(
              'flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all text-sm shadow-sm',
              isAdding && 'scale-95'
            )}
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================
// Main Menu
// ==========================
const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [limit, setLimit] = useState(25);
  const { addItem } = useCartStore();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await categoriesAPI.getAll()).data.data.categories,
  });

  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const res = await fetch('/api/banners');
      const json = await res.json();
      return json.data.banners || [];
    }
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems', selectedCategory],
    queryFn: async () => {
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      return (await menuAPI.getAll(params)).data.data.menuItems;
    },
  });

  const processedItems = useMemo(() => {
    let items = menuItems || [];
    if (searchQuery)
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return items.slice(0, limit);
  }, [menuItems, searchQuery, limit]);

  const handleAddToCart = (item) => {
    addItem(item, 1);
    telegramService.hapticNotification('success');
  };

  // 🔹 Auto-load when reaching bottom
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
        setLimit((prev) => {
          if (prev < menuItems.length) return prev + 25;
          return prev;
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [menuItems]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Search + Categories */}
      <div className="sticky top-[55px] z-40 backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 pb-2">
        <div className="px-4 pt-4">
          <div className="relative mb-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex space-x-2 overflow-x-auto scrollbar-hide py-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={cn(
                'flex-shrink-0 w-20 h-20 rounded-lg flex items-center justify-center border text-sm font-medium transition-all',
                selectedCategory === ''
                  ? 'ring-2 ring-primary-600 bg-white/80 dark:bg-gray-800/80'
                  : 'bg-white/60 dark:bg-gray-900/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
              )}
            >
              All
            </button>

            {categories?.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="flex-shrink-0 w-20">
                <div
                  className={cn(
                    'relative w-20 h-20 rounded-lg overflow-hidden transition-transform',
                    selectedCategory === cat.id ? 'ring-2 ring-primary-600 scale-100' : 'hover:scale-105'
                  )}
                >
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                    <div className="w-full px-1 py-0.5 text-[10px] font-semibold text-white text-center truncate opacity-80">
                      {cat.name}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Banner (news) */}
      {banners && banners.length > 0 && (
        <div className="p-3">
          <div className="w-full rounded-lg overflow-hidden shadow-sm">
            <img src={banners[0].image_url} alt={banners[0].title} className="w-full h-40 object-cover" />
            <div className="-mt-12 px-4 pb-3">
              <div className="bg-white/90 dark:bg-gray-900/80 backdrop-blur rounded-lg p-3 max-w-3xl mx-auto -mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{banners[0].title}</h3>
                {banners[0].subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{banners[0].subtitle}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Header with Hot Sales indicator */}
      {!searchQuery && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🔥</span>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Most Popular Items
            </h2>
          </div>
        </div>
      )}

      {/* Dishes */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {processedItems.map((item, i) => (
            <MenuItem
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
              onImageClick={() => setLightboxIndex(i)}
              showBestseller={!searchQuery && i < 6 && (item.sales_count || 0) > 0}
            />
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <LightboxModal
          dishes={processedItems}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onAdd={handleAddToCart}
        />
      )}
    </div>
  );
};

export default Menu;

// Animations
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }
.animate-fadeIn { animation: fadeIn 0.25s ease-out; }
.animate-scaleIn { animation: scaleIn 0.25s ease-out; }
`;
document.head.appendChild(style);
