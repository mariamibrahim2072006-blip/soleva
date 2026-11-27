// API client + auth token store.
const API = (import.meta as any).env?.VITE_API_URL || '/api';

export function getToken() { return localStorage.getItem('soleva-token') || ''; }
export function setToken(t: string) { t ? localStorage.setItem('soleva-token', t) : localStorage.removeItem('soleva-token'); }

// SOLEVA sells sports sneakers only: hide every other category on the storefront.
const SPORTS = new Set(['sneakers', 'running', 'sports']);
const ORDER = ['flash-pink','candy-dash','coral-blaze','pulse-rush','cherry-frost','ember-sprint','blaze-knit','cobalt-rush','neon-wave','volt-strike','lime-glide','lilac-stride','glacier-x'];
const HIDDEN = new Set<string>([]);
const rank = (s: string) => { const i = ORDER.indexOf(s); return i < 0 ? 99 : i; };
function sportsOnly(d: any, path: string) {
  if (d && Array.isArray(d.categories)) d.categories = d.categories.filter((c: any) => SPORTS.has(c.slug));
  if (d && Array.isArray(d.items) && path.startsWith('/products')) {
    const lim = Number(new URLSearchParams(path.split('?')[1] || '').get('limit')) || 0;
    d.items = d.items.filter((p: any) => SPORTS.has(p.category_slug) && !HIDDEN.has(p.slug) && String(p.images?.[0] || '').includes('/px-'));
    const srt = new URLSearchParams(path.split('?')[1] || '').get('sort');
    if (!srt || srt === 'newest') d.items.sort((a: any, b: any) => rank(a.slug) - rank(b.slug));
    if (lim) d.items = d.items.slice(0, lim);
    d.total = d.items.length; d.pages = 1;
    if (d.facets) {
      const it = d.items as any[];
      const sizes = new Set(it.flatMap((p) => (p.variants || []).map((v: any) => String(v.size))));
      const cols = new Set(it.flatMap((p) => (p.colors || []).flatMap((c: any) => [c.name_en, c.name_ar])));
      const mats = new Set(it.flatMap((p) => [p.material_en, p.material_ar]));
      d.facets = { ...d.facets, sizes: (d.facets.sizes || []).filter((s: any) => sizes.has(String(s))), colors: (d.facets.colors || []).filter((c: any) => cols.has(c)), materials: (d.facets.materials || []).filter((m: any) => mats.has(m)) };
    }
  }
  return d;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path.startsWith('/products?') ? path.replace(/([?&])limit=\d+/, '$1limit=100').replace(/([?&])page=\d+&?/, '$1') : path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'request_failed'), { status: res.status, data });
  return sportsOnly(data, path) as T;
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
