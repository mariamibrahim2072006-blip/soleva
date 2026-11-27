import { useLang } from '../lang';

const CONTENT: Record<string, { en: { title: string; sections: [string, string][] }; ar: { title: string; sections: [string, string][] } }> = {
  shipping: {
    en: { title: 'Shipping & Returns', sections: [
      ['Shipping', 'We deliver to all 27 Egyptian governorates within 2-5 business days. Shipping fees are calculated at checkout by governorate (EGP 60-110). Orders over EGP 10,000 ship free.'],
      ['Cash on Delivery', 'Pay in cash when your order arrives. Please prepare the exact amount where possible.'],
      ['Returns', 'Unworn pairs in original packaging can be returned within 14 days of delivery. Contact us with your order number and we arrange the pickup. Refunds are issued to the original payment method (cash refunds via bank transfer or wallet within 5 business days).'],
      ['Exchanges', 'Wrong size? We exchange once for free within 14 days, subject to stock.'],
    ]},
    ar: { title: 'الشحن والإرجاع', sections: [
      ['الشحن', 'نوصل لجميع محافظات مصر الـ27 خلال 2-5 أيام عمل. تُحسب رسوم الشحن عند إتمام الطلب حسب المحافظة (60-110 جنيه). الطلبات فوق 10,000 جنيه شحنها مجاني.'],
      ['الدفع عند الاستلام', 'ادفع نقداً عند وصول طلبك. يُفضّل تجهيز المبلغ المطلوب قدر الإمكان.'],
      ['الإرجاع', 'يمكن إرجاع الأحذية غير المستعملة بتغليفها الأصلي خلال 14 يوماً من الاستلام. راسلنا برقم الطلب وسنرتب الاستلام. يتم رد المبلغ خلال 5 أيام عمل.'],
      ['الاستبدال', 'مقاس غلط؟ نستبدل مرة واحدة مجاناً خلال 14 يوماً حسب توفر المخزون.'],
    ]},
  },
  faq: {
    en: { title: 'Frequently Asked Questions', sections: [
      ['Are SOLEVA shoes true to size?', 'Yes, we fit true to EU sizing. Check the size guide for CM measurements.'],
      ['Which payment methods do you accept?', 'Cash on Delivery across Egypt. Card payments are being rolled out.'],
      ['How long does delivery take?', '2-5 business days depending on your governorate. Cairo and Giza are usually fastest.'],
      ['Can I track my order?', 'Yes — use the Track Order page with your order number and checkout email.'],
      ['Do you ship outside Egypt?', 'Not yet. SOLEVA currently delivers within Egypt only.'],
      ['How do I use a coupon?', 'Enter the code at checkout in the Order Summary box and press Apply.'],
    ]},
    ar: { title: 'الأسئلة الشائعة', sections: [
      ['هل مقاسات سوليفا مضبوطة؟', 'نعم، مقاساتنا مضبوطة على المقاس الأوروبي. راجع دليل المقاسات للقياس بالسنتيمتر.'],
      ['ما هي طرق الدفع المتاحة؟', 'الدفع عند الاستلام في جميع المحافظات. الدفع بالبطاقة قيد التفعيل.'],
      ['كم يستغرق التوصيل؟', 'من 2 إلى 5 أيام عمل حسب المحافظة. القاهرة والجيزة عادة الأسرع.'],
      ['هل يمكنني تتبع طلبي؟', 'نعم — استخدم صفحة تتبع الطلب برقم الطلب والبريد المستخدم عند الشراء.'],
      ['هل تشحنون خارج مصر؟', 'ليس بعد. سوليفا توصل داخل مصر فقط حالياً.'],
      ['كيف أستخدم كود الخصم؟', 'أدخل الكود في ملخص الطلب عند إتمام الشراء واضغط تطبيق.'],
    ]},
  },
  privacy: {
    en: { title: 'Privacy Policy', sections: [
      ['What we collect', 'Account details (name, email, phone), delivery addresses and order history. We do not store card data.'],
      ['How we use it', 'To fulfil orders, provide order tracking, and — only if you subscribe — send occasional emails about drops and offers.'],
      ['What we never do', 'We never sell your data or share it with advertisers.'],
      ['Demo notice', 'This is a portfolio demonstration store. Data you enter is stored in a demonstration database and no real orders are fulfilled.'],
    ]},
    ar: { title: 'سياسة الخصوصية', sections: [
      ['ما الذي نجمعه', 'بيانات الحساب (الاسم والبريد والهاتف) وعناوين التوصيل وسجل الطلبات. لا نخزن بيانات البطاقات.'],
      ['كيف نستخدمه', 'لتنفيذ الطلبات وتوفير تتبع الطلب، وإرسال رسائل عن الإصدارات والعروض فقط إذا اشتركت في القائمة.'],
      ['ما لا نفعله أبداً', 'لا نبيع بياناتك ولا نشاركها مع معلنين.'],
      ['تنبيه العرض التجريبي', 'هذا متجر تجريبي ضمن أعمال البورتفوليو. البيانات المدخلة تُحفظ في قاعدة بيانات تجريبية ولا يتم تنفيذ طلبات حقيقية.'],
    ]},
  },
  terms: {
    en: { title: 'Terms & Conditions', sections: [
      ['The store', 'SOLEVA is a premium footwear demonstration store. By using the site you agree to these terms.'],
      ['Orders', 'Orders are confirmed by email and fulfilled within 2-5 business days. Prices are in Egyptian Pounds and include VAT.'],
      ['Availability', 'All pairs are produced in limited runs. If an item becomes unavailable after ordering, we refund in full.'],
      ['Demo notice', 'This is a portfolio demonstration store. No real orders are fulfilled and no payments are processed.'],
    ]},
    ar: { title: 'الشروط والأحكام', sections: [
      ['المتجر', 'سوليفا متجر أحذية فاخر تجريبي. باستخدامك الموقع فأنت توافق على هذه الشروط.'],
      ['الطلبات', 'يتم تأكيد الطلبات بالبريد الإلكتروني وتنفيذها خلال 2-5 أيام عمل. الأسعار بالجنيه المصري وشاملة الضريبة.'],
      ['التوفر', 'جميع الأحذية تُنتج بكميات محدودة. إذا نفد منتج بعد طلبك نرد لك المبلغ كاملاً.'],
      ['تنبيه العرض التجريبي', 'هذا متجر تجريبي ضمن أعمال البورتفوليو. لا يتم تنفيذ طلبات حقيقية ولا معالجة مدفوعات.'],
    ]},
  },
};

export default function StaticPage({ page }: { page: string }) {
  const { lang } = useLang();
  const c = CONTENT[page]?.[lang] ?? CONTENT[page]?.en;
  if (!c) return null;
  return (
    <div className="max-w-3xl mx-auto px-5 pt-32 pb-24">
      <h1 className="font-display font-black uppercase text-4xl md:text-5xl tracking-tight mb-12">{c.title}</h1>
      <div className="space-y-10">
        {c.sections.map(([h, b]) => (
          <section key={h}>
            <h2 className="font-display font-bold uppercase tracking-wide text-lg mb-3">{h}</h2>
            <p className="text-ivory/70 leading-loose">{b}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
