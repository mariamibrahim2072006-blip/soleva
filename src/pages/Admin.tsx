import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useLang } from '../lang';
import { api, getToken } from '../api';
import { useStore } from '../store';

export default function Admin() {
  const { t } = useLang();
  const { user, authReady } = useStore();
  if (authReady && (!user || user.role !== 'admin')) {
    return (
      <div className="min-h-screen grid place-items-center px-5 text-center">
        <div>
          <h1 className="font-display font-black uppercase text-4xl">SOLEVA Admin</h1>
          <p className="text-concrete mt-4">{t.misc.error}</p>
          <Link to="/login" className="inline-block mt-8 bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-8 py-3.5">{t.actions.signIn}</Link>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const tabs = [
    { to: '/admin', label: t.admin.dashboard, end: true },
    { to: '/admin/products', label: t.admin.products },
    { to: '/admin/orders', label: t.admin.orders },
    { to: '/admin/customers', label: t.admin.customers },
    { to: '/admin/coupons', label: t.admin.coupons },
  ];

  return (
    <div className="min-h-screen bg-ink">
      <header className="border-b border-line">
        <div className="max-w-[1500px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <span className="font-display font-black tracking-[0.18em]">SOLEVA <span className="text-concrete font-normal text-sm">ADMIN</span></span>
          <Link to="/" className="text-xs uppercase tracking-[0.2em] text-concrete hover:text-ivory">{t.admin.backToStore} →</Link>
        </div>
      </header>
      <div className="max-w-[1500px] mx-auto px-5 md:px-8 py-8 flex flex-col md:flex-row gap-8">
        <nav className="md:w-48 shrink-0 flex md:flex-col gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <Link key={tab.to} to={tab.to} className="text-sm uppercase tracking-widest py-2.5 px-3 text-concrete hover:text-ivory hover:bg-ink-2 whitespace-nowrap">{tab.label}</Link>
          ))}
        </nav>
        <div className="flex-1 min-w-0">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="customers" element={<Customers />} />
            <Route path="coupons" element={<Coupons />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { t, fmt } = useLang();
  const [s, setS] = useState<any>(null);
  useEffect(() => { api('/admin/stats').then(setS).catch(() => {}); }, []);
  if (!s) return <div className="h-40 grid place-items-center text-concrete animate-pulse">…</div>;
  const cards = [
    [t.admin.revenue, fmt(s.revenue)], [t.admin.totalOrders, s.orders],
    [t.admin.totalProducts, s.products], [t.admin.totalCustomers, s.customers],
  ];
  const maxDay = Math.max(1, ...s.daily.map((d: any) => d.revenue));
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([l, v]) => (
          <div key={String(l)} className="border border-line p-5">
            <p className="text-concrete text-[10px] uppercase tracking-[0.2em]">{l}</p>
            <p className="font-display font-black text-2xl mt-2">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-line p-5">
          <p className="text-concrete text-[10px] uppercase tracking-[0.2em] mb-4">{t.admin.salesLast30}</p>
          <div className="flex items-end gap-1 h-32">
            {s.daily.length === 0 && <p className="text-concrete text-sm">—</p>}
            {s.daily.map((d: any) => (
              <div key={d.day} className="flex-1 bg-ivory/80 hover:bg-ivory transition-colors" style={{ height: `${Math.max(4, (d.revenue / maxDay) * 100)}%` }} title={`${d.day}: ${fmt(d.revenue)}`} />
            ))}
          </div>
        </div>
        <div className="border border-line p-5">
          <p className="text-concrete text-[10px] uppercase tracking-[0.2em] mb-4">{t.admin.bestSellers}</p>
          <div className="space-y-3">
            {s.best_sellers.length === 0 && <p className="text-concrete text-sm">—</p>}
            {s.best_sellers.map((b: any) => (
              <div key={b.name_en} className="flex justify-between text-sm"><span>{b.name_en}</span><span className="text-concrete">{b.sold} · {fmt(b.revenue)}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="border border-line p-5">
        <p className="text-concrete text-[10px] uppercase tracking-[0.2em] mb-4">{t.admin.recentOrders}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm admin-table">
            <thead><tr className="text-concrete text-xs uppercase tracking-widest border-b border-line"><th className="py-2">#</th><th>{t.checkout.fullName}</th><th>{t.cart.total}</th><th>{t.admin.status}</th><th></th></tr></thead>
            <tbody>
              {s.recent_orders.map((o: any) => (
                <tr key={o.order_number} className="border-b border-line/50 text-center">
                  <td className="py-2.5 font-semibold">{o.order_number}</td><td>{o.full_name}</td><td>{fmt(o.total)}</td><td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Products() {
  const { t, lang, fmt } = useLang();
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const load = () => api<{ items: any[] }>('/admin/products').then((d) => setItems(d.items)).catch(() => {});
  useEffect(() => { load(); }, []);

  const del = async (id: string) => { await api(`/admin/products/${id}`, { method: 'DELETE' }); load(); };
  const adjustStock = async (p: any, variantId: number, delta: number) => {
    const v = p.variants.find((x: any) => x.id === variantId);
    const colorIdx = p.colors.findIndex((c: any) => c.id === v.color_id);
    await api(`/admin/products/${p.id}`, { method: 'PUT', body: JSON.stringify({ variants: [{ color_index: colorIdx, size: v.size, stock: Math.max(0, v.stock + delta) }] }) });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display font-bold uppercase tracking-widest">{t.admin.products} ({items.length})</h2>
        <button onClick={() => setEditing({})} className="bg-ivory text-ink text-xs font-bold uppercase tracking-[0.15em] px-4 py-2.5">+ {t.admin.addProduct}</button>
      </div>
      <div className="space-y-3">
        {items.map((p) => (
          <div key={p.id} className="border border-line p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 aspect-[4/5] bg-ivory-2 overflow-hidden shrink-0">{p.images[0] && <img src={p.images[0]} className="w-full h-full object-cover" alt="" />}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{lang === 'ar' ? p.name_ar : p.name_en}</p>
                <p className="text-concrete text-xs">{p.slug} · {fmt(p.price)} · {t.product.inStock}: {p.total_stock}</p>
              </div>
              <button onClick={() => setEditing(p)} className="text-xs uppercase tracking-widest text-concrete hover:text-ivory border border-line px-3 py-1.5">{t.actions.edit}</button>
              <button onClick={() => del(p.id)} className="text-xs uppercase tracking-widest text-red-400/70 hover:text-red-400 border border-line px-3 py-1.5">{t.actions.delete}</button>
            </div>
            <details className="mt-3">
              <summary className="text-xs text-concrete cursor-pointer uppercase tracking-widest">Stock</summary>
              <div className="flex flex-wrap gap-2 mt-2">
                {p.variants.map((v: any) => (
                  <span key={v.id} className="inline-flex items-center gap-1 border border-line text-xs px-2 py-1">
                    EU {v.size}: {v.stock}
                    <button onClick={() => adjustStock(p, v.id, -1)} className="text-concrete hover:text-ivory px-1">−</button>
                    <button onClick={() => adjustStock(p, v.id, 1)} className="text-concrete hover:text-ivory px-1">+</button>
                  </span>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
      {editing && <ProductEditor product={editing} onClose={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function ProductEditor({ product, onClose }: { product: any; onClose: () => void }) {
  const { t } = useLang();
  const isNew = !product.id;
  const [f, setF] = useState({
    slug: product.slug || '', name_en: product.name_en || '', name_ar: product.name_ar || '',
    description_en: product.description_en || '', description_ar: product.description_ar || '',
    category_slug: product.category_slug || 'sneakers', gender: product.gender || 'unisex',
    base_price: product.base_price || 0, sale_price: product.sale_price || '',
    material_en: product.material_en || '', material_ar: product.material_ar || '',
    is_new: !!product.is_new, is_best_seller: !!product.is_best_seller, is_signature: !!product.is_signature,
    images: (product.images || []).join('\n'),
  });
  const [error, setError] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const body: any = {
      ...f,
      base_price: +f.base_price,
      sale_price: f.sale_price === '' || f.sale_price === null ? null : +f.sale_price,
      images: f.images.split('\n').map((s: string) => s.trim()).filter(Boolean),
    };
    if (isNew) {
      body.colors = [{ name_en: 'Black', name_ar: 'أسود', hex: '#111111' }];
      body.variants = ['40', '41', '42', '43', '44', '45'].map((size) => ({ color_index: 0, size, stock: 10 }));
    }
    try {
      await api(isNew ? '/admin/products' : `/admin/products/${product.id}`, { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(body) });
      onClose();
    } catch (err: any) { setError(err.data?.error || t.misc.error); }
  };

  return (
    <div className="fixed inset-0 z-[600] bg-ink/90 backdrop-blur overflow-y-auto p-6" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="max-w-2xl mx-auto bg-ink-2 border border-line p-8 my-10 space-y-5">
        <div className="flex justify-between items-center">
          <h3 className="font-display font-bold uppercase tracking-widest">{isNew ? t.admin.addProduct : t.actions.edit}</h3>
          <button type="button" onClick={onClose} className="text-2xl">×</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input required className="input-line" placeholder="slug" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} dir="ltr" />
          <select className="input-line" value={f.category_slug} onChange={(e) => setF({ ...f, category_slug: e.target.value })}>
            {['sneakers', 'running', 'casual', 'formal', 'boots', 'loafers', 'sandals', 'sports'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input required className="input-line" placeholder="Name EN" value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} />
          <input required className="input-line" placeholder="الاسم بالعربية" value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} />
          <select className="input-line" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
            {['unisex', 'men', 'women'].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <div className="flex gap-4">
            <input required type="number" className="input-line" placeholder="Price EGP" value={f.base_price} onChange={(e) => setF({ ...f, base_price: e.target.value as any })} dir="ltr" />
            <input type="number" className="input-line" placeholder="Sale price" value={f.sale_price as any} onChange={(e) => setF({ ...f, sale_price: e.target.value as any })} dir="ltr" />
          </div>
          <input className="input-line" placeholder="Material EN" value={f.material_en} onChange={(e) => setF({ ...f, material_en: e.target.value })} />
          <input className="input-line" placeholder="الخامة بالعربية" value={f.material_ar} onChange={(e) => setF({ ...f, material_ar: e.target.value })} />
        </div>
        <textarea className="input-line min-h-20" placeholder="Description EN" value={f.description_en} onChange={(e) => setF({ ...f, description_en: e.target.value })} />
        <textarea className="input-line min-h-20" placeholder="الوصف بالعربية" value={f.description_ar} onChange={(e) => setF({ ...f, description_ar: e.target.value })} />
        <textarea className="input-line min-h-20" placeholder="Image URLs (one per line)" value={f.images} onChange={(e) => setF({ ...f, images: e.target.value })} dir="ltr" />
        <div className="flex gap-6 text-sm text-concrete">
          {[['is_new', 'New'], ['is_best_seller', 'Best Seller'], ['is_signature', 'Signature']].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(f as any)[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} className="accent-[#0864E8]" />{l}
            </label>
          ))}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-8 py-3.5">{t.actions.save}</button>
      </form>
    </div>
  );
}

function Orders() {
  const { t, lang, fmt } = useLang();
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const load = () => api<{ orders: any[] }>(`/admin/orders${filter ? `?status=${filter}` : ''}`).then((d) => setOrders(d.orders)).catch(() => {});
  useEffect(() => { load(); }, [filter]);

  const setStatus = async (orderNumber: string, status: string) => {
    await api(`/admin/orders/${orderNumber}`, { method: 'PUT', body: JSON.stringify({ status }) });
    load();
    if (selected?.order_number === orderNumber) {
      const d = await api<any>(`/admin/orders/${orderNumber}`);
      setSelected(d.order);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {['', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`text-xs uppercase tracking-widest px-3 py-1.5 border ${filter === s ? 'border-ivory bg-ivory text-ink font-bold' : 'border-line text-concrete'}`}>
            {s === '' ? 'All' : (t.track.statuses as any)[s]}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="border border-line p-4 flex flex-wrap items-center gap-4">
            <button onClick={async () => { const d = await api<any>(`/admin/orders/${o.order_number}`); setSelected({ ...d.order, items: d.items }); }} className="font-display font-bold hover:underline">{o.order_number}</button>
            <span className="text-sm text-concrete">{o.full_name} · {o.governorate}</span>
            <span className="text-sm">{fmt(o.total)}</span>
            <span className="text-xs text-concrete">{new Date(o.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</span>
            <select value={o.status} onChange={(e) => setStatus(o.order_number, e.target.value)} className="ms-auto bg-transparent border border-line text-xs px-2 py-1.5 uppercase tracking-widest">
              {['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => <option key={s} value={s} className="bg-ink-2">{(t.track.statuses as any)[s]}</option>)}
            </select>
          </div>
        ))}
        {!orders.length && <p className="text-concrete">—</p>}
      </div>
      {selected && (
        <div className="fixed inset-0 z-[600] bg-ink/90 backdrop-blur overflow-y-auto p-6" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="max-w-xl mx-auto bg-ink-2 border border-line p-8 my-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold">{selected.order_number}</h3>
              <button onClick={() => setSelected(null)} className="text-2xl">×</button>
            </div>
            <div className="space-y-2 text-sm text-concrete mb-6">
              <p>{selected.full_name} · <span dir="ltr">{selected.phone}</span></p>
              <p>{selected.email}</p>
              <p>{selected.street}{selected.area ? `, ${selected.area}` : ''}, {selected.city}, {selected.governorate}</p>
              {selected.notes && <p>“{selected.notes}”</p>}
            </div>
            <div className="border-t border-line pt-4 space-y-2 text-sm">
              {(selected.items || []).map((i: any) => (
                <div key={i.id} className="flex justify-between"><span>{lang === 'ar' ? i.name_ar : i.name_en} — EU {i.size} × {i.qty}</span><span>{fmt(i.unit_price * i.qty)}</span></div>
              ))}
              <div className="flex justify-between text-concrete pt-2 border-t border-line"><span>{t.cart.subtotal}</span><span>{fmt(selected.subtotal)}</span></div>
              {selected.discount > 0 && <div className="flex justify-between text-silver"><span>{t.cart.discount}</span><span>−{fmt(selected.discount)}</span></div>}
              <div className="flex justify-between text-concrete"><span>{t.cart.shipping}</span><span>{selected.shipping_fee === 0 ? t.cart.freeShipping : fmt(selected.shipping_fee)}</span></div>
              <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-line"><span>{t.cart.total}</span><span>{fmt(selected.total)}</span></div>
            </div>
            <p className="mt-4 text-xs uppercase tracking-widest text-concrete">{selected.payment_method === 'cod' ? t.checkout.cod : t.checkout.card} · {selected.payment_status}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Customers() {
  const { t, fmt } = useLang();
  const [customers, setCustomers] = useState<any[]>([]);
  useEffect(() => { api<{ customers: any[] }>('/admin/customers').then((d) => setCustomers(d.customers)).catch(() => {}); }, []);
  return (
    <div>
      <h2 className="font-display font-bold uppercase tracking-widest mb-6">{t.admin.customers} ({customers.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm admin-table">
          <thead><tr className="text-concrete text-xs uppercase tracking-widest border-b border-line"><th className="py-2">{t.contactPage.name}</th><th>{t.auth.email}</th><th>{t.checkout.phone}</th><th>{t.account.orders}</th><th>{t.admin.revenue}</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-line/50 text-center">
                <td className="py-2.5 font-semibold">{c.full_name}</td><td dir="ltr">{c.email}</td><td dir="ltr">{c.phone || '—'}</td>
                <td>{c.order_count}</td><td>{fmt(c.lifetime_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Coupons() {
  const { t } = useLang();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [form, setForm] = useState({ code: '', kind: 'percent', value: 10, min_subtotal: 0 });
  const load = () => api<{ coupons: any[] }>('/admin/coupons').then((d) => setCoupons(d.coupons)).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/admin/coupons', { method: 'POST', body: JSON.stringify({ ...form, value: +form.value, min_subtotal: +form.min_subtotal }) });
    setForm({ code: '', kind: 'percent', value: 10, min_subtotal: 0 });
    load();
  };
  return (
    <div>
      <h2 className="font-display font-bold uppercase tracking-widest mb-6">{t.admin.coupons}</h2>
      <form onSubmit={save} className="flex flex-wrap gap-3 mb-8 items-end">
        <input required minLength={2} className="input-line !py-2 w-36 uppercase" placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} dir="ltr" />
        <select className="input-line !py-2 w-32" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
          <option value="percent">%</option><option value="fixed">EGP</option>
        </select>
        <input required type="number" min={1} className="input-line !py-2 w-24" placeholder="Value" value={form.value} onChange={(e) => setForm({ ...form, value: +e.target.value })} dir="ltr" />
        <input type="number" min={0} className="input-line !py-2 w-32" placeholder="Min subtotal" value={form.min_subtotal} onChange={(e) => setForm({ ...form, min_subtotal: +e.target.value })} dir="ltr" />
        <button className="bg-ivory text-ink text-xs font-bold uppercase tracking-[0.15em] px-4 py-2.5">+</button>
      </form>
      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.code} className="border border-line p-4 flex items-center gap-4 text-sm">
            <span className="font-display font-bold">{c.code}</span>
            <span className="text-concrete">{c.kind === 'percent' ? `${c.value}%` : `${c.value} EGP`}{c.min_subtotal > 0 ? ` · min ${c.min_subtotal}` : ''}</span>
            <span className={`text-xs uppercase tracking-widest ${c.active ? 'text-silver' : 'text-concrete/50'}`}>{c.active ? 'active' : 'off'}</span>
            {c.active && <button onClick={async () => { await api(`/admin/coupons/${c.code}`, { method: 'DELETE' }); load(); }} className="ms-auto text-xs text-red-400/70 hover:text-red-400 uppercase tracking-widest">{t.actions.delete}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
