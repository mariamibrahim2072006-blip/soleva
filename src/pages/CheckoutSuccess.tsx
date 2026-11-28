import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from '../lang';
import { api } from '../api';
import { useStore } from '../store';

export default function CheckoutSuccess() {
  const { t, lang, fmt } = useLang();
  const { reloadCart } = useStore();
  const [sp] = useSearchParams();
  const [state, setState] = useState<'loading' | 'paid' | 'unpaid' | 'error'>('loading');
  const [order, setOrder] = useState<any>(null);
  useEffect(() => {
    const sid = sp.get('session_id');
    if (!sid) { setState('error'); return; }
    api<any>(`/pay/confirm?session_id=${encodeURIComponent(sid)}`)
      .then((d) => { setOrder(d.order); setState(d.paid ? 'paid' : 'unpaid'); reloadCart(); })
      .catch(() => setState('error'));
  }, []);
  return (
    <div className="band-yellow min-h-screen pt-32 pb-24 px-5">
      <div className="max-w-xl mx-auto text-center bg-white border-2 border-ivory p-6 md:p-10">
        <div className="w-16 h-16 mx-auto mb-8 rounded-full border border-silver grid place-items-center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12.5 9.5 18 20 6.5" /></svg>
        </div>
        {state === 'loading' && <p className="text-concrete">…</p>}
        {state === 'paid' && <>
          <h1 className="font-display font-black uppercase text-4xl md:text-5xl tracking-tight">{lang === 'ar' ? 'تم الدفع بنجاح' : 'Payment successful'}</h1>
          <p className="mt-6 text-concrete leading-relaxed">{t.checkout.successSub}</p>
          <div className="mt-10 border-2 border-ivory p-6 text-start space-y-3 text-base font-semibold">
            <div className="flex justify-between"><span className="text-concrete uppercase tracking-widest">{t.checkout.orderNumber}</span><span className="font-display font-bold">{order?.order_number}</span></div>
            <div className="flex justify-between"><span className="text-concrete uppercase tracking-widest">{t.cart.total}</span><span className="font-display font-bold">{fmt(order?.total)}</span></div>
            <div className="flex justify-between"><span className="text-concrete uppercase tracking-widest">{t.checkout.payment}</span><span>{lang === 'ar' ? 'بطاقة (تجريبي)' : 'Card (test mode)'}</span></div>
          </div>
        </>}
        {state === 'unpaid' && <h1 className="font-display font-black uppercase text-3xl">{lang === 'ar' ? 'لم يكتمل الدفع' : 'Payment not completed'}</h1>}
        {state === 'error' && <h1 className="font-display font-black uppercase text-3xl">{t.misc.error}</h1>}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/track" className="border-2 border-ivory font-display font-black uppercase tracking-[0.12em] text-base px-8 py-4 hover:bg-ink-3">{t.actions.trackOrder}</Link>
          <Link to="/shop" className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.18em] text-sm px-8 py-4 hover:bg-silver">{t.actions.continueShopping}</Link>
        </div>
      </div>
    </div>
  );
}
