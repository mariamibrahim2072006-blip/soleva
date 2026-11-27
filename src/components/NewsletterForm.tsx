import { useState } from 'react';
import { api } from '../api';
import { useLang } from '../lang';
import { useStore } from '../store';

export default function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const { t } = useLang();
  const { showToast } = useStore();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    try {
      await api('/newsletter', { method: 'POST', body: JSON.stringify({ email }) });
      setDone(true); setEmail('');
      showToast(t.home.newsletter + ' ✓');
    } catch { showToast(t.misc.error); }
  };

  if (done) return <p className="text-sm text-silver uppercase tracking-widest">✓ {t.home.newsletter}</p>;
  return (
    <form onSubmit={submit} className={`flex ${compact ? '' : 'max-w-md mx-auto'}`}>
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.auth.email}
        className="flex-1 bg-transparent border-b-2 border-ivory outline-none py-2 text-base font-semibold text-ivory placeholder:text-concrete transition-colors" />
      <button type="submit" className="ms-4 text-sm font-black uppercase tracking-[0.15em] border-b-2 border-ivory pb-1 text-ivory">{t.actions.subscribe}</button>
    </form>
  );
}
