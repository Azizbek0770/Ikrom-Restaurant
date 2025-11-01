import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import useSearchStore from '@/store/searchStore';
import { categoriesAPI, menuAPI, bannersAPI } from '@/services/api';
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
  const [quantity, setQuantity] = useState(0);
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

  const handleAdd = () => {
    setQuantity(1);
    onAdd(dish, 1);
  };

  const handleIncrease = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    onAdd(dish, newQty);
  };

  const handleDecrease = () => {
    const newQty = quantity - 1;
    if (newQty <= 0) {
      setQuantity(0);
      onAdd(dish, 0);
      return;
    }
    setQuantity(newQty);
    onAdd(dish, newQty);
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
        className="relative w-[95%] max-w-md bg-white/95 dark:bg-gray-900/90 rounded-2xl overflow-hidden shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Section */}
        <div
          className="relative w-full h-80 overflow-hidden group touch-pan-y"
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

        {/* Info Section */}
        <div className="p-4">
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white leading-snug">
            {dish.name}
          </h2>
          {dish.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-snug line-clamp-3">
              {dish.description}
            </p>
          )}
          <p className="text-[16px] font-bold text-primary-600 dark:text-primary-400 mt-2">
            {formatCurrency(dish.price)}
          </p>

          {/* Quantity & Add Controls */}
          <div className="flex items-center justify-between mt-4">
            {quantity === 0 ? (
              <button
                onClick={handleAdd}
                className="flex items-center space-x-1 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium text-sm hover:bg-primary-700 transition shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            ) : (
              <div className="flex items-center bg-primary-600 text-white rounded-xl px-3 py-1.5 shadow-sm space-x-2">
                <button
                  onClick={handleDecrease}
                  className="p-1 hover:bg-primary-700 rounded-full transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-sm font-semibold w-5 text-center">{quantity}</span>
                <button
                  onClick={handleIncrease}
                  className="p-1 hover:bg-primary-700 rounded-full transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => {
                onAdd(dish, quantity || 1);
                onClose();
              }}
              disabled={quantity === 0}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                quantity > 0
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {quantity > 0 ? 'Confirm' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// ==========================
// MenuItem (Stable Quantity Logic + Optimized Layout)
// ==========================
const MenuItem = ({ item, onAddToCart, onImageClick, topRank }) => {
  const [quantity, setQuantity] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    setIsAdding(true);
    telegramService.hapticImpact('light');
    setTimeout(() => {
      setQuantity(1);
      onAddToCart(item, 1);
      setIsAdding(false);
    }, 200);
  };

  const handleIncrease = () => {
    const newQty = quantity + 1;
    setQuantity(newQty);
    onAddToCart(item, newQty);
  };

  const handleDecrease = () => {
    const newQty = quantity - 1;
    if (newQty <= 0) {
      setQuantity(0);
      onAddToCart(item, 0);
      return;
    }
    setQuantity(newQty);
    onAddToCart(item, newQty);
  };

  return (
    <div className="relative bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-800/80 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      {topRank && (
        <div className="absolute top-2 left-2 z-10 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-md flex items-center gap-1 animate-topBadge">
          <span>🔥</span>
          <span>TOP {topRank}</span>
        </div>
      )}

      {/* Image */}
      <div className="relative">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-52 object-cover cursor-pointer transition-transform duration-300 hover:scale-105"
          onClick={onImageClick}
        />
      </div>

      {/* Info Section */}
      <div className="p-3 pt-2 flex flex-col justify-between min-h-[115px]">
        <div>
          <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white truncate leading-tight">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2 leading-snug">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-[15px] font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(item.price)}
          </p>

          {/* Add / Quantity Controls */}
          {quantity === 0 ? (
            <button
              onClick={handleAdd}
              disabled={isAdding}
              className={cn(
                "flex items-center space-x-1 px-2.5 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:scale-95 transition-all duration-200 text-xs font-medium shadow-sm",
                isAdding && "opacity-80 cursor-wait"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center bg-primary-600 text-white rounded-lg shadow-sm px-2 py-1 space-x-2">
              <button
                onClick={handleDecrease}
                className="p-1 hover:bg-primary-700 rounded-full transition"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-semibold w-4 text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrease}
                className="p-1 hover:bg-primary-700 rounded-full transition"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// ==========================
// Banner Carousel Component
// ==========================
const BannerCarousel = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const autoSlideRef = useRef(null);

  useEffect(() => {
    if (banners.length > 1) {
      autoSlideRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
    return () => clearInterval(autoSlideRef.current);
  }, [banners.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    clearInterval(autoSlideRef.current);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    clearInterval(autoSlideRef.current);
  };

  const handleBannerClick = (banner) => {
    // Prefer explicit news_id, fall back to associated news object
    const newsId = banner.news_id || (banner.news && banner.news.id);
    if (banner.banner_type === 'news_linked' && newsId) {
      navigate(`/news/${newsId}`);
    } else if (banner.link) {
      window.open(banner.link, '_blank');
    }
  };

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full rounded-xl overflow-hidden shadow-md group">
      {/* Banner Image */}
      <div 
        className="relative w-full h-48 cursor-pointer"
        onClick={() => handleBannerClick(banners[currentIndex])}
      >
        <img 
          src={banners[currentIndex].image_url} 
          alt={banners[currentIndex].title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        
        {/* Overlay with text */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <h3 className="text-white text-lg font-bold mb-1">
            {banners[currentIndex].title}
          </h3>
          {banners[currentIndex].subtitle && (
            <p className="text-white/90 text-sm line-clamp-2">
              {banners[currentIndex].subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-black/70"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); clearInterval(autoSlideRef.current); }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentIndex 
                    ? 'bg-white w-4' 
                    : 'bg-white/50 hover:bg-white/75'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ==========================
// Main Menu
// ==========================
const Menu = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const { searchQuery } = useSearchStore();
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
      const resp = await bannersAPI.getAll();
      return (resp.data && resp.data.data && resp.data.data.banners) || [];
    }
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['menuItems', selectedCategory],
    queryFn: async () => {
      const params = {};
      if (selectedCategory) params.category_id = selectedCategory;
      const response = await menuAPI.getAll(params);
      // Backend already sorts by sales_count DESC
      return response.data.data.menuItems;
    },
  });

  // Get top 10 items based on sales_count
  const top10Items = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    return menuItems.slice(0, 10);
  }, [menuItems]);

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

  // Helper function to get top rank for an item
  const getTopRank = (itemId) => {
    const index = top10Items.findIndex(item => item.id === itemId);
    return index >= 0 ? index + 1 : null;
  };

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
      <div className="sticky top-[50px] z-40 backdrop-blur-md bg-white/40 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800 pb-1	">
        <div className="px-2 pt-3">
          {/* <div className="relative mb-1">
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
          </div> */}

          <div className="flex space-x-2 overflow-x-auto scrollbar-hide py-2 pl-2">
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

      {/* Banner Carousel */}
        {banners && banners.length > 0 && !selectedCategory && (
         <div className="px-3 pt-3">
           <BannerCarousel banners={banners} />
        </div>
      )}
      {/* Top Sales Info Banner */}
      {!searchQuery && !selectedCategory && menuItems.length > 0 && (
        <div className="px-3 pt-3 pb-2">
          {/* <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔥</div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Top Sellers</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All items sorted by popularity • Top 10 highlighted
                </p>
                </div>
              </div>
          </div> */}
        </div>
      )}

      {/* All Menu Items */}
      <div className="p-3">
        <div className="grid grid-cols-2 gap-3">
          {processedItems.map((item, i) => (
            <MenuItem
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
              onImageClick={() => setLightboxIndex(i)}
              topRank={!searchQuery ? getTopRank(item.id) : null}
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
@keyframes topBadge { 
  0% { 
    opacity: 0; 
    transform: scale(0.5) rotate(-15deg); 
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
  100% { 
    opacity: 1; 
    transform: scale(1) rotate(0deg); 
  }
}
.animate-fadeIn { animation: fadeIn 0.25s ease-out; }
.animate-scaleIn { animation: scaleIn 0.25s ease-out; }
.animate-topBadge { 
  animation: topBadge 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); 
  box-shadow: 0 4px 12px rgba(251, 146, 60, 0.4);
}
`;
document.head.appendChild(style);
