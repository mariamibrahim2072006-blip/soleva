import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lang';
import { api, type Product } from '../api';
import ProductCard, { Stars } from '../components/ProductCard';
import Reveal, { SplitWords, MaskImage, gsap, ScrollTrigger } from '../components/Reveal';
import NewsletterForm from '../components/NewsletterForm';

export default function Home() {
  const { t, lang } = useLang();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [signature, setSignature] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroImg = useRef<HTMLImageElement>(null);
  const horizRef = useRef<HTMLDivElement>(null);
  const horizTrack = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ items: Product[] }>('/products?collection=new&limit=4').then((d) => setNewArrivals(d.items)).catch(() => {});
    api<{ items: Product[] }>('/products?collection=best&limit=4').then((d) => setBestSellers(d.items)).catch(() => {});
    api<{ items: Product[] }>('/products?collection=signature&limit=3').then((d) => setSignature(d.items)).catch(() => {});
    api<{ categories: any[] }>('/categories').then((d) => setCategories(d.categories)).catch(() => {});
    api<{ product: Product; reviews: any[] }>('/products/court-zero').then((d) => setReviews(d.reviews.slice(0, 3))).catch(() => {});
  }, []);

  // Hero: mouse parallax + scroll fade
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const dx = (e.clientX / w - 0.5), dy = (e.clientY / h - 0.5);
      if (heroImg.current) gsap.to(heroImg.current, { x: dx * 26, y: dy * 18, rotateY: dx * 4, duration: 1.2, ease: 'power3.out' });
    };
    hero.addEventListener('mousemove', onMove);
    const st = gsap.to(hero.querySelector('.hero-content'), {
      yPercent: -18, opacity: 0.25, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
    return () => { hero.removeEventListener('mousemove', onMove); st.scrollTrigger?.kill(); st.kill(); };
  }, []);

  // Horizontal scroll section (signature)
  useEffect(() => {
    const section = horizRef.current, track = horizTrack.current;
    if (!section || !track || signature.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.innerWidth < 768) return;
    const getAmount = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => (document.documentElement.dir === 'rtl' ? 1 : -1) * getAmount(),
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${getAmount()}`, pin: true, scrub: 1, invalidateOnRefresh: true },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, [signature]);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative h-[100svh] overflow-hidden bg-ink">
        <div className="absolute inset-0">
          <img ref={heroImg} src="/images/hero-main.webp" alt="SOLEVA campaign" className="w-full h-full object-cover scale-105 will-change-transform" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/40" />
        </div>
        <div className="hero-content relative z-10 h-full max-w-[1600px] mx-auto px-5 md:px-10 flex flex-col justify-end pb-24 md:pb-28">
          <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-silver mb-6">{t.hero.kicker}</p>
          <h1 className="font-display font-black uppercase leading-[0.92] text-[15vw] md:text-[9.5vw] tracking-tight">
            <span className="block"><SplitWords text={t.hero.line1} /></span>
            <span className="block text-outline"><SplitWords text={t.hero.line2} /></span>
          </h1>
          <p className="mt-8 max-w-md text-ivory/70 leading-relaxed text-sm md:text-base">{t.hero.sub}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/shop" className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-10 py-4 hover:bg-silver transition-colors">{t.actions.shopNow}</Link>
            <Link to="/collections/signature" className="border border-ivory/40 font-display font-bold uppercase tracking-[0.2em] text-sm px-10 py-4 hover:border-ivory hover:bg-ivory/5 transition-all">{t.actions.explore}</Link>
          </div>
        </div>
        <div className="absolute bottom-8 end-5 md:end-10 z-10 flex flex-col items-center gap-2 text-concrete">
          <span className="text-[10px] uppercase tracking-[0.3em] rotate-90 origin-center translate-y-[-8px]">{t.hero.scroll}</span>
          <div className="w-px h-14 bg-line relative overflow-hidden"><div className="absolute inset-x-0 top-0 h-1/2 bg-ivory animate-pulse" /></div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="border-y border-line py-4 overflow-hidden bg-ink-2" aria-hidden>
        <div className="animate-marquee flex whitespace-nowrap gap-0 w-max">
          {[0, 1].map((n) => (
            <span key={n} className="font-display font-bold uppercase tracking-[0.25em] text-sm text-concrete px-4">
              {['Free shipping over 10,000 EGP', 'Cash on delivery', 'Across Egypt', 'Limited runs', 'SOLEVA'].map((s) => <span key={s} className="mx-8">{s} <span className="text-silver">·</span></span>)}
            </span>
          ))}
        </div>
      </div>

      {/* ===== NEW ARRIVALS ===== */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-24 md:py-32">
        <Reveal>
          <div className="flex items-end justify-between mb-12">
            <h2 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight">{t.home.newArrivals}</h2>
            <Link to="/collections/new" className="hidden md:block text-xs uppercase tracking-[0.25em] border-b border-ivory/40 pb-1 hover:border-ivory transition-colors">{t.actions.viewAll}</Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {newArrivals.map((p, i) => <Reveal key={p.id} delay={i * 0.08}><ProductCard product={p} index={i} /></Reveal>)}
        </div>
      </section>

      {/* ===== SIGNATURE — HORIZONTAL ===== */}
      <section ref={horizRef} className="relative bg-ivory text-ink overflow-hidden">
        <div className="md:h-[100svh] flex flex-col justify-center py-20 md:py-0">
          <div className="max-w-[1600px] mx-auto px-5 md:px-10 w-full mb-10">
            <p className="text-xs uppercase tracking-[0.35em] text-ink/50 mb-3">{t.home.signature}</p>
            <h2 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight">
              {lang === 'ar' ? 'قطع تُعرّف الدار' : 'The pairs that define the house'}
            </h2>
          </div>
          <div ref={horizTrack} className="flex gap-6 md:gap-10 px-5 md:px-10 w-max overflow-x-auto md:overflow-visible">
            {signature.map((p, i) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="group relative w-[78vw] md:w-[42vw] shrink-0" data-cursor>
                <div className="aspect-[4/5] overflow-hidden bg-concrete-2/30">
                  <img src={p.images[0]} alt={lang === 'ar' ? p.name_ar : p.name_en} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="flex justify-between items-baseline mt-5">
                  <span className="font-display font-black uppercase text-2xl md:text-4xl">0{i + 1} — {lang === 'ar' ? p.name_ar : p.name_en}</span>
                  <Price p={p} dark />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-24 md:py-32">
        <Reveal><h2 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight mb-12">{t.home.shopByCategory}</h2></Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-s border-line">
          {categories.map((c, i) => (
            <Link key={c.slug} to={`/shop/${c.slug}`}
              className="group relative border-b border-e border-line p-6 md:p-10 min-h-[140px] md:min-h-[180px] flex flex-col justify-between hover:bg-ink-2 transition-colors">
              <span className="text-concrete text-xs font-display tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <span className="font-display font-bold uppercase tracking-wide text-lg md:text-2xl group-hover:text-silver transition-colors">{lang === 'ar' ? c.name_ar : c.name_en}</span>
                <span className="block text-concrete text-xs mt-1">{c.product_count}</span>
              </div>
              <span className="absolute end-6 top-6 md:end-10 md:top-10 opacity-0 group-hover:opacity-100 transition-opacity text-xl">{lang === 'ar' ? '←' : '→'}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== STORY ===== */}
      <section className="bg-ink-2 border-y border-line">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-24 md:py-36 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-concrete mb-6">{t.home.storyKicker}</p>
            <h2 className="font-serif italic text-4xl md:text-6xl leading-tight mb-8"><SplitWords text={t.home.storyTitle} /></h2>
            <Reveal><p className="text-ivory/70 leading-loose max-w-lg">{t.home.storyBody}</p></Reveal>
            <Reveal delay={0.15}><Link to="/about" className="inline-block mt-10 text-xs uppercase tracking-[0.25em] border-b border-ivory/40 pb-1 hover:border-ivory transition-colors">{t.footer.about}</Link></Reveal>
          </div>
          <MaskImage src="/images/craft-1.webp" alt="SOLEVA craftsmanship" className="aspect-[4/5]" />
        </div>
      </section>

      {/* ===== BEST SELLERS ===== */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-24 md:py-32">
        <Reveal>
          <div className="flex items-end justify-between mb-12">
            <h2 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight">{t.home.bestSellers}</h2>
            <Link to="/collections/best" className="hidden md:block text-xs uppercase tracking-[0.25em] border-b border-ivory/40 pb-1 hover:border-ivory transition-colors">{t.actions.viewAll}</Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {bestSellers.map((p, i) => <Reveal key={p.id} delay={i * 0.08}><ProductCard product={p} index={i} /></Reveal>)}
        </div>
      </section>

      {/* ===== CRAFTSMANSHIP ===== */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 pb-24 md:pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <MaskImage src="/images/craft-2.webp" alt="SOLEVA sole construction" className="aspect-[4/5] order-2 lg:order-1" />
        <div className="order-1 lg:order-2">
          <p className="text-xs uppercase tracking-[0.35em] text-concrete mb-6">{t.home.craft}</p>
          <h2 className="font-display font-black uppercase text-4xl md:text-5xl tracking-tight mb-8">
            {lang === 'ar' ? <>214 نقطة فحص.<br /><span className="text-outline">لا استثناءات.</span></> : <>214 checkpoints.<br /><span className="text-outline">No exceptions.</span></>}
          </h2>
          <Reveal><p className="text-ivory/70 leading-loose max-w-lg">{t.home.craftBody}</p></Reveal>
          <div className="grid grid-cols-3 gap-6 mt-12 max-w-lg">
            {[['100%', lang === 'ar' ? 'جلد طبيعي' : 'Full-grain leather'], ['214', lang === 'ar' ? 'نقطة فحص' : 'Quality checks'], ['48h', lang === 'ar' ? 'تجهيز يدوي' : 'Hand finishing']].map(([n, l]) => (
              <Reveal key={l}><div className="border-s border-line ps-4"><div className="font-display font-black text-2xl md:text-3xl">{n}</div><div className="text-concrete text-xs mt-1 uppercase tracking-wider">{l}</div></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CAMPAIGN GALLERY ===== */}
      <section className="border-y border-line bg-ink-2">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-24">
          <p className="text-xs uppercase tracking-[0.35em] text-concrete mb-10">{t.home.gallery}</p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <MaskImage src="/images/campaign-1.webp" alt="SOLEVA campaign one" className="md:col-span-7 aspect-[16/10]" />
            <MaskImage src="/images/campaign-2.webp" alt="SOLEVA campaign two" className="md:col-span-5 aspect-[16/10] md:aspect-auto" />
          </div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      {reviews.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-24 md:py-32">
          <Reveal><h2 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight mb-16 text-center">{t.home.reviews}</h2></Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.1}>
                <figure className="border border-line p-8 h-full flex flex-col">
                  <Stars rating={r.rating} />
                  <blockquote className="mt-5 font-serif italic text-xl leading-relaxed flex-1">“{r.title}”</blockquote>
                  <p className="mt-3 text-ivory/60 text-sm leading-relaxed line-clamp-3">{r.body}</p>
                  <figcaption className="mt-6 text-xs uppercase tracking-[0.25em] text-concrete">{r.author_name}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ===== NEWSLETTER ===== */}
      <section className="border-t border-line">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-24 md:py-32 text-center">
          <Reveal>
            <h2 className="font-display font-black uppercase text-5xl md:text-7xl tracking-tight"><SplitWords text={t.home.newsletter} /></h2>
            <p className="mt-6 text-concrete max-w-md mx-auto">{t.home.newsletterSub}</p>
          </Reveal>
          <Reveal delay={0.15}><div className="mt-10"><NewsletterForm /></div></Reveal>
        </div>
      </section>
    </div>
  );
}

function Price({ p, dark = false }: { p: Product; dark?: boolean }) {
  const { fmt } = useLang();
  return (
    <span className="font-display font-semibold">
      {fmt(p.price)}
      {p.on_sale && <span className={`ms-2 text-sm line-through ${dark ? 'text-ink/40' : 'text-concrete'}`}>{fmt(p.base_price)}</span>}
    </span>
  );
}
