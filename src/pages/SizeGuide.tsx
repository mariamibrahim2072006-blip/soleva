import { useLang } from '../lang';
import { SizeTable } from './ProductPage';

export default function SizeGuide() {
  const { t, lang } = useLang();
  return (
    <div className="max-w-3xl mx-auto px-5 pt-32 pb-24">
      <h1 className="font-display font-black uppercase text-4xl md:text-6xl tracking-tight mb-6">{t.nav.sizeGuide}</h1>
      <p className="text-ivory/70 leading-loose mb-10">
        {lang === 'ar'
          ? 'قيسي قدمك من الكعب حتى أطول إصبع بالسنتيمتر وقارنيها بالجدول. إذا كنتِ بين مقاسين، اختاري الأكبر. مقاسات سوليفا مضبوطة على المقاس الأوروبي.'
          : 'Measure your foot from heel to longest toe in centimeters and match it below. Between sizes? Take the larger one. SOLEVA fits true to EU sizing.'}
      </p>
      <div className="border border-line p-6"><SizeTable /></div>
      <div className="mt-10 space-y-4 text-sm text-concrete leading-relaxed">
        <p>{lang === 'ar' ? '• السنيكرز والأحذية الرياضية: مقاس مضبوط.' : '• Sneakers and sports shoes: true to size.'}</p>
        <p>{lang === 'ar' ? '• البوتس والأحذية الرسمية: إذا كان كعبك عريضاً خذ نصف مقاس أكبر.' : '• Boots and formal shoes: wide feet may prefer half a size up.'}</p>
        <p>{lang === 'ar' ? '• الشباشب: اطلب مقاسك المعتاد.' : '• Slides: order your usual size.'}</p>
      </div>
    </div>
  );
}
