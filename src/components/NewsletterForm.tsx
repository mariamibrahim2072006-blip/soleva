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
        className="flex-1 bg-transparent border-b border-ivory/30 focus:border-ivory outline-none py-3 text-sm placeholder:text-concrete transition-colors" />
      <button type="submit" className="ms-4 text-xs uppercase tracking-[0.2em] border-b border-ivory pb-1 hover:text-silver hover:border-silver transition-colors">{t.actions.subscribe}</button>
    </form>
  );
}
