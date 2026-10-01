import { create } from 'zustand';
import { Product, CartItem } from '../types';

interface CartState {
  cart: CartItem[];
  addItem: (product: Product, quantity?: number, selectedColor?: string) => void;
  removeItem: (productId: number, selectedColor?: string) => void;
  updateQuantity: (productId: number, quantity: number, selectedColor?: string) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
}

const CART_KEY = 'lostcamp_cart';

const loadSavedCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveCart = (cart: CartItem[]) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // Sync cart snapshot with backend for abandoned cart worker if user is logged in
    const userStr = localStorage.getItem('lostcamp_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.email) {
        fetch('/api/newsletter/cart-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, cart }),
        }).catch(() => {});
      }
    }
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: loadSavedCart(),

  addItem: (product: Product, quantity: number = 1, selectedColor?: string) => {
    set((state) => {
      const existingIndex = state.cart.findIndex(
        (item) => item.product.id === product.id && item.selectedColor === selectedColor
      );

      let updatedCart: CartItem[];
      if (existingIndex > -1) {
        updatedCart = state.cart.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        updatedCart = [...state.cart, { product, quantity, selectedColor }];
      }

      saveCart(updatedCart);
      return { cart: updatedCart };
    });
  },

  removeItem: (productId: number, selectedColor?: string) => {
    set((state) => {
      const updatedCart = state.cart.filter(
        (item) => !(item.product.id === productId && item.selectedColor === selectedColor)
      );
      saveCart(updatedCart);
      return { cart: updatedCart };
    });
  },

  updateQuantity: (productId: number, quantity: number, selectedColor?: string) => {
    if (quantity <= 0) {
      get().removeItem(productId, selectedColor);
      return;
    }

    set((state) => {
      const updatedCart = state.cart.map((item) =>
        item.product.id === productId && item.selectedColor === selectedColor
          ? { ...item, quantity }
          : item
      );
      saveCart(updatedCart);
      return { cart: updatedCart };
    });
  },

  clearCart: () => {
    saveCart([]);
    set({ cart: [] });
  },

  getCartCount: () => {
    return get().cart.reduce((total, item) => total + item.quantity, 0);
  },

  getCartTotal: () => {
    return get().cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  },
}));
