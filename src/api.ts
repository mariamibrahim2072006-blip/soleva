// API client + auth token store.
const API = '/api';

export function getToken() { return localStorage.getItem('soleva-token') || ''; }
export function setToken(t: string) { t ? localStorage.setItem('soleva-token', t) : localStorage.removeItem('soleva-token'); }

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'request_failed'), { status: res.status, data });
  return data as T;
}

export interface Product {
  id: string; slug: string; name_en: string; name_ar: string;
  description_en: string; description_ar: string;
  gender: 'men' | 'women' | 'unisex';
  base_price: number; sale_price: number | null; price: number; on_sale: boolean;
  material_en: string; material_ar: string;
  is_new: boolean; is_best_seller: boolean; is_signature: boolean;
  rating: number; rating_count: number; created_at: string;
  category_slug: string; category_en: string; category_ar: string;
  images: string[];
  colors: { id: number; name_en: string; name_ar: string; hex: string }[];
  variants: { id: number; color_id: number; size: string; stock: number }[];
  total_stock: number;
}

export interface CartItem {
  cart_item_id: number; qty: number; variant_id: number; size: string; stock: number;
  color_id: number; color_en: string; color_ar: string; hex: string;
  product_id: string; slug: string; name_en: string; name_ar: string;
  base_price: number; sale_price: number | null; unit_price: number; image_url: string;
}

export interface User { id: string; email: string; full_name: string; phone?: string; role: 'customer' | 'admin'; }

export interface Order {
  id: string; order_number: string; status: string; payment_method: string; payment_status: string;
  full_name: string; email: string; phone: string; governorate: string; city: string; area: string;
  street: string; postal_code: string; notes: string; country: string;
  subtotal: number; discount: number; shipping_fee: number; total: number; coupon_code?: string;
  status_history: { status: string; at: string }[]; created_at: string;
}

// Guest cart (localStorage) — merged into the server cart on login.
export interface GuestCartItem { variant_id: number; qty: number; meta?: { slug: string; name_en: string; name_ar: string; image_url: string; size: string; color_en: string; color_ar: string; unit_price: number; stock: number }; }
export function getGuestCart(): GuestCartItem[] {
  try { return JSON.parse(localStorage.getItem('soleva-cart') || '[]'); } catch { return []; }
}
export function setGuestCart(items: GuestCartItem[]) { localStorage.setItem('soleva-cart', JSON.stringify(items)); }
