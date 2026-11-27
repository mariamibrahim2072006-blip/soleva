import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../lang';
import { useStore } from '../store';

export default function Register() {
  const { t } = useLang();
  const { register } = useStore();
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('passwords_do_not_match'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.full_name, form.phone || undefined);
      nav('/account');
    } catch (err: any) {
      setError(err.data?.error === 'email_taken' ? 'email_taken' : t.misc.error);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-start justify-center px-5 pt-32 pb-20">
        <form onSubmit={submit} className="w-full max-w-md bg-white">
          <div className="text-center font-display font-black text-3xl tracking-[0.18em] text-ivory mb-8 select-none">SOLEVA</div>
          
          <h1 className="font-display font-black uppercase text-4xl tracking-tight mb-2">{t.auth.create}</h1>
          <p className="text-concrete text-sm mb-10">{t.auth.haveAccount} <Link to="/login" className="text-ivory underline">{t.actions.signIn}</Link></p>
          <div className="space-y-6">
            <input required minLength={2} className="input-line" placeholder={t.auth.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input required type="email" className="input-line" placeholder={t.auth.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" />
            <input className="input-line" placeholder={t.auth.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
            <input required minLength={8} type="password" className="input-line" placeholder={t.auth.password} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} dir="ltr" />
            <input required minLength={8} type="password" className="input-line" placeholder={t.auth.confirmPassword} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} dir="ltr" />
          </div>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="mt-10 w-full bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm py-4 hover:bg-silver transition-colors disabled:opacity-50">
            {loading ? '…' : t.actions.register}
          </button>
        </form>
      </div>
    </div>
  );
}
