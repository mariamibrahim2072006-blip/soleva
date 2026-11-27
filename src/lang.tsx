import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dict, type Dict, type Lang } from './i18n';

interface LangCtx {
  lang: Lang;
  t: Dict;
  dir: 'ltr' | 'rtl';
  setLang: (l: Lang) => void;
  fmt: (egp: number) => string;
}

const Ctx = createContext<LangCtx>(null as never);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem('soleva-lang') as Lang) || 'en');
  const setLang = (l: Lang) => { setLangState(l); localStorage.setItem('soleva-lang', l); };
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = lang === 'ar' ? 'سوليفا — تجاوز المعتاد' : 'SOLEVA — Step Beyond Ordinary';
  }, [lang]);
  const value = useMemo<LangCtx>(() => ({
    lang,
    t: dict[lang] as Dict,
    dir: lang === 'ar' ? 'rtl' : 'ltr',
    setLang,
    fmt: (egp: number) => new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency', currency: 'EGP', maximumFractionDigits: 0,
    }).format(egp),
  }), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
