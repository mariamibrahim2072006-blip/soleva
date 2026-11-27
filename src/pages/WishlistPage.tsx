import { useEffect, useState } from 'react';
import { useLang } from '../lang';
import { api, type Product } from '../api';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';

export default function WishlistPage() {
  const { t } = useLang();
  const { wishlist, user } = useStore();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (user) {
          const d = await api<{ items: any[] }>('/wishlist');
          // Wishlist API returns light rows; enrich with product details.
          const full = await Promise.all(d.items.map((i) => api<{ product: Product }>(`/products/${i.slug}`).then((r) => r.product).catch(() => null)));
          setItems(full.filter(Boolean) as Product[]);
        } else {
          const d = await api<{ items: Product[] }>('/products?limit=48');
          setItems(d.items.filter((p) => wishlist.includes(p.id)));
        }
      } catch { /* keep empty */ }
      setLoading(false);
    })();
  }, [user, wishlist]);

  return (
    <div className="max-w-[1600px] mx-auto px-5 md:px-10 pt-28 md:pt-36 pb-24 min-h-screen">
      <h1 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight mb-12">{t.account.wishlist}</h1>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[4/5] bg-ink-2 animate-pulse" />)}</div>
      ) : items.length ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      ) : (
        <p className="text-concrete py-16 text-center">{t.account.noWishlist}</p>
      )}
    </div>
  );
}
