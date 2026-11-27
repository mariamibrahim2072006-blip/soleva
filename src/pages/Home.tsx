import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lang';
import { api, type Product } from '../api';
import ProductCard, { Stars } from '../components/ProductCard';
import Reveal, { SplitWords, MaskImage, gsap, ScrollTrigger } from '../components/Reveal';
import NewsletterForm from '../components/NewsletterForm';

export default function Home() {
  const { t, lang, fmt } = useLang();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [signature, setSignature] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [slides, setSlides] = useState<Product[]>([]);
  const [cur, setCur] = useState(0);
  const HERO = ['coral-blaze', 'cobalt-rush', 'candy-dash'];
  const heroSlides = HERO.map((s) => slides.find((p) => p.slug === s)).filter(Boolean) as Product[];
  useEffect(() => { api<{ items: Product[] }>('/products?limit=20').then((d) => setSlides(d.items)).catch(() => {}); }, []);
  useEffect(() => { if (slides.length < 2) return; const id = setInterval(() => setCur((c) => (c + 1) % 4), 5200); return () => clearInterval(id); }, [slides.length]);
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
    gsap.fromTo('.hero-content > div:last-child', { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'power4.out', delay: 0.2 });
    const st = gsap.to(hero.querySelector('.hero-content'), {
      yPercent: window.innerWidth < 768 ? 0 : -12, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
    return () => { hero.removeEventListener('mousemove', onMove); st.scrollTrigger?.kill(); st.kill(); };
  }, []);

  // Signature strip: native touch swipe plus a slow automatic drift.
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = strip.current;
    if (!el || slides.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let dir = 1, pausedUntil = 0, raf = 0;
    const rtl = document.documentElement.dir === 'rtl';
    const pause = () => { pausedUntil = performance.now() + 3500; };
    el.addEventListener('touchstart', pause, { passive: true });
    el.addEventListener('pointerdown', pause);
    el.addEventListener('wheel', pause, { passive: true });
    el.addEventListener('mouseenter', pause);
    let acc = 0;
    const tick = () => {
      if (performance.now() > pausedUntil) {
        const max = el.scrollWidth - el.clientWidth;
        acc += 0.7;
        if (acc >= 1) {
          const step = Math.floor(acc); acc -= step;
          const pos = Math.abs(el.scrollLeft);
          if (pos >= max - 1) dir = -1; else if (pos <= 0) dir = 1;
          el.scrollLeft += (rtl ? -1 : 1) * dir * step;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [slides.length]);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden bg-ink">
        <div className="hero-content relative z-10 min-h-[100svh] max-w-[1600px] mx-auto px-5 md:px-10 grid md:grid-cols-[1.05fr_1fr] items-center gap-6 pt-28 pb-14">
          <div className="order-2 md:order-1">
            <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-ivory mb-5 flex items-center gap-4"><span className="h-px w-12 bg-ivory inline-block" />{t.hero.kicker}</p>
            <h1 className="font-display font-black uppercase leading-[0.92] text-[14vw] md:text-[7.6vw] tracking-tight text-ivory">
              <span className="block"><SplitWords text={t.hero.line1} /></span>
              <span className="block"><SplitWords text={t.hero.line2} /></span>
            </h1>
            <p className="mt-6 max-w-md text-ivory leading-relaxed text-sm md:text-base">{t.hero.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-9 py-4 hover:bg-ivory-2 transition-colors">{t.actions.shopNow}</Link>
              <Link to="/collections/signature" className="border-2 border-ivory text-ivory font-display font-bold uppercase tracking-[0.2em] text-sm px-9 py-4 hover:bg-ivory hover:text-ink transition-all">{t.actions.explore}</Link>
            </div>
          </div>
          <div className="order-1 md:order-2 relative">
            <div className="relative aspect-[4/5] max-h-[70svh] md:max-h-[78svh] ml-auto overflow-hidden bg-white border-b-[6px] border-ivory">
              {heroSlides.length === 0 && <div className="w-full h-full bg-white" />}
              {heroSlides.map((p, i) => (
                <Link key={p.id} to={`/product/${p.slug}`} aria-label={lang === 'ar' ? p.name_ar : p.name_en}
                  className="absolute inset-0 block bg-white transition-opacity duration-700 ease-out"
                  style={{ opacity: i === cur % heroSlides.length ? 1 : 0, pointerEvents: i === cur % heroSlides.length ? 'auto' : 'none', perspective: '1100px' }}>
                  <img src={p.images[0]} alt={lang === 'ar' ? p.name_ar : p.name_en} decoding="async" className="w-full h-full object-contain hero-spin" style={{ animationPlayState: i === cur % heroSlides.length ? 'running' : 'paused' }} />
                </Link>
              ))}
              {heroSlides[cur % Math.max(heroSlides.length, 1)] && (
                <div className="absolute bottom-0 inset-x-0 bg-ivory text-ink px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-black uppercase tracking-tight truncate">{lang === 'ar' ? heroSlides[cur % heroSlides.length].name_ar : heroSlides[cur % heroSlides.length].name_en}</p>
                    <p className="text-[11px] uppercase tracking-[0.2em]">{lang === 'ar' ? heroSlides[cur % heroSlides.length].category_ar : heroSlides[cur % heroSlides.length].category_en}</p>
                  </div>
                  <p className="font-display font-bold whitespace-nowrap">{fmt(heroSlides[cur % heroSlides.length].price)}</p>
                </div>
              )}
            </div>
            <div className="absolute -bottom-3 start-0 hidden md:block w-full h-[3px] bg-ivory" />
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <div className="py-5 overflow-hidden bg-ivory text-ink" aria-hidden>
        <div className="animate-marquee flex whitespace-nowrap gap-0 w-max">
          {[0, 1].map((n) => (
            <span key={n} className="font-display font-black uppercase tracking-[0.15em] text-2xl md:text-4xl text-ink px-4">
              {['Run', 'Train', 'Move', 'Cash on delivery', 'Across Egypt', 'SOLEVA'].map((s) => <span key={s} className="mx-8">{s} <span>✦</span></span>)}
            </span>
          ))}
        </div>
      </div>

      {/* ===== NEW ARRIVALS ===== */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-8 md:py-12">
        <Reveal>
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display font-black uppercase text-3xl md:text-5xl tracking-tight">{t.home.newArrivals}</h2>
            <Link to="/collections/new" className="hidden md:block text-xs uppercase tracking-[0.25em] border-b border-ivory/40 pb-1 hover:border-ivory transition-colors">{t.actions.viewAll}</Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {newArrivals.slice(0,4).map((p, i) => <Reveal key={p.id} delay={i * 0.08}><ProductCard product={p} index={i} /></Reveal>)}
        </div>
      </section>

      {/* ===== SIGNATURE — HORIZONTAL ===== */}
      <section ref={horizRef} className="relative bg-ivory text-ink overflow-hidden">
        <div className="flex flex-col justify-center py-16 md:py-8 md:py-12">
          <div className="max-w-[1600px] mx-auto px-5 md:px-10 w-full mb-8">
            <p className="text-xs uppercase tracking-[0.35em] text-ink-2 mb-3">{t.home.signature}</p>
            <h2 className="font-display font-black uppercase text-3xl md:text-5xl tracking-tight">
              {lang === 'ar' ? 'قطع تُعرّف الدار' : 'The pairs that define the house'}
            </h2>
          </div>
          <div ref={strip} className="flex gap-5 md:gap-8 px-5 md:px-10 overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y', scrollbarWidth: 'none' }}>
            {slides.slice(0, 10).map((p, i) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="group relative w-[72vw] sm:w-[44vw] md:w-[22vw] shrink-0">
                <div className="aspect-[4/5] overflow-hidden bg-white">
                  <img src={p.images[0]} alt={lang === 'ar' ? p.name_ar : p.name_en} className="w-full h-full object-contain" loading="lazy" draggable={false} />
                </div>
                <div className="flex justify-between items-baseline mt-5">
                  <span className="font-display font-black uppercase text-lg md:text-2xl">0{i + 1} — {lang === 'ar' ? p.name_ar : p.name_en}</span>
                  <Price p={p} dark />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-8 md:py-12">
        <Reveal><h2 className="font-display font-black uppercase text-3xl md:text-5xl tracking-tight mb-8">{t.home.shopByCategory}</h2></Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-8">
          {categories.map((c) => {
            const items = slides.filter((p) => p.category_slug === c.slug);
            if (!items.length) return null;
            return (
              <Link key={c.slug} to={`/shop/${c.slug}`} className="group block bg-ivory text-ink overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-ink-2">
                  <img src={items[0].images[0]} alt="" loading="lazy" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="font-display font-black uppercase tracking-wide text-lg md:text-xl">{lang === 'ar' ? c.name_ar : c.name_en}</span>
                  <span className="text-xs font-display font-bold uppercase tracking-[0.15em]">{items.length} {lang === 'ar' ? 'موديل' : 'models'} {lang === 'ar' ? '←' : '→'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== STORY ===== */}
      <section className="bg-ink-2 border-y border-line">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-ivory mb-4">{t.home.storyKicker}</p>
            <h2 className="font-display font-black uppercase tracking-tight text-3xl md:text-5xl leading-none mb-5"><SplitWords text={t.home.storyTitle} /></h2>
            <Reveal><p className="text-concrete leading-relaxed text-base md:text-lg font-medium max-w-lg">{t.home.storyBody}</p></Reveal>
            <Reveal delay={0.1}><div className="grid grid-cols-3 gap-3 mt-6 max-w-lg">
              {(lang === 'ar' ? [['خفيفة','وزن خفيف'],['مريحة','نعل مبطّن'],['جريئة','ألوان مميزة']] : [['Light','Featherweight knit'],['Soft','Cushioned sole'],['Bold','Colours that pop']]).map(([a, b]) => (
                <div key={a} className="bg-ink-3 border-t-4 border-ivory px-3 py-3"><div className="font-display font-black uppercase text-lg text-ivory">{a}</div><div className="text-xs font-semibold text-concrete mt-1">{b}</div></div>
              ))}
            </div></Reveal>
            <Reveal delay={0.15}><Link to="/shop" className="inline-block mt-8 bg-ivory text-ink-2 font-display font-bold uppercase tracking-[0.14em] text-sm px-8 py-4 hover:bg-ivory-2 transition-colors">{t.actions.shopNow}</Link></Reveal>
          </div>
          <MaskImage src="/images/craft-1.webp" alt="SOLEVA craftsmanship" className="aspect-[4/3]" />
        </div>
      </section>

      {/* ===== BEST SELLERS ===== */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-8 md:py-12">
        <Reveal>
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display font-black uppercase text-3xl md:text-5xl tracking-tight">{t.home.bestSellers}</h2>
            <Link to="/collections/best" className="hidden md:block text-xs uppercase tracking-[0.25em] border-b border-ivory/40 pb-1 hover:border-ivory transition-colors">{t.actions.viewAll}</Link>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {bestSellers.slice(0,4).map((p, i) => <Reveal key={p.id} delay={i * 0.08}><ProductCard product={p} index={i} /></Reveal>)}
        </div>
      </section>

      {/* ===== CRAFTSMANSHIP ===== */}
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 pb-8 md:pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center">
        <MaskImage src="/images/craft-2.webp" alt="SOLEVA sole construction" className="aspect-[4/3] order-2 lg:order-1" />
        <div className="order-1 lg:order-2">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ivory mb-4">{t.home.craft}</p>
          <h2 className="font-display font-black uppercase text-3xl md:text-5xl tracking-tight mb-5">
            {lang === 'ar' ? <>214 نقطة فحص.<br /><span className="text-outline">لا استثناءات.</span></> : <>214 checkpoints.<br /><span className="text-outline">No exceptions.</span></>}
          </h2>
          <Reveal><p className="text-concrete leading-relaxed text-base md:text-lg font-medium max-w-lg">{t.home.craftBody}</p></Reveal>
          <div className="grid grid-cols-3 gap-6 mt-8 max-w-lg">
            {[['COD', lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on delivery'], ['214', lang === 'ar' ? 'نقطة فحص' : 'Quality checks'], ['48h', lang === 'ar' ? 'شحن سريع' : 'Fast dispatch']].map(([n, l]) => (
              <Reveal key={l}><div className="border-s border-line ps-4"><div className="font-display font-black text-2xl md:text-3xl">{n}</div><div className="text-concrete text-xs mt-1 uppercase tracking-wider">{l}</div></div></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CAMPAIGN GALLERY ===== */}
      <section className="border-y border-line bg-ink-2">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-8 md:py-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-ivory mb-8">{t.home.gallery}</p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <MaskImage src="/images/campaign-1.webp" alt="SOLEVA campaign one" className="md:col-span-7 aspect-[16/10]" />
            <MaskImage src="/images/campaign-2.webp" alt="SOLEVA campaign two" className="md:col-span-5 aspect-[16/10] md:aspect-auto" />
          </div>
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      {reviews.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-8 md:py-12">
          <Reveal><h2 className="font-display font-black uppercase text-3xl md:text-5xl tracking-tight mb-8 text-center">{t.home.reviews}</h2></Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <Reveal key={r.id} delay={i * 0.1}>
                <figure className="border border-line p-8 h-full flex flex-col">
                  <Stars rating={r.rating} />
                  <blockquote className="mt-5 font-display font-black uppercase tracking-tight text-xl leading-relaxed flex-1">“{r.title}”</blockquote>
                  <p className="mt-3 text-concrete text-sm leading-relaxed line-clamp-3">{r.body}</p>
                  <figcaption className="mt-6 text-xs uppercase tracking-[0.25em] text-concrete">{r.author_name}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ===== NEWSLETTER ===== */}
      <section className="border-t border-line">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-8 md:py-12 text-center">
          <Reveal>
            <h2 className="font-display font-black uppercase text-3xl md:text-5xl tracking-tight"><SplitWords text={t.home.newsletter} /></h2>
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
