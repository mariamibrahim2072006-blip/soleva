import { useState } from 'react';
import { useLang } from '../lang';
import { api } from '../api';

export default function Contact() {
  const { t } = useLang();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/contact', { method: 'POST', body: JSON.stringify(form) });
      setSent(true);
    } catch { /* validation errors render below */ }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-5 md:px-10 pt-32 md:pt-40 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div>
        <h1 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight mb-6">{t.contactPage.title}</h1>
        <p className="text-ivory/70 leading-loose max-w-md">{t.contactPage.sub}</p>
        <div className="mt-12 space-y-4 text-sm text-concrete">
          <p>hello@soleva-eg.com</p>
          <p dir="ltr">+20 155 555 0100</p>
          <p>{t.checkout.egypt}</p>
        </div>
      </div>
      {sent ? (
        <p className="text-silver uppercase tracking-widest self-center">{t.contactPage.sent}</p>
      ) : (
        <form onSubmit={submit} className="space-y-6 lg:pt-8">
          <input required minLength={2} className="input-line" placeholder={t.contactPage.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" className="input-line" placeholder={t.auth.email} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" />
          <input className="input-line" placeholder={t.contactPage.subject} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea required minLength={5} className="input-line min-h-32" placeholder={t.contactPage.message} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button className="bg-ivory text-ink font-display font-bold uppercase tracking-[0.2em] text-sm px-10 py-4 hover:bg-silver transition-colors">{t.actions.send}</button>
        </form>
      )}
    </div>
  );
}
