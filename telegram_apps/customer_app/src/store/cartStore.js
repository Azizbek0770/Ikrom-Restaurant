import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (menuItem, quantity = 1, specialInstructions = '') => {
        const items = get().items;
        const existingItem = items.find(item => item.menu_item_id === menuItem.id);

        if (existingItem) {
          set({
            items: items.map(item =>
              item.menu_item_id === menuItem.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          });
        } else {
          set({
            items: [
              ...items,
              {
                menu_item_id: menuItem.id,
                menuItem,
                quantity,
                special_instructions: specialInstructions,
                unit_price: menuItem.price
              }
            ]
          });
        }
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        set({
          items: get().items.map(item =>
            item.menu_item_id === menuItemId
              ? { ...item, quantity }
              : item
          )
        });
      },

      removeItem: (menuItemId) => {
        set({
          items: get().items.filter(item => item.menu_item_id !== menuItemId)
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => {
          return total + (parseFloat(item.unit_price) * item.quantity);
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'cart-storage'
    }
  )
);

export default useCartStore;