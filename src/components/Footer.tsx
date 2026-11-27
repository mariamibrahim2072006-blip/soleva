import { Link } from 'react-router-dom';
import { useLang } from '../lang';
import NewsletterForm from './NewsletterForm';

export default function Footer() {
  const { t } = useLang();
  const cols = [
    { title: t.footer.shop, links: [
      { to: '/shop', label: t.nav.shop }, { to: '/collections/new', label: t.nav.new },
      { to: '/collections/best', label: t.nav.best }, { to: '/collections/sale', label: t.nav.sale },
      { to: '/shop?gender=men', label: t.nav.men }, { to: '/shop?gender=women', label: t.nav.women } ] },
    { title: t.footer.help, links: [
      { to: '/track', label: t.nav.track }, { to: '/size-guide', label: t.nav.sizeGuide },
      { to: '/shipping-returns', label: t.footer.shippingReturns }, { to: '/faq', label: t.footer.faq },
      { to: '/contact', label: t.footer.contact } ] },
    { title: t.footer.company, links: [
      { to: '/about', label: t.footer.about }, { to: '/contact', label: t.footer.contact } ] },
    { title: t.footer.legal, links: [
      { to: '/privacy', label: t.footer.privacy }, { to: '/terms', label: t.footer.terms } ] },
  ];
  return (
    <footer className="footer-dark">
      <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-8 md:py-10 grid grid-cols-2 lg:grid-cols-12 gap-x-6 gap-y-7 lg:gap-10">
        <div className="col-span-2 lg:col-span-4">
          <div className="font-display font-black text-3xl tracking-[0.18em] mb-2">SOLEVA</div>
          <p className="text-ivory text-sm max-w-xs">{t.footer.tagline}</p>
          <div className="mt-4">
            <p className="text-sm font-semibold text-ivory mb-1 max-w-xs">{t.home.newsletterSub}</p>
            <NewsletterForm compact />
          </div>
        </div>
        {cols.map((c) => (
          <div key={c.title} className="lg:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-ivory mb-3">{c.title}</h4>
            <ul className="space-y-1.5">
              {c.links.map((l) => <li key={l.to + l.label}><Link to={l.to} className="text-sm text-ivory font-medium hover:underline">{l.label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-3 flex flex-col md:flex-row items-center justify-between gap-1 text-xs font-medium text-ivory">
          <span>© {new Date().getFullYear()} SOLEVA. {t.footer.rights}</span>
          <span>{t.footer.demo}</span>
        </div>
      </div>
    </footer>
  );
}
