import { useLang } from '../lang';
import { SizeTable } from './ProductPage';

export default function SizeGuide() {
  const { t, lang } = useLang();
  return (
    <div className="band-yellow max-w-3xl mx-auto px-5 pt-32 pb-24">
      <h1 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight mb-6">{t.nav.sizeGuide}</h1>
      <p className="text-concrete leading-relaxed text-base md:text-lg font-medium mb-10">
        {lang === 'ar'
          ? 'قيسي قدمك من الكعب حتى أطول إصبع بالسنتيمتر وقارنيها بالجدول. إذا كنتِ بين مقاسين، اختاري الأكبر. مقاسات سوليفا مضبوطة على المقاس الأوروبي.'
          : 'Measure your foot from heel to longest toe in centimeters and match it below. Between sizes? Take the larger one. SOLEVA fits true to EU sizing.'}
      </p>
      <div className="border border-line p-6"><SizeTable /></div>
      <div className="mt-10 space-y-4 text-sm text-concrete leading-relaxed">
        <p>{lang === 'ar' ? '• السنيكرز والأحذية الرياضية: مقاس مضبوط.' : '• Sneakers and running shoes: true to size. Between sizes? Take the larger one for running.'}</p>
      </div>
    </div>
  );
}
