import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useLang } from '../lang';
import { api, type Product } from '../api';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';

const F = { fontFamily: '"Inter", "IBM Plex Sans Arabic", system-ui, sans-serif' } as const;
const card = 'bg-white border border-line rounded-xl p-5 md:p-6';
const btn = 'bg-ivory text-ink font-bold text-sm px-6 py-3 rounded-lg hover:bg-ivory-2 transition-colors';
const statusStyle: Record<string, string> = { placed: 'bg-ink text-ivory', confirmed: 'bg-ink text-ivory', shipped: 'bg-ivory text-ink', delivered: 'bg-ivory text-ink', cancelled: 'bg-white text-ivory border border-ivory' };

function useOrders() {
  const [orders, setOrders] = useState<any[] | null>(null);
  useEffect(() => { api<{ orders: any[] }>('/orders/mine').then((d) => setOrders(d.orders)).catch(() => setOrders([])); }, []);
  return orders;
}

export default function Account() {
  const { lang } = useLang();
  const ar = lang === 'ar';
  const { user, authReady, logout } = useStore();
  const nav = useNavigate();
  if (authReady && !user) return <Navigate to="/login" replace />;
  if (!user) return null;

  const tabs = [
    { to: '/account', label: ar ? 'نظرة عامة' : 'Overview', end: true },
    { to: '/account/profile', label: ar ? 'الملف الشخصي' : 'Profile' },
    { to: '/account/orders', label: ar ? 'الطلبات' : 'Orders' },
    { to: '/account/addresses', label: ar ? 'العناوين' : 'Addresses' },
    { to: '/account/wishlist', label: ar ? 'المفضلة' : 'Wishlist' },
    { to: '/account/settings', label: ar ? 'الإعدادات' : 'Settings' },
  ];
  const first = (user.full_name || '').split(' ')[0];

  return (
    <div className="bg-white" style={F}>
      <div className="max-w-[1300px] mx-auto px-5 md:px-10 pt-28 md:pt-32 pb-20 min-h-[80vh]">
        <div className="band-cobalt -mt-28 md:-mt-32 pt-28 md:pt-32 pb-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-ivory">{ar ? `أهلاً، ${first}` : `Welcome back, ${first}`}</h1>
            <p className="text-ivory mt-1 text-base">{user.email}</p>
          </div>
          <button onClick={() => { logout(); nav('/'); }} className="text-sm font-semibold text-ivory border-2 border-ivory rounded-lg px-5 py-2.5 hover:bg-ivory hover:text-ink">{ar ? 'تسجيل الخروج' : 'Sign out'}</button>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <nav className="md:w-60 shrink-0 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {tabs.map((tab) => (
              <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => `whitespace-nowrap text-sm font-semibold px-4 py-3 rounded-lg border ${isActive ? 'bg-ink text-ivory border-ivory' : 'bg-white text-ivory border-line hover:bg-ink-3'}`}>{tab.label}</NavLink>
            ))}
          </nav>
          <div className="flex-1 min-w-0">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="profile" element={<Profile />} />
              <Route path="orders" element={<Orders />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="wishlist" element={<Wish />} />
              <Route path="settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ o }: { o: any }) {
  const { t, lang, fmt } = useLang();
  const ar = lang === 'ar';
  const { user } = useStore();
  return (
    <div className={`${card} flex flex-wrap items-center justify-between gap-4`}>
      <div>
        <p className="font-bold text-base text-ivory">{o.order_number}</p>
        <p className="text-sm text-ivory mt-0.5">{new Date(o.created_at).toLocaleDateString(ar ? 'ar-EG' : 'en-GB')}</p>
      </div>
      <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusStyle[o.status] || 'bg-ink text-ivory'}`}>{(t.track.statuses as any)[o.status]}</span>
      <span className="font-bold text-base text-ivory">{fmt(o.total)}</span>
      <Link to={`/track?order=${encodeURIComponent(o.order_number)}&email=${encodeURIComponent(user?.email || '')}`} className="text-sm font-semibold text-ivory underline">{ar ? 'تتبع الطلب' : 'Track order'}</Link>
    </div>
  );
}

function Overview() {
  const { lang, fmt } = useLang();
  const ar = lang === 'ar';
  const { user, wishlist } = useStore();
  const orders = useOrders();
  const active = (orders || []).filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const spent = (orders || []).filter((o) => o.status !== 'cancelled').reduce((n, o) => n + Number(o.total || 0), 0);
  const stats = [
    { k: ar ? 'إجمالي الطلبات' : 'Total orders', v: orders ? String(orders.length) : '…' },
    { k: ar ? 'طلبات جارية' : 'Active orders', v: orders ? String(active) : '…' },
    { k: ar ? 'المفضلة' : 'Wishlist items', v: String(wishlist.length) },
    { k: ar ? 'إجمالي المشتريات' : 'Total spent', v: orders ? fmt(spent) : '…' },
  ];
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (<div key={s.k} className="bg-ink border border-ivory rounded-xl p-4 md:p-5"><p className="text-sm font-semibold text-ivory">{s.k}</p><p className="text-2xl md:text-3xl font-extrabold text-ivory mt-1">{s.v}</p></div>))}
      </div>
      <section>
        <div className="flex items-center justify-between mb-3"><h2 className="text-xl font-bold text-ivory">{ar ? 'أحدث الطلبات' : 'Recent orders'}</h2><Link to="/account/orders" className="text-sm font-semibold text-ivory underline">{ar ? 'عرض الكل' : 'View all'}</Link></div>
        {orders === null ? <p className="text-ivory">…</p> : orders.length === 0 ? <div className={card}><p className="text-ivory">{ar ? 'لا توجد طلبات بعد.' : 'No orders yet.'}</p><Link to="/shop" className={`${btn} inline-block mt-4`}>{ar ? 'تسوق الآن' : 'Start shopping'}</Link></div> : <div className="space-y-3">{orders.slice(0, 3).map((o) => <OrderRow key={o.id} o={o} />)}</div>}
      </section>
      <section className="grid sm:grid-cols-2 gap-4">
        <div className={card}><h3 className="font-bold text-ivory text-lg">{ar ? 'الملف الشخصي' : 'Your details'}</h3><p className="text-ivory mt-2">{user?.full_name}</p><p className="text-ivory">{user?.email}</p>{user?.phone && <p className="text-ivory" dir="ltr">{user.phone}</p>}<Link to="/account/profile" className="text-sm font-semibold text-ivory underline inline-block mt-3">{ar ? 'تعديل' : 'Edit profile'}</Link></div>
        <div className={card}><h3 className="font-bold text-ivory text-lg">{ar ? 'روابط سريعة' : 'Quick links'}</h3><div className="flex flex-col gap-2 mt-2 text-ivory font-semibold underline"><Link to="/account/addresses">{ar ? 'العناوين المحفوظة' : 'Saved addresses'}</Link><Link to="/account/wishlist">{ar ? 'المفضلة' : 'Wishlist'}</Link><Link to="/account/settings">{ar ? 'كلمة المرور واللغة' : 'Password & language'}</Link><Link to="/track">{ar ? 'تتبع طلب' : 'Track an order'}</Link></div></div>
      </section>
    </div>
  );
}

function Profile() {
  const { lang, t } = useLang();
  const ar = lang === 'ar';
  const { user, refreshUser, showToast } = useStore();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/auth/me', { method: 'PUT', body: JSON.stringify(form) });
    await refreshUser();
    showToast(t.actions.save + ' ✓');
  };
  return (
    <form onSubmit={save} className={`${card} max-w-lg space-y-5`}>
      <h2 className="text-xl font-bold text-ivory">{ar ? 'بيانات الملف الشخصي' : 'Profile details'}</h2>
      <label className="block text-sm font-semibold text-ivory">{ar ? 'الاسم الكامل' : 'Full name'}<input className="input-line mt-1" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
      <label className="block text-sm font-semibold text-ivory">{ar ? 'البريد الإلكتروني' : 'Email'}<input className="input-line mt-1 opacity-70" value={user?.email || ''} readOnly dir="ltr" /></label>
      <label className="block text-sm font-semibold text-ivory">{ar ? 'الهاتف' : 'Phone'}<input className="input-line mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" /></label>
      <button className={btn}>{t.actions.save}</button>
    </form>
  );
}

function Orders() {
  const { lang } = useLang();
  const ar = lang === 'ar';
  const orders = useOrders();
  if (orders === null) return <p className="text-ivory">…</p>;
  if (!orders.length) return <div className={card}><p className="text-ivory">{ar ? 'لا توجد طلبات بعد.' : 'No orders yet.'}</p><Link to="/shop" className={`${btn} inline-block mt-4`}>{ar ? 'تسوق الآن' : 'Start shopping'}</Link></div>;
  return <div className="space-y-3">{orders.map((o) => <OrderRow key={o.id} o={o} />)}</div>;
}

function Addresses() {
  const { t } = useLang();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [governorates, setGovernorates] = useState<{ name: string }[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: 'Home', full_name: '', phone: '', governorate: 'Cairo', city: '', area: '', street: '', postal_code: '' });
  const load = () => api<{ addresses: any[] }>('/addresses').then((d) => setAddresses(d.addresses)).catch(() => {});
  useEffect(() => { load(); api<{ governorates: any[] }>('/shipping').then((d) => setGovernorates(d.governorates)).catch(() => {}); }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/addresses', { method: 'POST', body: JSON.stringify(form) });
    setAdding(false); load();
  };

  return (
    <div>
      {!addresses.length && !adding && <p className="text-concrete mb-6">{t.account.noAddresses}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {addresses.map((a) => (
          <div key={a.id} className="bg-white border border-line p-5 relative rounded-xl">
            {a.is_default && <span className="absolute top-3 end-3 text-[10px] uppercase tracking-widest text-silver">★</span>}
            <p className="font-display font-semibold">{a.label}</p>
            <p className="text-sm text-ivory mt-2 leading-relaxed">{a.full_name}<br />{a.street}{a.area ? `, ${a.area}` : ''}<br />{a.city}, {a.governorate}<br /><span dir="ltr">{a.phone}</span></p>
            <button onClick={async () => { await api(`/addresses/${a.id}`, { method: 'DELETE' }); load(); }} className="mt-3 text-sm text-ivory underline">{t.actions.delete}</button>
          </div>
        ))}
      </div>
      {adding ? (
        <form onSubmit={save} className="max-w-md space-y-5 border border-line p-6 rounded-xl bg-white">
          <input required className="input-line" placeholder={t.account.label} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <input required className="input-line" placeholder={t.checkout.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          <input required className="input-line" placeholder={t.checkout.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
          <select className="input-line" value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })}>
            {governorates.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
          </select>
          <input required className="input-line" placeholder={t.checkout.city} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="input-line" placeholder={t.checkout.area} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          <input required className="input-line" placeholder={t.checkout.street} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
          <div className="flex gap-3">
            <button className="bg-ivory text-ink font-bold text-sm px-6 py-3 rounded-lg">{t.actions.saveAddress}</button>
            <button type="button" onClick={() => setAdding(false)} className="text-sm text-ivory underline">{t.actions.cancel}</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="border-2 border-ivory text-ivory font-bold text-sm px-6 py-3 rounded-lg hover:bg-ink">+ {t.account.addAddress}</button>
      )}
    </div>
  );
}

function Wish() {
  const { lang } = useLang();
  const ar = lang === 'ar';
  const { wishlist } = useStore();
  const [items, setItems] = useState<Product[] | null>(null);
  useEffect(() => { api<{ items: Product[] }>('/products?limit=60').then((d) => setItems(d.items.filter((p) => wishlist.includes(p.id)))).catch(() => setItems([])); }, [wishlist]);
  if (items === null) return <p className="text-ivory">…</p>;
  if (!items.length) return <div className={card}><p className="text-ivory">{ar ? 'قائمة المفضلة فارغة.' : 'Your wishlist is empty.'}</p><Link to="/shop" className={`${btn} inline-block mt-4`}>{ar ? 'تصفح المنتجات' : 'Browse products'}</Link></div>;
  return <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>;
}

function Settings() {
  const { t, lang, setLang } = useLang();
  const ar = lang === 'ar';
  const { showToast } = useStore();
  const [form, setForm] = useState({ current_password: '', new_password: '' });
  const [error, setError] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api('/auth/me', { method: 'PUT', body: JSON.stringify(form) });
      setForm({ current_password: '', new_password: '' });
      showToast(t.actions.save + ' ✓');
    } catch (err: any) { setError(err.data?.error || t.misc.error); }
  };
  return (
    <div className="space-y-6 max-w-lg">
      <form onSubmit={save} className={`${card} space-y-5`}>
        <h2 className="text-xl font-bold text-ivory">{ar ? 'تغيير كلمة المرور' : 'Change password'}</h2>
        <label className="block text-sm font-semibold text-ivory">{ar ? 'كلمة المرور الحالية' : 'Current password'}<input required type="password" className="input-line mt-1" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} dir="ltr" /></label>
        <label className="block text-sm font-semibold text-ivory">{ar ? 'كلمة المرور الجديدة (8 أحرف على الأقل)' : 'New password (min 8 characters)'}<input required minLength={8} type="password" className="input-line mt-1" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} dir="ltr" /></label>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button className={btn}>{t.actions.save}</button>
      </form>
      <div className={card}>
        <h2 className="text-xl font-bold text-ivory mb-3">{ar ? 'اللغة' : 'Language'}</h2>
        <div className="flex gap-3">
          <button onClick={() => setLang('en')} className={`px-5 py-2.5 rounded-lg text-sm font-bold border-2 border-ivory ${lang === 'en' ? 'bg-ivory text-ink' : 'text-ivory'}`}>English</button>
          <button onClick={() => setLang('ar')} className={`px-5 py-2.5 rounded-lg text-sm font-bold border-2 border-ivory ${lang === 'ar' ? 'bg-ivory text-ink' : 'text-ivory'}`}>العربية</button>
        </div>
      </div>
    </div>
  );
}
