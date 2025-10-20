import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import useCartStore from '@/store/cartStore';
import telegramService from '@/services/telegram';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/utils/cn';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
      <div className="flex items-start space-x-4">
        {item.menuItem.image_url && (
          <img
            src={item.menuItem.image_url}
            alt={item.menuItem.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
        )}
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{item.menuItem.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formatCurrency(item.unit_price)} each
          </p>
          
          {item.special_instructions && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
              Note: {item.special_instructions}
            </p>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center space-x-3 mt-3">
            <button
              onClick={() => onUpdateQuantity(item.menu_item_id, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            
            <span className="font-semibold text-lg w-8 text-center text-gray-900 dark:text-white">
              {item.quantity}
            </span>
            
            <button
              onClick={() => onUpdateQuantity(item.menu_item_id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={() => onRemove(item.menu_item_id)}
              className="ml-auto text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="text-right">
          <p className="font-bold text-lg text-gray-900 dark:text-white">
            {formatCurrency(parseFloat(item.unit_price) * item.quantity)}
          </p>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();

  const subtotal = getTotal();
  const deliveryFee = 5000;
  const total = subtotal + deliveryFee;
  const minOrderAmount = 15000;

  const handleUpdateQuantity = (itemId, quantity) => {
    telegramService.hapticImpact('light');
    updateQuantity(itemId, quantity);
  };

  const handleRemoveItem = (itemId) => {
    telegramService.hapticImpact('medium');
    removeItem(itemId);
  };

  const handleCheckout = () => {
    telegramService.hapticImpact('medium');
    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      telegramService.hapticNotification('warning');
      clearCart();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add items from the menu to get started
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors shadow-sm"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-48">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Cart</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{items.length} items</p>
          </div>
          <button
            onClick={handleClearCart}
            className="text-red-500 dark:text-red-400 text-sm font-medium hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-4">
        {items.map((item) => (
          <CartItem
            key={item.menu_item_id}
            item={item}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
          />
        ))}
      </div>

      {/* Minimum Order Warning */}
      {subtotal < minOrderAmount && (
        <div className="mx-4 mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Minimum order amount is {formatCurrency(minOrderAmount)}.
            Add {formatCurrency(minOrderAmount - subtotal)} more to proceed.
          </p>
        </div>
      )}

      {/* Summary - Fixed at bottom */}
      <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 shadow-lg safe-bottom">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Delivery Fee</span>
            <span>{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-800">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={subtotal < minOrderAmount}
          className={cn(
            'w-full py-3 rounded-xl font-semibold transition-all shadow-sm',
            subtotal >= minOrderAmount
              ? 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          )}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;