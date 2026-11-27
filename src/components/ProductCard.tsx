import { Link } from 'react-router-dom';
import { useLang } from '../lang';
import { useStore } from '../store';
import type { Product } from '../api';

export function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className="text-silver">
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { lang, fmt, t } = useLang();
  const { wishlist, toggleWishlist, showToast } = useStore();
  const name = lang === 'ar' ? product.name_ar : product.name_en;
  const wished = wishlist.includes(product.id);
  const discount = product.on_sale ? Math.round((1 - product.price / product.base_price) * 100) : 0;

  return (
    <Link to={`/product/${product.slug}`} className="product-card group block" data-cursor>
      <div className="relative aspect-[4/5] overflow-hidden bg-white border border-line border-b-[6px] border-b-ivory">
        <img src={product.images[0]} alt={name} loading={index > 3 ? 'lazy' : undefined}
          className="img-a absolute inset-0 w-full h-full object-contain" />
        {false && product.images[1] && (
          <img src={product.images[1]} alt="" loading="lazy" aria-hidden
            className="img-b absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {product.is_new && <span className="bg-ink text-ivory text-[10px] uppercase tracking-[0.18em] px-2.5 py-1">{t.home.newArrivals}</span>}
          {product.on_sale && <span className="bg-ivory text-ink text-[10px] uppercase tracking-[0.18em] px-2.5 py-1 font-bold">-{discount}%</span>}
          {product.total_stock === 0 && <span className="bg-concrete text-ink text-[10px] uppercase tracking-[0.18em] px-2.5 py-1">{t.product.soldOut}</span>}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
          aria-label={t.actions.addToWishlist}
          className={`absolute top-3 end-3 w-9 h-9 grid place-items-center rounded-full transition-all ${wished ? 'bg-ink text-ivory' : 'bg-ink/0 text-ink hover:bg-ink hover:text-ivory'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path d="M12 21C7 16.5 3 13.3 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.3-4 7.5-9 12Z" />
          </svg>
        </button>
      </div>
      <div className="pt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold uppercase tracking-wide text-sm">{name}</h3>
          <p className="text-concrete text-xs mt-1 capitalize">{lang === 'ar' ? product.category_ar : product.category_en}</p>
          <div className="mt-1.5"><Stars rating={product.rating} /> <span className="text-concrete text-[10px]">({product.rating_count})</span></div>
        </div>
        <div className="text-end shrink-0">
          <div className="font-display font-semibold text-sm">{fmt(product.price)}</div>
          {product.on_sale && <div className="text-concrete text-xs line-through">{fmt(product.base_price)}</div>}
        </div>
      </div>
    </Link>
  );
}
