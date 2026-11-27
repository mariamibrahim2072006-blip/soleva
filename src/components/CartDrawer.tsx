import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../lang';
import { useStore } from '../store';

export default function CartDrawer() {
  const { t, lang, fmt } = useLang();
  const { cartOpen, setCartOpen, cartItems, guestItems, user, updateCartItem, removeCartItem, cartSubtotal } = useStore();
  const nav = useNavigate();

  const items = user
    ? cartItems.map((i) => ({ key: i.cart_item_id, id: i.cart_item_id, qty: i.qty, name: lang === 'ar' ? i.name_ar : i.name_en, image: i.image_url, size: i.size, color: lang === 'ar' ? i.color_ar : i.color_en, price: i.unit_price, slug: i.slug, stock: i.stock }))
    : guestItems.map((g) => ({ key: g.variant_id, id: g.variant_id, qty: g.qty, name: lang === 'ar' ? g.meta?.name_ar : g.meta?.name_en, image: g.meta?.image_url || '', size: g.meta?.size || '', color: lang === 'ar' ? g.meta?.color_ar : g.meta?.color_en, price: g.meta?.unit_price || 0, slug: g.meta?.slug || '', stock: g.meta?.stock || 99 }));

  return (<>
    <div className={`drawer-overlay fixed inset-0 z-[400] bg-[#04348f]/60 ${cartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setCartOpen(false)} />
    <aside className={`drawer fixed top-0 end-0 z-[500] h-full w-full max-w-md bg-white border-s-2 border-ivory flex flex-col ${cartOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`} aria-hidden={!cartOpen}>
      <div className="flex items-center justify-between px-5 h-[72px] border-b-2 border-ivory shrink-0">
        <h2 className="font-display font-black uppercase tracking-tight text-2xl text-ivory">{t.cart.title}</h2>
        <button onClick={() => setCartOpen(false)} className="w-10 h-10 grid place-items-center text-ivory text-3xl leading-none" aria-label={t.actions.close}>×</button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-2">
        {items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <p className="font-display font-black text-2xl uppercase tracking-tight">{t.cart.empty}</p>
            <p className="text-concrete text-base font-semibold">{t.cart.emptySub}</p>
          </div>
        )}
        {items.map((i) => (
          <div key={i.key} className="flex gap-4 py-5 border-b-2 border-ivory/25 last:border-b-0">
            <Link to={`/product/${i.slug}`} onClick={() => setCartOpen(false)} className="w-24 sm:w-28 aspect-[4/5] bg-white border border-ivory/40 shrink-0 overflow-hidden">
              {i.image && <img src={i.image} alt={i.name} className="w-full h-full object-contain" />}
            </Link>
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex justify-between gap-2">
                <Link to={`/product/${i.slug}`} onClick={() => setCartOpen(false)} className="font-display font-black text-base uppercase leading-tight">{i.name}</Link>
                <button onClick={() => removeCartItem(i.id)} className="text-concrete font-black text-xl leading-none w-7 h-7 grid place-items-center shrink-0" aria-label={t.cart.remove}>×</button>
              </div>
              <p className="text-concrete text-sm font-semibold mt-1">EU {i.size}{i.color ? ` · ${i.color}` : ''}</p>
              <div className="flex items-center justify-between mt-auto pt-3 gap-x-2 gap-y-2 flex-wrap">
                <div className="flex items-center border border-ivory text-lg font-bold">
                  <button className="w-8 h-10 grid place-items-center hover:bg-ink-3" aria-label="-" onClick={() => i.qty > 1 ? updateCartItem(i.id, i.qty - 1) : removeCartItem(i.id)}>−</button>
                  <span className="w-8 text-center tabular-nums">{i.qty}</span>
                  <button className="w-8 h-10 grid place-items-center hover:bg-ink-3 disabled:opacity-30" aria-label="+" disabled={i.qty >= Math.min(10, i.stock)} onClick={() => updateCartItem(i.id, i.qty + 1)}>+</button>
                </div>
                <span className="font-display font-black text-lg whitespace-nowrap">{fmt(i.price * i.qty)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="border-t-2 border-ivory bg-white px-5 py-5 space-y-4 shrink-0">
          <div className="flex justify-between items-baseline">
            <span className="text-ivory text-base font-black uppercase tracking-[0.1em]">{t.cart.subtotal}</span>
            <span className="font-display font-black text-2xl text-ivory">{fmt(cartSubtotal)}</span>
          </div>
          <button onClick={() => { setCartOpen(false); nav('/checkout'); }} className="w-full bg-ivory text-white font-display font-black uppercase tracking-[0.12em] text-base py-5 hover:bg-ivory-2 transition-colors">{t.actions.checkout}</button>
          <button onClick={() => setCartOpen(false)} className="w-full text-ivory font-bold text-base underline py-1 text-center">{t.actions.continueShopping}</button>
        </div>
      )}
    </aside>
  </>);
}
