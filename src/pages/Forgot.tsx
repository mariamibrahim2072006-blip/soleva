import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../lang';
import { api } from '../api';

export default function Forgot() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const d = await api<{ demo_reset_url?: string }>('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) });
      setDemoUrl(d.demo_reset_url || '');
      setSent(true);
    } catch { setSent(true); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-24 pb-16">
      <div className="w-full max-w-md">
        <h1 className="font-display font-black uppercase text-4xl tracking-tight mb-4">{t.actions.resetPassword}</h1>
        {sent ? (
          <div className="space-y-4">
            <p className="text-ivory/70 text-sm leading-relaxed">{t.auth.demoNote}</p>
            {demoUrl && <Link to={demoUrl} className="inline-block bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-8 py-3.5">{t.actions.resetPassword}</Link>}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <p className="text-concrete text-sm">{t.auth.forgotSub}</p>
            <input required type="email" className="input-line" placeholder={t.auth.email} value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            <button className="w-full bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm py-4 hover:bg-silver transition-colors">{t.actions.submit}</button>
            <p className="text-center"><Link to="/login" className="text-concrete text-sm underline hover:text-ivory">{t.actions.signIn}</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
