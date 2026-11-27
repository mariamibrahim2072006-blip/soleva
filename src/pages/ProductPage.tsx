import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLang } from '../lang';
import { api, type Product } from '../api';
import { useStore } from '../store';
import ProductCard, { Stars } from '../components/ProductCard';
import Reveal, { gsap } from '../components/Reveal';

export default function ProductPage() {
  const { slug } = useParams();
  const { t, lang, fmt } = useLang();
  const { addToCart, setCartOpen, showToast, wishlist, toggleWishlist } = useStore();
  const nav = useNavigate();
  const [data, setData] = useState<{ product: Product; reviews: any[]; related: Product[] } | null>(null);
  const [colorIdx, setColorIdx] = useState(0);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author_name: '', rating: 5, title: '', body: '' });
  const [reviewSent, setReviewSent] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setData(null); setColorIdx(0); setSize(''); setQty(1); setImgIdx(0); setReviewSent(false);
    api<any>(`/products/${slug}`).then(setData).catch(() => setData(null));
    window.scrollTo(0, 0);
  }, [slug]);

  const p = data?.product;
  const color = p?.colors[colorIdx];
  const variants = useMemo(() => p?.variants.filter((v) => v.color_id === color?.id) ?? [], [p, color]);
  const selectedVariant = variants.find((v) => v.size === size);
  const sizes = [...new Set(variants.map((v) => v.size))].sort((a, b) => +a - +b);
  const name = p ? (lang === 'ar' ? p.name_ar : p.name_en) : '';
  const discount = p?.on_sale ? Math.round((1 - p.price / p.base_price) * 100) : 0;

  // Interactive 360-style stage: drag/swipe rotates through views + tilt
  useEffect(() => {
    const el = stage.current;
    if (!el || !p) return;
    let startX = 0, dragging = false;
    const down = (x: number) => { startX = x; dragging = true; };
    const move = (x: number) => {
      if (!dragging || !p.images.length) return;
      const dx = x - startX;
      if (Math.abs(dx) > 60) {
        setImgIdx((i) => (i + (dx < 0 ? 1 : p.images.length - 1)) % p.images.length);
        startX = x;
      }
      gsap.to(el, { rotateY: dx / 8, duration: 0.4 });
    };
    const up = () => { dragging = false; gsap.to(el, { rotateY: 0, duration: 0.8, ease: 'elastic.out(1, .5)' }); };
    const md = (e: MouseEvent) => down(e.clientX);
    const mm = (e: MouseEvent) => move(e.clientX);
    const td = (e: TouchEvent) => down(e.touches[0].clientX);
    const tm = (e: TouchEvent) => move(e.touches[0].clientX);
    el.addEventListener('mousedown', md); window.addEventListener('mousemove', mm); window.addEventListener('mouseup', up);
    el.addEventListener('touchstart', td, { passive: true }); el.addEventListener('touchmove', tm, { passive: true }); el.addEventListener('touchend', up);
    return () => {
      el.removeEventListener('mousedown', md); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', up);
      el.removeEventListener('touchstart', td); el.removeEventListener('touchmove', tm); el.removeEventListener('touchend', up);
    };
  }, [p]);

  if (!data || !p) {
    return <div className="min-h-screen grid place-items-center"><span className="text-concrete text-sm uppercase tracking-[0.3em]">{t.misc.loading}…</span></div>;
  }

  const doAdd = async (goCheckout: boolean) => {
    if (!selectedVariant) { showToast(t.product.selectSize); return; }
    if (selectedVariant.stock < qty) { showToast(t.product.soldOut); return; }
    await addToCart(selectedVariant.id, qty, {
      slug: p.slug, name_en: p.name_en, name_ar: p.name_ar, image_url: p.images[0],
      size, color_en: color?.name_en || '', color_ar: color?.name_ar || '', unit_price: p.price, stock: selectedVariant.stock,
    });
    showToast(t.product.addedToCart);
    if (goCheckout) nav('/checkout'); else setCartOpen(true);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/products/${p.slug}/reviews`, { method: 'POST', body: JSON.stringify({ ...reviewForm, rating: +reviewForm.rating }) });
      setReviewSent(true);
      const fresh = await api<any>(`/products/${p.slug}`);
      setData(fresh);
    } catch { showToast(t.misc.error); }
  };

  return (
    <div className="pt-24 md:pt-28">
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 pb-24">
        {/* Gallery / 360 stage */}
        <div>
          <div ref={stage} className="stage-3d relative aspect-[4/5] bg-ivory-2 overflow-hidden cursor-grab active:cursor-grabbing select-none" data-cursor
            onClick={() => setZoom(true)}>
            <div className="stage-3d-inner w-full h-full">
              <img src={p.images[imgIdx]} alt={name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
            </div>
            {p.on_sale && <span className="absolute top-4 start-4 bg-ink text-ivory text-xs uppercase tracking-[0.2em] px-3 py-1.5 font-bold">-{discount}%</span>}
            <span className="absolute bottom-4 start-4 text-ink/50 text-[10px] uppercase tracking-[0.25em]">⟲ 360° · {imgIdx + 1}/{p.images.length}</span>
          </div>
          <div className="flex gap-3 mt-4">
            {p.images.map((src, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`w-20 aspect-[4/5] bg-ivory-2 overflow-hidden border transition-colors ${i === imgIdx ? 'border-ivory' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="lg:pt-8">
          <p className="text-xs uppercase tracking-[0.3em] text-concrete mb-3">{lang === 'ar' ? p.category_ar : p.category_en} · {p.gender === 'men' ? t.misc.men : p.gender === 'women' ? t.misc.women : t.misc.unisex}</p>
          <h1 className="font-display font-black uppercase text-4xl md:text-5xl tracking-tight">{name}</h1>
          <div className="flex items-center gap-3 mt-4">
            <Stars rating={p.rating} />
            <span className="text-concrete text-sm">{p.rating} ({p.rating_count})</span>
          </div>
          <div className="flex items-baseline gap-4 mt-6">
            <span className="font-display font-black text-3xl">{fmt(p.price)}</span>
            {p.on_sale && <span className="text-concrete text-xl line-through">{fmt(p.base_price)}</span>}
          </div>
          <p className="mt-8 text-ivory/70 leading-loose">{lang === 'ar' ? p.description_ar : p.description_en}</p>

          {/* Colors */}
          <div className="mt-10">
            <p className="text-xs uppercase tracking-[0.25em] text-concrete mb-4">{t.product.selectColor}: <span className="text-ivory">{lang === 'ar' ? color?.name_ar : color?.name_en}</span></p>
            <div className="flex gap-3">
              {p.colors.map((c, i) => (
                <button key={c.id} onClick={() => { setColorIdx(i); setSize(''); }} aria-label={c.name_en}
                  className={`w-10 h-10 rounded-full border-2 transition-all ${i === colorIdx ? 'border-ivory scale-110' : 'border-line hover:border-concrete'}`}
                  style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs uppercase tracking-[0.25em] text-concrete">{t.product.selectSize}</p>
              <button onClick={() => setShowSizeGuide(true)} className="text-xs uppercase tracking-[0.2em] text-concrete underline hover:text-ivory">{t.product.sizeGuide}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const v = variants.find((x) => x.size === s)!;
                const out = v.stock === 0;
                return (
                  <button key={s} disabled={out} onClick={() => setSize(s)}
                    className={`min-w-12 h-12 px-3 border text-sm transition-all relative ${size === s ? 'border-ivory bg-ivory text-ink font-bold' : out ? 'border-line/40 text-concrete/40 cursor-not-allowed' : 'border-line hover:border-ivory'}`}>
                    {s}
                    {out && <span className="absolute inset-0 grid place-items-center"><span className="w-full h-px bg-concrete/50 rotate-[-12deg]" /></span>}
                  </button>
                );
              })}
            </div>
            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
              <p className="mt-3 text-xs text-silver uppercase tracking-widest">{t.product.lowStock}: {selectedVariant.stock}</p>
            )}
          </div>

          {/* Qty + actions */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex items-center border border-line">
              <button className="w-11 h-12 grid place-items-center hover:bg-ink-3" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="w-10 text-center tabular-nums">{qty}</span>
              <button className="w-11 h-12 grid place-items-center hover:bg-ink-3 disabled:opacity-30" disabled={!selectedVariant || qty >= Math.min(10, selectedVariant.stock)} onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <button onClick={() => toggleWishlist(p.id)} aria-label={t.actions.addToWishlist}
              className={`w-12 h-12 grid place-items-center border transition-colors ${wishlist.includes(p.id) ? 'border-ivory bg-ivory text-ink' : 'border-line hover:border-ivory'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlist.includes(p.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M12 21C7 16.5 3 13.3 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.3-4 7.5-9 12Z" /></svg>
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => doAdd(false)} disabled={!selectedVariant || selectedVariant.stock < qty}
              className="border border-ivory font-display font-bold uppercase tracking-[0.18em] text-sm py-4 hover:bg-ivory/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              {t.actions.addToCart}
            </button>
            <button onClick={() => doAdd(true)} disabled={!selectedVariant || selectedVariant.stock < qty}
              className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.18em] text-sm py-4 hover:bg-silver transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              {t.actions.buyNow}
            </button>
          </div>

          {/* Specs */}
          <div className="mt-12 border-t border-line pt-8 grid grid-cols-2 gap-6 text-sm">
            <div><p className="text-concrete text-xs uppercase tracking-widest mb-1">{t.product.material}</p><p>{lang === 'ar' ? p.material_ar : p.material_en}</p></div>
            <div><p className="text-concrete text-xs uppercase tracking-widest mb-1">{t.product.sku}</p><p className="uppercase">{p.slug}</p></div>
            <div><p className="text-concrete text-xs uppercase tracking-widest mb-1">{t.product.inStock}</p><p>{p.total_stock > 0 ? `${p.total_stock}` : t.product.soldOut}</p></div>
            <div><p className="text-concrete text-xs uppercase tracking-widest mb-1">{t.checkout.country}</p><p>{t.checkout.egypt}</p></div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="border-t border-line">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-20">
          <h2 className="font-display font-black uppercase text-3xl md:text-4xl tracking-tight mb-12">{t.product.reviews} ({data.reviews.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {data.reviews.map((r) => (
              <figure key={r.id} className="border border-line p-6">
                <Stars rating={r.rating} />
                <blockquote className="mt-4 font-serif italic text-lg">“{r.title}”</blockquote>
                <p className="mt-2 text-ivory/60 text-sm leading-relaxed">{r.body}</p>
                <figcaption className="mt-4 text-xs uppercase tracking-[0.25em] text-concrete">{r.author_name} · {new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</figcaption>
              </figure>
            ))}
          </div>
          {reviewSent ? (
            <p className="text-silver uppercase tracking-widest text-sm">✓ {t.product.reviews}</p>
          ) : (
            <form onSubmit={submitReview} className="max-w-xl">
              <h3 className="text-xs uppercase tracking-[0.25em] text-concrete mb-6">{t.actions.writeReview}</h3>
              <div className="space-y-5">
                <input required minLength={2} className="input-line" placeholder={t.contactPage.name} value={reviewForm.author_name} onChange={(e) => setReviewForm({ ...reviewForm, author_name: e.target.value })} />
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })} className={`text-2xl ${n <= reviewForm.rating ? 'text-silver' : 'text-ink-3'}`}>★</button>
                  ))}
                </div>
                <input className="input-line" placeholder={t.product.reviews} value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} />
                <textarea className="input-line min-h-24" placeholder="…" value={reviewForm.body} onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })} />
                <button className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-10 py-3.5 hover:bg-silver transition-colors">{t.actions.submit}</button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Related */}
      {data.related.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-20">
          <h2 className="font-display font-black uppercase text-3xl md:text-4xl tracking-tight mb-12">{t.product.related}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {data.related.map((rp, i) => <Reveal key={rp.id}><ProductCard product={rp} index={i} /></Reveal>)}
          </div>
        </section>
      )}

      {/* Zoom modal */}
      {zoom && (
        <div className="fixed inset-0 z-[600] bg-ink/95 backdrop-blur flex items-center justify-center p-6" onClick={() => setZoom(false)}>
          <img src={p.images[imgIdx]} alt={name} className="max-h-full max-w-full object-contain" />
          <button className="absolute top-6 end-6 text-3xl" aria-label={t.actions.close}>×</button>
        </div>
      )}

      {/* Size guide modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[600] bg-ink/90 backdrop-blur flex items-center justify-center p-6" onClick={() => setShowSizeGuide(false)}>
          <div className="bg-ink-2 border border-line max-w-lg w-full p-8 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold uppercase tracking-widest">{t.product.sizeGuide}</h3>
              <button onClick={() => setShowSizeGuide(false)} className="text-2xl">×</button>
            </div>
            <SizeTable />
          </div>
        </div>
      )}
    </div>
  );
}

export function SizeTable() {
  const rows = [
    ['36', '22.5', '5', '3.5'], ['37', '23.2', '6', '4.5'], ['38', '24.0', '7', '5.5'], ['39', '24.8', '8', '6.5'],
    ['40', '25.5', '9', '7.5'], ['41', '26.2', '9.5', '8'], ['42', '27.0', '10', '8.5'], ['43', '27.8', '11', '9.5'],
    ['44', '28.5', '12', '10.5'], ['45', '29.3', '13', '11.5'], ['46', '30.0', '14', '12.5'],
  ];
  return (
    <table className="w-full text-sm admin-table">
      <thead><tr className="text-concrete text-xs uppercase tracking-widest border-b border-line">
        <th className="py-2">EU</th><th className="py-2">CM</th><th className="py-2">UK</th><th className="py-2">US</th>
      </tr></thead>
      <tbody>
        {rows.map((r) => <tr key={r[0]} className="border-b border-line/50 text-center"><td className="py-2 font-semibold">{r[0]}</td><td className="py-2">{r[1]}</td><td className="py-2">{r[3]}</td><td className="py-2">{r[2]}</td></tr>)}
      </tbody>
    </table>
  );
}
