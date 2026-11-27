import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../lang';
import { useStore } from '../store';

export default function Login() {
  const { t } = useLang();
  const { login } = useStore();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      nav(user.role === 'admin' ? '/admin' : '/account');
    } catch { setError(t.auth.welcome + ' — ×'); setError('invalid_credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden">
        <img src="/images/campaign-2.webp" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-ink/40" />
        <div className="absolute bottom-10 start-10 font-display font-black uppercase text-5xl tracking-tight text-outline">SOLEVA</div>
      </div>
      <div className="flex items-center justify-center px-5 pt-24 pb-16">
        <form onSubmit={submit} className="w-full max-w-md">
          <h1 className="font-display font-black uppercase text-4xl tracking-tight mb-2">{t.auth.welcome}</h1>
          <p className="text-concrete text-sm mb-10">{t.auth.noAccount} <Link to="/register" className="text-ivory underline">{t.actions.register}</Link></p>
          <div className="space-y-6">
            <input required type="email" className="input-line" placeholder={t.auth.email} value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            <input required type="password" className="input-line" placeholder={t.auth.password} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
          </div>
          {error && <p className="mt-4 text-sm text-red-400">{t.misc.error}: {error}</p>}
          <button disabled={loading} className="mt-10 w-full bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm py-4 hover:bg-silver transition-colors disabled:opacity-50">
            {loading ? '…' : t.actions.signIn}
          </button>
          <p className="mt-6 text-center"><Link to="/forgot-password" className="text-concrete text-sm underline hover:text-ivory">{t.actions.forgotPassword}</Link></p>
        </form>
      </div>
    </div>
  );
}
