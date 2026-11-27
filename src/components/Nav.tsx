import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../lang';
import { useStore } from '../store';
import { api } from '../api';

const MENU_FONT = '"Inter", "IBM Plex Sans Arabic", system-ui, sans-serif';

export default function Nav() {
  const { t, lang, setLang } = useLang();
  const { cartCount, setCartOpen, user, logout, wishlist } = useStore();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => { const y = window.scrollY; setScrolled(y > 40); if (y > last + 4 && y > 80) setHideNav(true); else if (y < last - 4 || y <= 80) setHideNav(false); last = y; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const y = window.scrollY, b = document.body;
    const prev = { position: b.style.position, top: b.style.top, width: b.style.width, overflow: b.style.overflow };
    b.style.position = 'fixed'; b.style.top = `-${y}px`; b.style.width = '100%'; b.style.overflow = 'hidden';
    return () => { b.style.position = prev.position; b.style.top = prev.top; b.style.width = prev.width; b.style.overflow = prev.overflow; window.scrollTo(0, y); };
  }, [open]);

  const links = [
    { to: '/', label: t.nav.home },
    { to: '/shop', label: t.nav.shop },
    { to: '/collections/new', label: t.nav.new },
    { to: '/collections/best', label: t.nav.best },
    { to: '/shop?gender=men', label: t.nav.men },
    { to: '/shop?gender=women', label: t.nav.women },
    { to: '/collections/sale', label: t.nav.sale },
    { to: '/about', label: t.nav.about },
    { to: '/contact', label: t.nav.contact },
  ];

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) { nav(`/shop?q=${encodeURIComponent(q.trim())}`); setSearchOpen(false); setQ(''); }
  };

  return (<>
    <header className={`fixed top-0 inset-x-0 z-[100] transition-all duration-300 ${hideNav ? '-translate-y-full' : ''} ${scrolled ? 'bg-ink border-b border-line' : 'bg-ink'}`}>
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 md:px-10 h-[72px] flex items-center justify-between gap-2 md:gap-6">
        <button className="lg:hidden p-1.5 -ms-1.5" onClick={() => setOpen(true)} aria-label="Menu">
          <div className="w-6 h-px bg-ivory mb-2" /><div className="w-6 h-px bg-ivory" />
        </button>

        <Link to="/" className="font-display font-black text-[17px] sm:text-2xl tracking-[0.1em] sm:tracking-[0.18em] select-none">SOLEVA</Link>

        <nav className="hidden lg:flex items-center gap-8 text-[13px] uppercase tracking-[0.14em] text-ivory/80">
          {links.slice(0, 6).map((l) => <Link key={l.to} to={l.to} className="nav-link hover:text-ivory transition-colors">{l.label}</Link>)}
        </nav>

        <div className="flex items-center gap-0 sm:gap-1 md:gap-2">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="px-2 py-0.5 text-[11px] mx-1 uppercase tracking-widest text-ivory/70 hover:text-ivory border border-line rounded-full" aria-label="Language">
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
          <button onClick={() => setSearchOpen(true)} className="p-1.5 sm:p-2 hover:opacity-70 transition-opacity" aria-label={t.actions.search}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
          <Link to="/wishlist" className="p-1.5 sm:p-2 hover:opacity-70 transition-opacity relative" aria-label={t.actions.addToWishlist}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 21C7 16.5 3 13.3 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 4.3-4 7.5-9 12Z" /></svg>
            {wishlist.length > 0 && <span className="absolute -top-0.5 -end-0.5 w-4 h-4 rounded-full bg-ivory text-ink text-[10px] grid place-items-center font-bold">{wishlist.length}</span>}
          </Link>
          <Link to={user ? '/account' : '/login'} className="p-1.5 sm:p-2 hover:opacity-70 transition-opacity" aria-label={t.actions.signIn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>
          </Link>
          <button onClick={() => setCartOpen(true)} className="p-1.5 sm:p-2 hover:opacity-70 transition-opacity relative" aria-label={t.cart.title}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 7h12l1.5 13.5a1 1 0 0 1-1 1.1h-13a1 1 0 0 1-1-1.1L6 7Z" /><path d="M9 10V6a3 3 0 0 1 6 0v4" /></svg>
            {cartCount > 0 && <span className="absolute -top-0.5 -end-0.5 w-4 h-4 rounded-full bg-ivory text-ink text-[10px] grid place-items-center font-bold">{cartCount}</span>}
          </button>
          <Link to="/shop" className="hidden md:inline-block ms-2 bg-ivory text-ink text-xs font-semibold uppercase tracking-[0.14em] px-5 py-2.5 hover:bg-silver transition-colors">{t.actions.shopNow}</Link>
        </div>
      </div>
    </header>

    {/* Mobile menu */}
    <div className={`fixed inset-0 z-[200] bg-ink flex flex-col overscroll-contain transition-transform duration-500 lg:hidden ${open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'}`} style={{ transitionTimingFunction: 'cubic-bezier(.76,0,.24,1)', height: '100dvh', fontFamily: MENU_FONT }}>
      <div className="flex items-center justify-between px-5 h-[72px] shrink-0 border-b border-line">
        <span className="font-display font-black text-xl tracking-[0.18em]">SOLEVA</span>
        <button onClick={() => setOpen(false)} className="p-2 text-2xl leading-none" aria-label={t.actions.close}>×</button>
      </div>
      <nav className="flex flex-col px-5 pt-2 flex-1 min-h-0 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 'calc(env(safe-area-inset-bottom) + 110px)' }}>
        {links.map((l, i) => (
          <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
            className="font-semibold text-xl py-2.5 border-b border-line/50 tracking-wide"
            style={{ transitionDelay: `${i * 40}ms` }}>{l.label}</Link>
        ))}
        <Link to="/track" onClick={() => setOpen(false)} className="font-medium text-base py-2.5 text-concrete tracking-wide">{t.nav.track}</Link>
        <Link to="/size-guide" onClick={() => setOpen(false)} className="font-medium text-base py-2.5 text-concrete tracking-wide">{t.nav.sizeGuide}</Link>
        {user ? (
          <button onClick={() => { logout(); setOpen(false); }} className="text-start font-medium text-base py-2.5 text-concrete tracking-wide">{t.actions.signOut}</button>
        ) : null}
      </nav>
    </div>

    {/* Search overlay */}
    {searchOpen && (
      <div className="fixed inset-0 z-[300] bg-ink/95 backdrop-blur flex flex-col items-center pt-[20vh] px-6" onClick={() => setSearchOpen(false)}>
        <form onSubmit={submitSearch} className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.actions.search}
            className="w-full bg-transparent border-b border-ivory/40 focus:border-ivory outline-none font-display font-bold text-3xl md:text-5xl py-4 placeholder:text-concrete/50" />
          <p className="mt-4 text-concrete text-xs uppercase tracking-[0.25em]">SOLEVA — {t.actions.search}</p>
        </form>
        <button onClick={() => setSearchOpen(false)} className="absolute top-6 end-6 text-3xl" aria-label={t.actions.close}>×</button>
      </div>
    )}
  </>);
}
