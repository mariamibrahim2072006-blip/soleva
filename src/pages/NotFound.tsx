import { Link } from 'react-router-dom';
import { useLang } from '../lang';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <p className="font-display font-black text-[30vw] md:text-[16vw] leading-none text-outline select-none" aria-hidden>404</p>
      <h1 className="font-display font-black uppercase text-3xl md:text-4xl tracking-tight -mt-6 md:-mt-12">{t.misc.notFound}</h1>
      <p className="text-concrete mt-4">{t.misc.notFoundSub}</p>
      <Link to="/" className="mt-10 bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-10 py-4 hover:bg-silver transition-colors">{t.misc.backHome}</Link>
    </div>
  );
}
