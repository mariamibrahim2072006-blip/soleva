import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lang';
import { api } from '../api';

export default function TrackOrder() {
  const { t, lang, fmt } = useLang();
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const steps = ['placed', 'confirmed', 'shipped', 'delivered'] as const;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setOrder(null); setLoading(true);
    try {
      const d = await api<any>(`/orders/track/${encodeURIComponent(orderNumber.trim())}?email=${encodeURIComponent(email.trim())}`);
      setOrder(d.order);
    } catch { setError(t.misc.notFound); }
    finally { setLoading(false); }
  };

  const currentIdx = order ? steps.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-5 pt-32 pb-24 min-h-screen">
      <h1 className="font-display font-black uppercase text-4xl md:text-5xl tracking-tight mb-4">{t.track.title}</h1>
      <p className="text-concrete mb-10">{t.track.sub}</p>
      <form onSubmit={submit} className="space-y-6">
        <input required className="input-line uppercase" placeholder={t.track.placeholder} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} dir="ltr" />
        <input required type="email" className="input-line" placeholder={t.checkout.email} value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
        <button disabled={loading} className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-10 py-4 hover:bg-silver transition-colors disabled:opacity-50">
          {loading ? '…' : t.actions.trackOrder}
        </button>
      </form>
      {error && <p className="mt-6 text-red-400 text-sm">{error}</p>}

      {order && (
        <div className="mt-16 border border-line p-6 md:p-10">
          <div className="flex flex-wrap justify-between gap-4 pb-8 border-b border-line">
            <div><p className="text-concrete text-xs uppercase tracking-widest">{t.checkout.orderNumber}</p><p className="font-display font-bold text-xl mt-1">{order.order_number}</p></div>
            <div><p className="text-concrete text-xs uppercase tracking-widest">{t.cart.total}</p><p className="font-display font-bold text-xl mt-1">{fmt(order.total)}</p></div>
            <div><p className="text-concrete text-xs uppercase tracking-widest">{t.checkout.payment}</p><p className="mt-1 text-sm">{order.payment_method === 'cod' ? t.checkout.cod : t.checkout.card}</p></div>
          </div>

          {order.status === 'cancelled' ? (
            <p className="py-10 text-center text-red-400 uppercase tracking-widest">{t.track.statuses.cancelled}</p>
          ) : (
            <div className="py-10 flex items-center">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 ${i <= currentIdx ? 'bg-ivory border-ivory' : 'border-line'}`} />
                    <span className={`text-[10px] uppercase tracking-widest ${i <= currentIdx ? 'text-ivory' : 'text-concrete/50'}`}>{t.track.statuses[s]}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`h-px flex-1 mx-2 ${i < currentIdx ? 'bg-ivory' : 'bg-line'}`} />}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t border-line pt-6">
            {order.items.map((i: any) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span>{lang === 'ar' ? i.name_ar : i.name_en} — EU {i.size} × {i.qty}</span>
                <span>{fmt(i.unit_price * i.qty)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm text-concrete pt-3 border-t border-line"><span>{t.cart.shipping}</span><span>{order.shipping_fee === 0 ? t.cart.freeShipping : fmt(order.shipping_fee)}</span></div>
          </div>
          <p className="mt-8 text-xs text-concrete">{order.governorate} · {order.city}</p>
        </div>
      )}
      <p className="mt-10 text-sm text-concrete text-center"><Link to="/shop" className="underline hover:text-ivory">{t.actions.continueShopping}</Link></p>
    </div>
  );
}
