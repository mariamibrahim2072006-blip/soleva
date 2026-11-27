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
    if (goCheckout) {
      // Buy Now: single item straight to checkout, the cart is untouched.
      nav('/checkout', { state: { buyNow: { variant_id: selectedVariant.id, qty, name_en: p.name_en, name_ar: p.name_ar, image: p.images[0], size, price: p.price } } });
      return;
    }
    await addToCart(selectedVariant.id, qty, {
      slug: p.slug, name_en: p.name_en, name_ar: p.name_ar, image_url: p.images[0],
      size, color_en: color?.name_en || '', color_ar: color?.name_ar || '', unit_price: p.price, stock: selectedVariant.stock,
    });
    setCartOpen(true);
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
    <div>
      <section className="band-yellow pt-28 md:pt-36">
      <header className="max-w-[1600px] mx-auto px-5 md:px-10 mb-8 md:mb-10">
        <p className="text-sm md:text-base font-black uppercase tracking-[0.18em] text-concrete mb-2">{lang === 'ar' ? p.category_ar : p.category_en} · {p.gender === 'men' ? t.misc.men : p.gender === 'women' ? t.misc.women : t.misc.unisex}</p>
        <h1 className="font-display font-black uppercase text-4xl sm:text-5xl md:text-7xl tracking-tight leading-[0.95]">{name}</h1>
      </header>
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 pb-20">
        {/* Gallery / 360 stage */}
        <div>
          <div ref={stage} className="stage-3d relative aspect-[4/5] bg-white border-2 border-ivory border-b-[8px] overflow-hidden cursor-grab active:cursor-grabbing select-none" data-cursor
            onClick={() => setZoom(true)}>
            <div className="stage-3d-inner w-full h-full">
              <img src={p.images[imgIdx]} alt={name} className="w-full h-full object-contain p-4 pointer-events-none" draggable={false} />
            </div>
            {p.on_sale && <span className="absolute top-4 start-4 bg-ivory text-white text-sm uppercase tracking-[0.15em] px-3 py-1.5 font-black">-{discount}%</span>}
            <span className="absolute bottom-4 start-4 text-concrete text-xs font-bold uppercase tracking-[0.2em]">⟲ 360° · {imgIdx + 1}/{p.images.length}</span>
          </div>
          <div className="flex gap-3 mt-4">
            {p.images.map((src, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`w-20 aspect-[4/5] bg-white overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-ivory' : 'border-ivory/30 hover:border-ivory'}`}>
                <img src={src} alt="" className="w-full h-full object-contain p-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Info: separate cards */}
        <div className="flex flex-col gap-6">
          <section className="border-2 border-ivory bg-white p-5 md:p-6">
            <div className="flex items-center gap-3">
              <Stars rating={p.rating} />
              <span className="text-concrete text-base font-bold">{p.rating} ({p.rating_count})</span>
            </div>
            <div className="flex items-baseline flex-wrap gap-x-4 gap-y-1 mt-3">
              <span className="font-display font-black text-4xl md:text-5xl">{fmt(p.price)}</span>
              {p.on_sale && <span className="text-concrete text-2xl font-bold line-through">{fmt(p.base_price)}</span>}
              {p.on_sale && <span className="bg-ivory text-white text-sm font-black px-2.5 py-1">-{discount}%</span>}
            </div>
            <p className="mt-3 text-base font-black uppercase tracking-[0.08em] text-concrete">{p.total_stock > 0 ? `${t.product.inStock}: ${p.total_stock}` : t.product.soldOut}</p>
          </section>

          <section className="border-2 border-ivory bg-white p-5 md:p-6">
            <h2 className="font-display font-black uppercase text-xl border-b-2 border-ivory pb-3 mb-5">{t.product.selectColor} / {t.product.selectSize}</h2>
            <p className="text-base font-black uppercase tracking-[0.1em] mb-3">{t.product.selectColor}: <span className="text-concrete">{lang === 'ar' ? color?.name_ar : color?.name_en}</span></p>
            <div className="flex gap-3 flex-wrap">
              {p.colors.map((c, i) => (
                <button key={c.id} onClick={() => { setColorIdx(i); setSize(''); }} aria-label={c.name_en}
                  className={`w-11 h-11 rounded-full border-2 transition-all ${i === colorIdx ? 'border-ivory ring-4 ring-ivory/40 scale-110' : 'border-ivory/50 hover:border-ivory'}`}
                  style={{ backgroundColor: c.hex }} />
              ))}
            </div>
            <div className="flex justify-between items-center mt-7 mb-3">
              <p className="text-base font-black uppercase tracking-[0.1em]">{t.product.selectSize}</p>
              <button onClick={() => setShowSizeGuide(true)} className="text-sm font-black uppercase tracking-[0.1em] underline">{t.product.sizeGuide}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const v = variants.find((x) => x.size === s)!;
                const out = v.stock === 0;
                return (
                  <button key={s} disabled={out} onClick={() => setSize(s)}
                    className={`min-w-14 h-14 px-3 border-2 text-lg font-bold transition-all relative ${size === s ? 'border-ivory bg-ivory text-white' : out ? 'border-ivory/25 bg-white text-ivory/35 cursor-not-allowed line-through' : 'border-ivory bg-white text-ivory hover:bg-ink-3'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
            {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock <= 3 && (
              <p className="mt-3 text-sm font-black text-ivory uppercase tracking-widest">{t.product.lowStock}: {selectedVariant.stock}</p>
            )}
          </section>

          <section className="border-2 border-ivory bg-white p-5 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center border-2 border-ivory bg-white text-xl font-bold">
                <button className="w-12 h-14 grid place-items-center hover:bg-ink-3" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="w-12 text-center tabular-nums">{qty}</span>
                <button className="w-12 h-14 grid place-items-center hover:bg-ink-3 disabled:opacity-30" disabled={!selectedVariant || qty >= Math.min(10, selectedVariant.stock)} onClick={() => setQty(qty + 1)}>+</button>
              </div>
              <button onClick={() => toggleWishlist(p.id)} aria-label={t.actions.addToWishlist}
                className={`w-14 h-14 grid place-items-center border-2 border-ivory transition-colors ${wishlist.includes(p.id) ? 'bg-ivory text-white' : 'bg-white text-ivory hover:bg-ink-3'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlist.includes(p.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 21C7 16.5 3 13.3 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.3-4 7.5-9 12Z" /></svg>
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => doAdd(true)} disabled={!selectedVariant || selectedVariant.stock < qty}
                className="border-2 border-ivory bg-ivory text-white font-display font-black uppercase tracking-[0.12em] text-base py-5 hover:bg-ivory-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {t.actions.buyNow}
              </button>
              <button onClick={() => doAdd(false)} disabled={!selectedVariant || selectedVariant.stock < qty}
                className="border-2 border-ivory bg-white text-ivory font-display font-black uppercase tracking-[0.12em] text-base py-5 hover:bg-ink-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {t.actions.addToCart}
              </button>
            </div>
            {!selectedVariant && <p className="mt-3 text-sm font-bold text-concrete">{t.product.selectSize}</p>}
          </section>

          <section className="border-2 border-ivory bg-white p-5 md:p-6">
            <h2 className="font-display font-black uppercase text-xl border-b-2 border-ivory pb-3 mb-4">{t.product.description}</h2>
            <p className="text-concrete leading-relaxed text-lg font-semibold">{lang === 'ar' ? p.description_ar : p.description_en}</p>
            <div className="mt-5 pt-5 border-t-2 border-ivory grid grid-cols-2 gap-5 text-base font-bold">
              <div><p className="text-concrete text-sm font-black uppercase tracking-widest mb-1">{t.product.material}</p><p>{lang === 'ar' ? p.material_ar : p.material_en}</p></div>
              <div><p className="text-concrete text-sm font-black uppercase tracking-widest mb-1">{t.product.sku}</p><p className="uppercase break-all">{p.slug}</p></div>
              <div><p className="text-concrete text-sm font-black uppercase tracking-widest mb-1">{t.product.inStock}</p><p>{p.total_stock > 0 ? `${p.total_stock}` : t.product.soldOut}</p></div>
              <div><p className="text-concrete text-sm font-black uppercase tracking-widest mb-1">{t.checkout.country}</p><p>{t.checkout.egypt}</p></div>
            </div>
          </section>
        </div>
      </div>
      </section>

      {/* Reviews */}
      <section className="border-t-4 border-ivory">
        <div className="max-w-[1200px] mx-auto px-5 md:px-10 py-20">
          <h2 className="font-display font-black uppercase text-3xl md:text-4xl tracking-tight mb-12">{t.product.reviews} ({data.reviews.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {data.reviews.map((r) => (
              <figure key={r.id} className="border-2 border-ivory bg-white p-6">
                <Stars rating={r.rating} />
                <blockquote className="mt-4 font-display font-black uppercase tracking-tight text-lg">“{r.title}”</blockquote>
                <p className="mt-2 text-concrete text-base font-semibold leading-relaxed">{r.body}</p>
                <figcaption className="mt-4 text-sm font-bold uppercase tracking-[0.15em] text-concrete">{r.author_name} · {new Date(r.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</figcaption>
              </figure>
            ))}
          </div>
          {reviewSent ? (
            <p className="text-silver uppercase tracking-widest text-sm">✓ {t.product.reviews}</p>
          ) : (
            <form onSubmit={submitReview} className="max-w-xl">
              <h3 className="text-base font-black uppercase tracking-[0.12em] text-ivory mb-6">{t.actions.writeReview}</h3>
              <div className="space-y-5">
                <input required minLength={2} className="input-line" placeholder={t.contactPage.name} value={reviewForm.author_name} onChange={(e) => setReviewForm({ ...reviewForm, author_name: e.target.value })} />
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })} className={`text-2xl ${n <= reviewForm.rating ? 'text-ivory' : 'text-ivory/25'}`}>★</button>
                  ))}
                </div>
                <input className="input-line" placeholder={t.product.reviews} value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} />
                <textarea className="input-line min-h-24" placeholder="…" value={reviewForm.body} onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })} />
                <button className="bg-ivory text-white font-display font-black uppercase tracking-[0.15em] text-base px-10 py-4 hover:bg-ivory-2 transition-colors">{t.actions.submit}</button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Related */}
      {data.related.length > 0 && (
        <section className="band-yellow"><div className="max-w-[1600px] mx-auto px-5 md:px-10 py-16 md:py-20">
          <h2 className="font-display font-black uppercase text-3xl md:text-4xl tracking-tight mb-12">{t.product.related}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {data.related.map((rp, i) => <Reveal key={rp.id}><ProductCard product={rp} index={i} /></Reveal>)}
          </div>
        </div></section>
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
