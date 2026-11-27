import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useLang } from '../lang';
import { api, type Product } from '../api';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';

interface Facets { sizes: string[]; colors: string[]; materials: string[]; price_max: number; }

export default function Shop() {
  const { t, lang } = useLang();
  const { category } = useParams();
  const { collection } = useParams() as { collection?: string };
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState<{ items: Product[]; total: number; pages: number; facets: Facets } | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const state = {
    q: params.get('q') || '',
    gender: params.get('gender') || '',
    size: params.get('size') || '',
    color: params.get('color') || '',
    material: params.get('material') || '',
    min: params.get('min') || '',
    max: params.get('max') || '',
    availability: params.get('availability') || '',
    sort: params.get('sort') || 'newest',
    page: +(params.get('page') || 1),
  };

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    if (k !== 'page') next.delete('page');
    setParams(next, { replace: false });
  };

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => v && sp.set(k, String(v)));
    if (category) sp.set('category', category);
    if (collection) sp.set('collection', collection);
    sp.set('limit', '12');
    return sp.toString();
  }, [params, category, collection]);

  useEffect(() => { api<{ categories: any[] }>('/categories').then((d) => setCategories(d.categories)).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    api<any>(`/products?${queryString}`)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0 });
  }, [queryString]);

  const titles: Record<string, string> = {
    new: t.home.newArrivals, best: t.home.bestSellers, sale: t.nav.sale, signature: t.home.signature,
  };
  const catObj = categories.find((c) => c.slug === category);
  const title = collection ? titles[collection] : catObj ? (lang === 'ar' ? catObj.name_ar : catObj.name_en) : t.shop.title;

  return (
    <div className="max-w-[1600px] mx-auto px-5 md:px-10 pt-28 md:pt-36 pb-24">
      <header className="mb-12">
        <h1 className="font-display font-black uppercase text-5xl md:text-7xl tracking-tight">{title}</h1>
        <p className="text-concrete text-sm mt-3">{data ? `${data.total} ${t.shop.results}` : '…'}</p>
      </header>

      <div className="flex gap-12">
        {/* Filters sidebar */}
        <aside className={`fixed inset-0 z-[300] bg-ink p-6 overflow-y-auto transition-transform duration-500 lg:static lg:z-auto lg:bg-transparent lg:p-0 lg:w-64 lg:shrink-0 lg:block lg:translate-x-0 ${filtersOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'} lg:rtl:translate-x-0`}>
          <div className="flex justify-between items-center lg:hidden mb-8">
            <span className="font-display font-bold uppercase tracking-widest">{t.shop.filters}</span>
            <button onClick={() => setFiltersOpen(false)} className="text-2xl">×</button>
          </div>

          <FilterGroup title={t.shop.category}>
            <button onClick={() => { const sp = new URLSearchParams(params); setParams(sp); }} className={`block text-sm py-1.5 ${!category ? 'text-ivory font-semibold' : 'text-concrete hover:text-ivory'}`}>{t.shop.title}</button>
            {categories.map((c) => (
              <a key={c.slug} href={`/shop/${c.slug}`} className={`block text-sm py-1.5 ${category === c.slug ? 'text-ivory font-semibold' : 'text-concrete hover:text-ivory'}`}>{lang === 'ar' ? c.name_ar : c.name_en} <span className="text-xs opacity-60">({c.product_count})</span></a>
            ))}
          </FilterGroup>

          <FilterGroup title={t.shop.gender}>
            {['', 'men', 'women', 'unisex'].map((g) => (
              <button key={g} onClick={() => setParam('gender', g)} className={`block text-sm py-1.5 ${state.gender === g ? 'text-ivory font-semibold' : 'text-concrete hover:text-ivory'}`}>
                {g === '' ? t.shop.title : g === 'men' ? t.misc.men : g === 'women' ? t.misc.women : t.misc.unisex}
              </button>
            ))}
          </FilterGroup>

          {data?.facets.sizes.length ? (
            <FilterGroup title={t.shop.size}>
              <div className="flex flex-wrap gap-2">
                {data.facets.sizes.map((s) => (
                  <button key={s} onClick={() => setParam('size', state.size === s ? '' : s)}
                    className={`w-10 h-10 border text-sm transition-colors ${state.size === s ? 'border-ivory bg-ivory text-ink font-bold' : 'border-line text-concrete hover:border-ivory hover:text-ivory'}`}>{s}</button>
                ))}
              </div>
            </FilterGroup>
          ) : null}

          {data?.facets.colors.length ? (
            <FilterGroup title={t.shop.color}>
              {data.facets.colors.map((c) => (
                <button key={c} onClick={() => setParam('color', state.color === c ? '' : c)} className={`block text-sm py-1.5 ${state.color === c ? 'text-ivory font-semibold' : 'text-concrete hover:text-ivory'}`}>{c}</button>
              ))}
            </FilterGroup>
          ) : null}

          {data?.facets.materials.length ? (
            <FilterGroup title={t.shop.material}>
              {data.facets.materials.map((m) => (
                <button key={m} onClick={() => setParam('material', state.material === m ? '' : m)} className={`block text-sm py-1.5 ${state.material === m ? 'text-ivory font-semibold' : 'text-concrete hover:text-ivory'}`}>{m}</button>
              ))}
            </FilterGroup>
          ) : null}

          <FilterGroup title={t.shop.price}>
            <div className="flex gap-3 items-center">
              <input type="number" placeholder={t.shop.minPrice} value={state.min} onChange={(e) => setParam('min', e.target.value)} className="input-line !py-2 text-sm w-20" />
              <span className="text-concrete">—</span>
              <input type="number" placeholder={t.shop.maxPrice} value={state.max} onChange={(e) => setParam('max', e.target.value)} className="input-line !py-2 text-sm w-20" />
            </div>
          </FilterGroup>

          <FilterGroup title={t.shop.availability}>
            <label className="flex items-center gap-2 text-sm text-concrete cursor-pointer">
              <input type="checkbox" checked={state.availability === 'in_stock'} onChange={(e) => setParam('availability', e.target.checked ? 'in_stock' : '')} className="accent-[#f2eee6]" />
              {t.shop.inStock}
            </label>
          </FilterGroup>

          <button onClick={() => setParams(new URLSearchParams())} className="mt-6 text-xs uppercase tracking-[0.2em] text-concrete hover:text-ivory border-b border-line pb-1">{t.shop.clear}</button>
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-8 gap-4">
            <button onClick={() => setFiltersOpen(true)} className="lg:hidden text-xs uppercase tracking-[0.2em] border border-line px-4 py-2.5">{t.shop.filters}</button>
            <div className="ms-auto flex items-center gap-3">
              <label className="text-xs uppercase tracking-[0.2em] text-concrete hidden sm:block">{t.shop.sort}</label>
              <select value={state.sort} onChange={(e) => setParam('sort', e.target.value)} className="bg-transparent border border-line text-sm px-3 py-2.5 outline-none">
                {Object.entries(t.shop.sorts).map(([k, v]) => <option key={k} value={k} className="bg-ink-2">{v}</option>)}
              </select>
            </div>
          </div>

          {state.q && <p className="text-concrete text-sm mb-6">{t.actions.search}: “{state.q}” — <button className="underline" onClick={() => setParam('q', '')}>×</button></p>}

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/5] bg-ink-2 animate-pulse" />)}
            </div>
          ) : data?.items.length ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {data.items.map((p, i) => <Reveal key={p.id}><ProductCard product={p} index={i} /></Reveal>)}
            </div>
          ) : (
            <p className="text-concrete py-24 text-center">{t.shop.results}: 0</p>
          )}

          {data && data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-16">
              {Array.from({ length: data.pages }).map((_, i) => (
                <button key={i} onClick={() => setParam('page', String(i + 1))}
                  className={`w-10 h-10 border text-sm ${state.page === i + 1 ? 'border-ivory bg-ivory text-ink font-bold' : 'border-line text-concrete hover:border-ivory'}`}>{i + 1}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line py-6">
      <h3 className="text-xs uppercase tracking-[0.25em] text-concrete mb-4">{title}</h3>
      {children}
    </div>
  );
}
