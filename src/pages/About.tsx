import { useLang } from '../lang';
import Reveal, { MaskImage, SplitWords } from '../components/Reveal';

export default function About() {
  const { t } = useLang();
  return (
    <div>
      <section className="band-yellow max-w-[1600px] mx-auto px-5 md:px-10 pt-36 md:pt-44 pb-16">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-ivory mb-4">{t.aboutPage.kicker}</p>
        <h1 className="font-display font-black uppercase text-[11vw] md:text-[6.5vw] leading-[0.95] tracking-tight max-w-5xl">
          <SplitWords text={t.aboutPage.title} />
        </h1>
      </section>
      <section className="max-w-[1600px] mx-auto px-5 md:px-10 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <MaskImage src="/images/campaign-1.webp" alt="SOLEVA campaign" className="aspect-[4/3]" />
        <div className="space-y-8 text-concrete leading-relaxed text-base md:text-lg font-medium lg:pt-10">
          <Reveal><p className="font-display font-black uppercase tracking-tight text-2xl md:text-3xl text-ivory leading-relaxed">{t.aboutPage.p1}</p></Reveal>
          <Reveal delay={0.1}><p>{t.aboutPage.p2}</p></Reveal>
          <Reveal delay={0.15}><p>{t.aboutPage.p3}</p></Reveal>
        </div>
      </section>
      <section className="border-t border-line">
        <div className="max-w-[1600px] mx-auto px-5 md:px-10 py-24 grid grid-cols-2 md:grid-cols-4 gap-10">
          {[['2024', 'Founded'], ['14', 'Silhouettes'], ['214', 'QC checkpoints'], ['27', 'Governorates served']].map(([n, l]) => (
            <Reveal key={l}><div><div className="font-display font-black text-4xl md:text-5xl">{n}</div><div className="text-concrete text-xs uppercase tracking-widest mt-2">{l}</div></div></Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
