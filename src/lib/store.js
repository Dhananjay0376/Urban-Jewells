import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
      addItem: (product, quantity = 1, size = null) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          item => item.id === product.id && item.size === size
        );
        
        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({
            items: [...items, { ...product, quantity, size }]
          });
        }
        set({ isOpen: true });
      },
      
      removeItem: (productId, size = null) => {
        set({
          items: get().items.filter(
            item => !(item.id === productId && item.size === size)
          )
        });
      },
      
      updateQuantity: (productId, quantity, size = null) => {
        const items = get().items;
        const index = items.findIndex(
          item => item.id === productId && item.size === size
        );
        
        if (index > -1) {
          const newItems = [...items];
          newItems[index].quantity = Math.max(1, quantity);
          set({ items: newItems });
        }
      },
      
      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + parseFloat(item.price) * item.quantity,
          0
        );
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'urban-jewells-cart'
    }
  )
);

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product) => {
        if (!get().items.find(item => item.id === product.id)) {
          set({ items: [...get().items, product] });
        }
      },
      
      removeItem: (productId) => {
        set({
          items: get().items.filter(item => item.id !== productId)
        });
      },
      
      isInWishlist: (productId) => {
        return get().items.some(item => item.id === productId);
      },
      
      toggleItem: (product) => {
        if (get().isInWishlist(product.id)) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
        }
      }
    }),
    {
      name: 'urban-jewells-wishlist'
    }
  )
);

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setUser: (user, token) => set({ user, token, isAuthenticated: !!user }),
      
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      
      checkAuth: async () => {
        const token = get().token;
        if (!token) return false;
        
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (res.ok) {
            const { user } = await res.json();
            set({ user, isAuthenticated: true });
            return true;
          } else {
            set({ user: null, token: null, isAuthenticated: false });
            return false;
          }
        } catch {
          return false;
        }
      }
    }),
    {
      name: 'urban-jewells-auth'
    }
  )
);
