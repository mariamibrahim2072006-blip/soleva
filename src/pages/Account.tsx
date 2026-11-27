import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useLang } from '../lang';
import { api } from '../api';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';

export default function Account() {
  const { t } = useLang();
  const { user, authReady, logout } = useStore();
  const nav = useNavigate();

  if (authReady && !user) return <Navigate to="/login" replace />;
  if (!user) return null;

  const tabs = [
    { to: '/account', label: t.account.profile, end: true },
    { to: '/account/orders', label: t.account.orders },
    { to: '/account/addresses', label: t.account.addresses },
    { to: '/account/settings', label: t.account.settings },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-28 md:pt-36 pb-24 min-h-screen">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
        <div>
          <h1 className="font-display font-black uppercase text-4xl md:text-5xl tracking-tight">{t.account.title}</h1>
          <p className="text-concrete mt-2">{user.full_name} · {user.email}</p>
        </div>
        <button onClick={() => { logout(); nav('/'); }} className="text-xs uppercase tracking-[0.2em] text-concrete border-b border-line pb-1 hover:text-ivory">{t.actions.signOut}</button>
      </div>
      <div className="flex flex-col md:flex-row gap-10">
        <nav className="md:w-56 shrink-0 flex md:flex-col gap-1 overflow-x-auto border-b md:border-b-0 md:border-e border-line md:pe-6 pb-4 md:pb-0">
          {tabs.map((tab) => (
            <Link key={tab.to} to={tab.to} className="text-sm uppercase tracking-widest py-2.5 text-concrete hover:text-ivory whitespace-nowrap">{tab.label}</Link>
          ))}
          <Link to="/wishlist" className="text-sm uppercase tracking-widest py-2.5 text-concrete hover:text-ivory whitespace-nowrap">{t.account.wishlist}</Link>
        </nav>
        <div className="flex-1 min-w-0">
          <Routes>
            <Route index element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  const { t } = useLang();
  const { user, refreshUser, showToast } = useStore();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/auth/me', { method: 'PUT', body: JSON.stringify(form) });
    await refreshUser();
    showToast(t.actions.save + ' ✓');
  };
  return (
    <form onSubmit={save} className="max-w-md space-y-6">
      <input className="input-line" placeholder={t.auth.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      <input className="input-line" placeholder={t.auth.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
      <button className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-8 py-3.5 hover:bg-silver transition-colors">{t.actions.save}</button>
    </form>
  );
}

function Orders() {
  const { t, lang, fmt } = useLang();
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { api<{ orders: any[] }>('/orders/mine').then((d) => setOrders(d.orders)).catch(() => {}); }, []);
  if (!orders.length) return <p className="text-concrete">{t.account.noOrders}</p>;
  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="border border-line p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold">{o.order_number}</p>
            <p className="text-concrete text-xs mt-1">{new Date(o.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</p>
          </div>
          <span className="text-xs uppercase tracking-widest px-3 py-1.5 border border-line">{(t.track.statuses as any)[o.status]}</span>
          <span className="font-display font-bold">{fmt(o.total)}</span>
        </div>
      ))}
    </div>
  );
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
          <div key={a.id} className="border border-line p-5 relative">
            {a.is_default && <span className="absolute top-3 end-3 text-[10px] uppercase tracking-widest text-silver">★</span>}
            <p className="font-display font-semibold">{a.label}</p>
            <p className="text-sm text-concrete mt-2 leading-relaxed">{a.full_name}<br />{a.street}{a.area ? `, ${a.area}` : ''}<br />{a.city}, {a.governorate}<br /><span dir="ltr">{a.phone}</span></p>
            <button onClick={async () => { await api(`/addresses/${a.id}`, { method: 'DELETE' }); load(); }} className="mt-3 text-xs text-concrete underline hover:text-ivory">{t.actions.delete}</button>
          </div>
        ))}
      </div>
      {adding ? (
        <form onSubmit={save} className="max-w-md space-y-5 border border-line p-6">
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
            <button className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.15em] text-xs px-6 py-3">{t.actions.saveAddress}</button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs uppercase tracking-widest text-concrete">{t.actions.cancel}</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAdding(true)} className="border border-ivory font-display font-bold uppercase tracking-[0.15em] text-xs px-6 py-3 hover:bg-ivory/5">+ {t.account.addAddress}</button>
      )}
    </div>
  );
}

function Settings() {
  const { t } = useLang();
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
    <form onSubmit={save} className="max-w-md space-y-6">
      <input required type="password" className="input-line" placeholder={t.account.currentPassword} value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} dir="ltr" />
      <input required minLength={8} type="password" className="input-line" placeholder={t.account.newPassword} value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} dir="ltr" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-8 py-3.5 hover:bg-silver transition-colors">{t.actions.save}</button>
    </form>
  );
}
