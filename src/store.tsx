import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, getToken, setToken, getGuestCart, setGuestCart, type CartItem, type User, type GuestCartItem } from './api';

interface StoreCtx {
  user: User | null;
  authReady: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, full_name: string, phone?: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  cartItems: CartItem[];
  guestItems: GuestCartItem[];
  cartCount: number;
  cartSubtotal: number;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  addToCart: (variant_id: number, qty: number, meta?: GuestCartItem['meta']) => Promise<void>;
  updateCartItem: (id: number | string, qty: number) => Promise<void>;
  removeCartItem: (id: number | string) => Promise<void>;
  reloadCart: () => Promise<void>;
  wishlist: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  toast: string;
  showToast: (msg: string) => void;
}

const Ctx = createContext<StoreCtx>(null as never);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>(getGuestCart());
  const [wishlist, setWishlist] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('soleva-wishlist') || '[]'); } catch { return []; } });
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2600); };

  const reloadCart = async () => {
    if (user) {
      const data = await api<{ items: CartItem[] }>('/cart');
      setCartItems(data.items);
    } else {
      setGuestItems(getGuestCart());
    }
  };

  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const { user } = await api<{ user: User }>('/auth/me');
          setUser(user);
          // merge guest cart into server cart
          const guest = getGuestCart();
          if (guest.length) {
            await api('/cart/merge', { method: 'POST', body: JSON.stringify({ items: guest.map(({ variant_id, qty }) => ({ variant_id, qty })) }) });
            setGuestCart([]);
          }
          const wl = await api<{ items: { id: string }[] }>('/wishlist');
          setWishlist(wl.items.map((i) => i.id));
          localStorage.setItem('soleva-wishlist', JSON.stringify(wl.items.map((i) => i.id)));
        } catch { setToken(''); }
      }
      setAuthReady(true);
    })();
  }, []);

  useEffect(() => { if (authReady) reloadCart(); }, [user, authReady]);

  const login = async (email: string, password: string) => {
    const data = await api<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(data.token); setUser(data.user);
    const guest = getGuestCart();
    if (guest.length) {
      await api('/cart/merge', { method: 'POST', body: JSON.stringify({ items: guest.map(({ variant_id, qty }) => ({ variant_id, qty })) }) });
      setGuestCart([]);
    }
    const wl = await api<{ items: { id: string }[] }>('/wishlist');
    setWishlist(wl.items.map((i) => i.id));
    return data.user;
  };

  const register = async (email: string, password: string, full_name: string, phone?: string) => {
    const data = await api<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, full_name, phone }) });
    setToken(data.token); setUser(data.user);
    return data.user;
  };

  const logout = () => { setToken(''); setUser(null); setCartItems([]); };

  const addToCart = async (variant_id: number, qty: number, meta?: GuestCartItem['meta']) => {
    if (user) {
      await api('/cart', { method: 'POST', body: JSON.stringify({ variant_id, qty }) });
      await reloadCart();
    } else {
      const items = getGuestCart();
      const found = items.find((i) => i.variant_id === variant_id);
      if (found) found.qty = Math.min(10, found.qty + qty);
      else items.push({ variant_id, qty, meta });
      setGuestCart(items); setGuestItems(items);
    }
  };

  const updateCartItem = async (id: number | string, qty: number) => {
    if (user) {
      await api(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ qty }) });
      await reloadCart();
    } else {
      const items = getGuestCart().map((i) => i.variant_id === id ? { ...i, qty } : i);
      setGuestCart(items); setGuestItems(items);
    }
  };

  const removeCartItem = async (id: number | string) => {
    if (user) {
      await api(`/cart/${id}`, { method: 'DELETE' });
      await reloadCart();
    } else {
      const items = getGuestCart().filter((i) => i.variant_id !== id);
      setGuestCart(items); setGuestItems(items);
    }
  };

  const toggleWishlist = async (productId: string) => {
    const has = wishlist.includes(productId);
    if (user) {
      if (has) await api(`/wishlist/${productId}`, { method: 'DELETE' });
      else await api(`/wishlist/${productId}`, { method: 'POST' });
    }
    const next = has ? wishlist.filter((w) => w !== productId) : [...wishlist, productId];
    setWishlist(next);
    localStorage.setItem('soleva-wishlist', JSON.stringify(next));
  };

  const allItems: { qty: number; unit_price: number }[] = user
    ? cartItems
    : guestItems.map((g) => ({ qty: g.qty, unit_price: g.meta?.unit_price ?? 0 }));

  const value = useMemo<StoreCtx>(() => ({
    user, authReady, login, register, logout,
    refreshUser: async () => { const { user } = await api<{ user: User }>('/auth/me'); setUser(user); },
    cartItems, guestItems,
    cartCount: allItems.reduce((s, i) => s + i.qty, 0),
    cartSubtotal: allItems.reduce((s, i) => s + i.qty * i.unit_price, 0),
    cartOpen, setCartOpen, addToCart, updateCartItem, removeCartItem, reloadCart,
    wishlist, toggleWishlist, toast, showToast,
  }), [user, authReady, cartItems, guestItems, cartOpen, wishlist, toast]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
