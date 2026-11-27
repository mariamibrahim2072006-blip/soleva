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
    <div className={`drawer-overlay fixed inset-0 z-[400] bg-ink/70 backdrop-blur-sm ${cartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setCartOpen(false)} />
    <aside className={`drawer fixed top-0 end-0 z-[500] h-full w-full max-w-md bg-ink-2 border-s border-line flex flex-col ${cartOpen ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`} aria-hidden={!cartOpen}>
      <div className="flex items-center justify-between px-6 h-[72px] border-b border-line">
        <h2 className="font-display font-bold uppercase tracking-[0.2em] text-sm">{t.cart.title}</h2>
        <button onClick={() => setCartOpen(false)} className="text-2xl leading-none p-1" aria-label={t.actions.close}>×</button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center gap-3">
            <p className="font-display text-xl uppercase tracking-wide">{t.cart.empty}</p>
            <p className="text-concrete text-sm">{t.cart.emptySub}</p>
          </div>
        )}
        {items.map((i) => (
          <div key={i.key} className="flex gap-4">
            <Link to={`/product/${i.slug}`} onClick={() => setCartOpen(false)} className="w-20 aspect-[4/5] bg-ivory-2 shrink-0 overflow-hidden">
              {i.image && <img src={i.image} alt={i.name} className="w-full h-full object-cover" />}
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2">
                <Link to={`/product/${i.slug}`} onClick={() => setCartOpen(false)} className="font-display font-semibold text-sm uppercase tracking-wide truncate">{i.name}</Link>
                <button onClick={() => removeCartItem(i.id)} className="text-concrete hover:text-ivory text-lg leading-none" aria-label={t.cart.remove}>×</button>
              </div>
              <p className="text-concrete text-xs mt-1">EU {i.size} · {i.color}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center border border-line">
                  <button className="w-7 h-7 grid place-items-center hover:bg-ink-3" onClick={() => i.qty > 1 ? updateCartItem(i.id, i.qty - 1) : removeCartItem(i.id)}>−</button>
                  <span className="w-8 text-center text-sm tabular-nums">{i.qty}</span>
                  <button className="w-7 h-7 grid place-items-center hover:bg-ink-3 disabled:opacity-30" disabled={i.qty >= Math.min(10, i.stock)} onClick={() => updateCartItem(i.id, i.qty + 1)}>+</button>
                </div>
                <span className="font-display font-semibold text-sm">{fmt(i.price * i.qty)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="border-t border-line px-6 py-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-concrete uppercase tracking-widest">{t.cart.subtotal}</span>
            <span className="font-display font-bold">{fmt(cartSubtotal)}</span>
          </div>
          <button onClick={() => { setCartOpen(false); nav('/checkout'); }} className="w-full bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm py-4 hover:bg-silver transition-colors">{t.actions.checkout}</button>
          <button onClick={() => setCartOpen(false)} className="w-full text-concrete text-xs uppercase tracking-[0.2em] hover:text-ivory transition-colors">{t.actions.continueShopping}</button>
        </div>
      )}
    </aside>
  </>);
}
