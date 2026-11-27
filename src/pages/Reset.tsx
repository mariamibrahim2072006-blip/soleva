import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../lang';
import { api } from '../api';

export default function Reset() {
  const { t } = useLang();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('passwords_do_not_match'); return; }
    try {
      await api('/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) });
      setDone(true);
      window.setTimeout(() => nav('/login'), 1500);
    } catch (err: any) {
      setError(err.data?.error || t.misc.error);
    }
  };

  return (
    <div className="band-yellow min-h-screen flex items-start justify-center px-5 pt-32 pb-20">
      <div className="w-full max-w-md bg-white border-2 border-ivory p-6 md:p-8">
        <div className="text-center font-display font-black text-3xl tracking-[0.18em] text-ivory mb-8 select-none">SOLEVA</div>
          
        <h1 className="font-display font-black uppercase text-4xl tracking-tight mb-4">{t.actions.resetPassword}</h1>
        {done ? (
          <p className="text-silver uppercase tracking-widest text-sm">✓</p>
        ) : !token ? (
          <p className="text-red-400 text-sm"><Link to="/forgot-password" className="underline">{t.actions.forgotPassword}</Link></p>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <p className="text-concrete text-sm">{t.auth.resetSub}</p>
            <input required minLength={8} type="password" className="input-line" placeholder={t.auth.newPassword} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
            <input required minLength={8} type="password" className="input-line" placeholder={t.auth.confirmPassword} value={confirm} onChange={(e) => setConfirm(e.target.value)} dir="ltr" />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button className="w-full bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm py-4 hover:bg-silver transition-colors">{t.actions.resetPassword}</button>
          </form>
        )}
      </div>
    </div>
  );
}
