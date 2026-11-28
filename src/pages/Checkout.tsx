import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../lang';
import { api, setGuestCart } from '../api';
import { useStore } from '../store';

export default function Checkout() {
  const { t, lang, fmt } = useLang();
  const { user, cartItems, guestItems, reloadCart, authReady } = useStore();
  const nav = useNavigate();
  const buyNow = (useLocation().state as any)?.buyNow as { variant_id: number; qty: number; name_en: string; name_ar: string; image: string; size: string; price: number } | undefined;
  const [governorates, setGovernorates] = useState<{ name: string; fee: number }[]>([]);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', governorate: 'Cairo', city: '', area: '', street: '', postal_code: '', notes: '' });
  const [payment, setPayment] = useState<'cod' | 'card'>('cod');
  const [coupon, setCoupon] = useState('');
  const [couponState, setCouponState] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);

  useEffect(() => { api<{ governorates: any[] }>('/shipping').then((d) => setGovernorates(d.governorates)).catch(() => {}); }, []);
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, full_name: f.full_name || user.full_name, email: f.email || user.email, phone: f.phone || user.phone || '' }));
  }, [user]);

  const items = useMemo(() => buyNow ? [{ variant_id: buyNow.variant_id, qty: buyNow.qty, name: lang === 'ar' ? buyNow.name_ar : buyNow.name_en, image: buyNow.image, size: buyNow.size, price: buyNow.price }] : user
    ? cartItems.map((i) => ({ variant_id: i.variant_id, qty: i.qty, name: lang === 'ar' ? i.name_ar : i.name_en, image: i.image_url, size: i.size, price: i.unit_price }))
    : guestItems.map((g) => ({ variant_id: g.variant_id, qty: g.qty, name: lang === 'ar' ? g.meta?.name_ar : g.meta?.name_en, image: g.meta?.image_url || '', size: g.meta?.size || '', price: g.meta?.unit_price || 0 })),
  [user, cartItems, guestItems, lang, buyNow]);
  const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);

  const gov = governorates.find((g) => g.name === form.governorate);
  const discount = couponState?.discount ?? 0;
  const shipping = subtotal - discount >= 10000 ? 0 : (gov?.fee ?? 100);
  const total = subtotal - discount + shipping;

  const applyCoupon = async () => {
    setCouponError('');
    try {
      const d = await api<any>('/coupons/validate', { method: 'POST', body: JSON.stringify({ code: coupon, subtotal: subtotal }) });
      setCouponState({ code: d.code, discount: d.discount });
    } catch (e: any) {
      setCouponState(null);
      setCouponError(e.data?.error === 'min_subtotal_not_met' ? `${fmt(e.data.min_subtotal)}+` : t.misc.error);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPlacing(true);
    try {
      const d = await api<any>(payment === 'card' ? '/pay/session' : '/orders', {
        method: 'POST',
        body: JSON.stringify({ ...form, payment_method: payment, return_origin: window.location.origin, coupon_code: couponState?.code, save_address: saveAddress, items: items.map((i) => ({ variant_id: i.variant_id, qty: i.qty })) }),
      });
      if (d.checkout_url) { if (!user && !buyNow) setGuestCart([]); window.location.href = d.checkout_url; return; }
      setOrder(d.order);
      if (!user && !buyNow) setGuestCart([]);
      await reloadCart();
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.data?.error === 'insufficient_stock' ? `${t.product.soldOut}: ${err.data.name} (EU ${err.data.size})` : t.misc.error);
    } finally { setPlacing(false); }
  };

  if (order) {
    return (
      <div className="band-yellow min-h-screen pt-32 pb-24 px-5">
        <div className="max-w-xl mx-auto text-center bg-white border-2 border-ivory p-6 md:p-10">
          <div className="w-16 h-16 mx-auto mb-8 rounded-full border border-silver grid place-items-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
          </div>
          <h1 className="font-display font-black uppercase text-4xl md:text-5xl tracking-tight">{t.checkout.success}</h1>
          <p className="mt-6 text-concrete leading-relaxed">{t.checkout.successSub}</p>
          <div className="mt-10 border-2 border-ivory p-6 text-start space-y-3 text-base font-semibold">
            <div className="flex justify-between"><span className="text-concrete uppercase tracking-widest">{t.checkout.orderNumber}</span><span className="font-display font-bold">{order.order_number}</span></div>
            <div className="flex justify-between"><span className="text-concrete uppercase tracking-widest">{t.cart.total}</span><span className="font-display font-bold">{fmt(order.total)}</span></div>
            <div className="flex justify-between"><span className="text-concrete uppercase tracking-widest">{t.checkout.payment}</span><span>{t.checkout.cod}</span></div>
            <p className="text-concrete pt-2 border-t border-line">{t.checkout.deliveryNote}</p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={`/track`} className="border-2 border-ivory font-display font-black uppercase tracking-[0.12em] text-base px-8 py-4 hover:bg-ink-3">{t.actions.trackOrder}</Link>
            <Link to="/shop" className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.18em] text-sm px-8 py-4 hover:bg-silver">{t.actions.continueShopping}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (authReady && items.length === 0) {
    return (
      <div className="band-yellow min-h-screen pt-40 text-center px-5">
        <h1 className="font-display font-black uppercase text-4xl">{t.cart.empty}</h1>
        <Link to="/shop" className="inline-block mt-8 bg-ivory text-white font-display font-black uppercase tracking-[0.12em] text-base px-10 py-4">{t.actions.shopNow}</Link>
      </div>
    );
  }

  return (
    <div className="band-yellow"><div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-28 md:pt-36 pb-24">
      <h1 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight mb-12">{t.checkout.title}</h1>
      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 space-y-6">
          <section className="border-2 border-ivory bg-white p-5 md:p-6">
            <h2 className="font-display font-black uppercase text-xl border-b-2 border-ivory pb-3 mb-5">01 — {t.checkout.contact}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required minLength={2} className="input-line" placeholder={t.checkout.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <input required type="email" className="input-line" placeholder={t.checkout.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input required minLength={6} className="input-line md:col-span-2" placeholder={t.checkout.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
            </div>
          </section>

          <section className="border-2 border-ivory bg-white p-5 md:p-6">
            <h2 className="font-display font-black uppercase text-xl border-b-2 border-ivory pb-3 mb-5">02 — {t.checkout.shippingAddress}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-bold text-concrete">{t.checkout.country}</label>
                <input className="input-line" value={t.checkout.egypt} disabled />
              </div>
              <div>
                <label className="text-sm font-bold text-concrete">{t.checkout.governorate}</label>
                <select required className="input-line" value={form.governorate} onChange={(e) => setForm({ ...form, governorate: e.target.value })}>
                  {governorates.map((g) => <option key={g.name} value={g.name}>{g.name} — {g.fee} {t.misc.egp}</option>)}
                </select>
              </div>
              <input required minLength={2} className="input-line" placeholder={t.checkout.city} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input className="input-line" placeholder={t.checkout.area} value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
              <input required minLength={3} className="input-line md:col-span-2" placeholder={t.checkout.street} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} />
              <input className="input-line" placeholder={t.checkout.postal} value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} dir="ltr" />
              <input className="input-line" placeholder={t.checkout.notes} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            {user && (
              <label className="flex items-center gap-2 mt-6 text-sm text-concrete cursor-pointer">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-[#0864E8]" />
                {t.checkout.saveAddress}
              </label>
            )}
          </section>

          <section className="border-2 border-ivory bg-white p-5 md:p-6">
            <h2 className="font-display font-black uppercase text-xl border-b-2 border-ivory pb-3 mb-5">03 — {t.checkout.payment}</h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-4 border-2 border-ivory bg-white p-5 cursor-pointer transition-colors ${payment === 'cod' ? 'bg-ink-3' : ''}`}>
                <input type="radio" name="pay" checked={payment === 'cod'} onChange={() => setPayment('cod')} className="accent-[#0864E8]" />
                <div>
                  <span className="font-display font-semibold uppercase tracking-wide text-sm">{t.checkout.cod}</span>
                  <p className="text-concrete text-sm font-semibold mt-1">{t.checkout.deliveryNote}</p>
                </div>
              </label>
              <label className={`flex items-center gap-4 border-2 border-ivory bg-white p-5 cursor-pointer transition-colors ${payment === 'card' ? 'bg-ink-3' : ''}`}>
                <input type="radio" name="pay" checked={payment === 'card'} onChange={() => setPayment('card')} className="accent-[#0864E8]" />
                <div>
                  <span className="font-display font-semibold uppercase tracking-wide text-sm">{t.checkout.card}</span>
                  <p className="text-concrete text-sm font-semibold mt-1">{lang === 'ar' ? 'ادفع بأمان بالبطاقة عبر Stripe (وضع تجريبي)' : 'Pay securely by card via Stripe (test mode)'}</p>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-2">
          <div className="border-2 border-ivory bg-white p-6 md:p-8 sticky top-28">
            <h2 className="font-display font-black uppercase text-xl border-b-2 border-ivory pb-3 mb-5">{t.checkout.orderSummary}</h2>
            <div className="space-y-4 max-h-72 overflow-y-auto pe-2">
              {items.map((i) => (
                <div key={i.variant_id} className="flex gap-3 items-center">
                  <div className="w-16 aspect-[4/5] bg-white border-2 border-ivory shrink-0 overflow-hidden">{i.image && <img src={i.image} alt="" className="w-full h-full object-contain" />}</div>
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="truncate font-semibold">{i.name}</p>
                    <p className="text-concrete text-xs">EU {i.size} × {i.qty}</p>
                  </div>
                  <span className="text-sm font-semibold">{fmt(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-6">
              <input className="input-line !py-2.5 text-sm flex-1 uppercase" placeholder={t.cart.coupon} value={coupon} onChange={(e) => setCoupon(e.target.value)} />
              <button type="button" onClick={applyCoupon} className="text-sm font-black uppercase tracking-[0.1em] border-2 border-ivory px-4 hover:bg-ink-3 transition-colors">{t.actions.apply}</button>
            </div>
            {couponError && <p className="text-xs text-red-400 mt-2">{couponError}</p>}
            {couponState && <p className="text-xs text-silver mt-2">✓ {couponState.code}</p>}
            <div className="border-t-2 border-ivory mt-6 pt-6 space-y-3 text-base font-semibold">
              <div className="flex justify-between"><span className="text-concrete">{t.cart.subtotal}</span><span>{fmt(subtotal)}</span></div>
              {discount > 0 && <div className="flex justify-between text-silver"><span>{t.cart.discount}</span><span>−{fmt(discount)}</span></div>}
              <div className="flex justify-between"><span className="text-concrete">{t.cart.shipping}</span><span>{shipping === 0 ? t.cart.freeShipping : fmt(shipping)}</span></div>
              <div className="flex justify-between font-display font-black text-xl pt-3 border-t-2 border-ivory"><span>{t.cart.total}</span><span>{fmt(total)}</span></div>
            </div>
            {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
            <button type="submit" disabled={placing} className="w-full mt-8 bg-ivory text-white font-display font-black uppercase tracking-[0.12em] text-base py-5 hover:bg-ivory-2 transition-colors disabled:opacity-50">
              {placing ? '…' : payment === 'card' ? (lang === 'ar' ? 'ادفع بالبطاقة' : 'Pay by card') : t.checkout.placeOrder}
            </button>
          </div>
        </aside>
      </form>
    </div></div>
  );
}
