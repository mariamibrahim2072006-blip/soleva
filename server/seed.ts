// SOLEVA seed: categories, products, colors, variants, coupons, admin, reviews.
import { sql } from './db.js';
import bcrypt from 'bcryptjs';

const CATS = [
  ['sneakers', 'Sneakers', 'سنيكرز'],
  ['running', 'Running Shoes', 'أحذية جري'],
  ['casual', 'Casual Shoes', 'أحذية كاجوال'],
  ['formal', 'Formal Shoes', 'أحذية رسمية'],
  ['boots', 'Boots', 'بوتس'],
  ['loafers', 'Loafers', 'لوفرز'],
  ['sandals', 'Sandals', 'صنادل'],
  ['sports', 'Sports Shoes', 'أحذية رياضية'],
] as const;

type P = {
  slug: string; name_en: string; name_ar: string; cat: string; gender: 'men'|'women'|'unisex';
  price: number; sale?: number; material_en: string; material_ar: string;
  desc_en: string; desc_ar: string; is_new?: boolean; best?: boolean; sig?: boolean;
  rating: number; rating_count: number;
  colors: [string, string, string][]; // name_en, name_ar, hex
  sizes: string[]; stock: number;
  images: string[];
};

const IMG = (s: string) => `/images/products/${s}`;

const PRODUCTS: P[] = [
  { slug: 'court-zero', name_en: 'Court Zero', name_ar: 'كورت زيرو', cat: 'sneakers', gender: 'unisex',
    price: 4850, material_en: 'Full-grain leather', material_ar: 'جلد طبيعي فاخر',
    desc_en: 'The essential SOLEVA sneaker. A clean low-top cut from full-grain leather on a sculpted cup sole. Nothing extra, nothing missing.',
    desc_ar: 'سنيكر سوليفا الأساسي. قصّة منخفضة نظيفة من الجلد الطبيعي الفاخر على نعل منحوت. لا شيء زائد ولا شيء ناقص.',
    is_new: true, best: true, sig: true, rating: 4.9, rating_count: 214,
    colors: [['Ivory White', 'أبيض عاجي', '#F2EEE6'], ['Triple Black', 'أسود بالكامل', '#111111']],
    sizes: ['36','37','38','39','40','41','42','43','44','45'], stock: 12,
    images: [IMG('p01-court-zero-a.png'), IMG('p01-court-zero-b.png')] },
  { slug: 'monolith', name_en: 'Monolith', name_ar: 'مونوليث', cat: 'sneakers', gender: 'men',
    price: 6200, material_en: 'Nubuck and mesh', material_ar: 'نوبوك وشبك',
    desc_en: 'A sculpted statement. Oversized proportions, layered nubuck panels and a carved EVA sole that absorbs the city.',
    desc_ar: 'قطعة بارزة منحوتة. أبعاد جريئة وطبقات نوبوك مع نعل إيفا منحوت يمتص إيقاع المدينة.',
    best: true, rating: 4.8, rating_count: 167,
    colors: [['Black / Ivory', 'أسود / عاجي', '#1A1A1A']],
    sizes: ['40','41','42','43','44','45','46'], stock: 9,
    images: [IMG('p02-monolith-a.png'), IMG('p02-monolith-b.png')] },
  { slug: 'velocity-knit', name_en: 'Velocity Knit', name_ar: 'فيلوسيتي نيت', cat: 'running', gender: 'unisex',
    price: 5400, sale: 4590, material_en: 'Engineered knit', material_ar: 'نسيج محبوك هندسياً',
    desc_en: 'A breathable engineered-knit runner on a responsive foam midsole. Built for daily miles, styled for everywhere after.',
    desc_ar: 'حذاء جري بنسيج محبوك يتنفس ونعل أوسط من فوم سريع الاستجابة. مصمم لكيلومتراتك اليومية وأنيق لما بعدها.',
    best: true, rating: 4.7, rating_count: 301,
    colors: [['Concrete Grey', 'رمادي خرساني', '#B9B7B2']],
    sizes: ['36','37','38','39','40','41','42','43','44','45'], stock: 15,
    images: [IMG('p03-velocity-knit-a.png'), IMG('p03-velocity-knit-b.png')] },
  { slug: 'apex-sprint', name_en: 'Apex Sprint', name_ar: 'أبيكس سبرينت', cat: 'running', gender: 'men',
    price: 6800, material_en: 'Ripstop and TPU', material_ar: 'ريبستوب وTPU',
    desc_en: 'Our fastest silhouette. A locked-in ripstop upper, carbon-tuned plate feel and silver details that catch the streetlights.',
    desc_ar: 'أسرع تصميماتنا. خامة ريبستوب محكمة وإحساس بلاطة كربونية وتفاصيل فضية تلمع تحت أضواء الشوارع.',
    is_new: true, rating: 4.8, rating_count: 98,
    colors: [['Black / Silver', 'أسود / فضي', '#141414']],
    sizes: ['40','41','42','43','44','45','46'], stock: 11,
    images: [IMG('p04-apex-sprint-a.png'), IMG('p04-apex-sprint-b.png')] },
  { slug: 'loft-slip', name_en: 'Loft Slip', name_ar: 'لوفت سليب', cat: 'casual', gender: 'women',
    price: 3900, sale: 3310, material_en: 'Suede', material_ar: 'شمواه',
    desc_en: 'A soft suede slip-on with a glove-like fit. The quiet shoe you reach for every single day.',
    desc_ar: 'حذاء سهل الارتداء من الشمواه الناعم بملمس يحتضن القدم. الحذاء الهادئ الذي تختارينه كل يوم.',
    rating: 4.6, rating_count: 143,
    colors: [['Ivory', 'عاجي', '#EDE6D8']],
    sizes: ['36','37','38','39','40','41'], stock: 14,
    images: [IMG('p05-loft-slip-a.png'), IMG('p05-loft-slip-b.png')] },
  { slug: 'terra-chelsea', name_en: 'Terra Chelsea', name_ar: 'تيرا تشيلسي', cat: 'boots', gender: 'men',
    price: 7900, material_en: 'Polished leather', material_ar: 'جلد مصقول',
    desc_en: 'A razor-clean Chelsea boot in polished leather on a lugged rubber sole. From boardroom to midnight.',
    desc_ar: 'بوت تشيلسي بقصّة حادة من الجلد المصقول على نعل مطاطي متين. من الاجتماعات حتى منتصف الليل.',
    best: true, rating: 4.9, rating_count: 122,
    colors: [['Black', 'أسود', '#0E0E0E']],
    sizes: ['40','41','42','43','44','45','46'], stock: 8,
    images: [IMG('p06-terra-chelsea-a.png'), IMG('p06-terra-chelsea-b.png')] },
  { slug: 'dune-boot', name_en: 'Dune Boot', name_ar: 'ديون بوت', cat: 'boots', gender: 'women',
    price: 7400, sale: 6290, material_en: 'Suede', material_ar: 'شمواه',
    desc_en: 'A sand-grey suede ankle boot with a low block heel. Desert tones, city posture.',
    desc_ar: 'بوت قصير من الشمواه بلون الرمال مع كعب منخفض عريض. ألوان الصحراء بحضور المدينة.',
    is_new: true, rating: 4.7, rating_count: 76,
    colors: [['Sand Grey', 'رمادي رملي', '#C9BFAE']],
    sizes: ['36','37','38','39','40','41'], stock: 10,
    images: [IMG('p07-dune-boot-a.png'), IMG('p07-dune-boot-b.png')] },
  { slug: 'regent-oxford', name_en: 'Regent Oxford', name_ar: 'ريجنت أوكسفورد', cat: 'formal', gender: 'men',
    price: 8200, material_en: 'Calf leather', material_ar: 'جلد عجل',
    desc_en: 'A closed-lace oxford in hand-burnished calf leather. The sharpest line in the room.',
    desc_ar: 'حذاء أوكسفورد برباط مغلق من جلد العجل المصقول يدوياً. أحدّ إطلالة في المكان.',
    rating: 4.8, rating_count: 88,
    colors: [['Black', 'أسود', '#101010']],
    sizes: ['39','40','41','42','43','44','45'], stock: 7,
    images: [IMG('p08-regent-oxford-a.png'), IMG('p08-regent-oxford-b.png')] },
  { slug: 'verra-loafer', name_en: 'Verra Loafer', name_ar: 'فيرا لوفر', cat: 'loafers', gender: 'women',
    price: 5600, material_en: 'Nappa leather', material_ar: 'جلد نابا',
    desc_en: 'An ivory nappa loafer finished with a slim silver bit. Soft structure, sharp intent.',
    desc_ar: 'لوفر من جلد النابا العاجي بلمسة فضية رفيعة. نعومة في التصميم وحسم في الحضور.',
    is_new: true, best: true, rating: 4.8, rating_count: 154,
    colors: [['Ivory / Silver', 'عاجي / فضي', '#EFE9DC']],
    sizes: ['36','37','38','39','40','41'], stock: 13,
    images: [IMG('p09-verra-loafer-a.png'), IMG('p09-verra-loafer-b.png')] },
  { slug: 'saddle-loafer', name_en: 'Saddle Loafer', name_ar: 'سادل لوفر', cat: 'loafers', gender: 'men',
    price: 5900, material_en: 'Suede', material_ar: 'شمواه',
    desc_en: 'A concrete-grey suede loafer with an unlined, broken-in feel from the first wear.',
    desc_ar: 'لوفر من الشمواه بالرمادي الخرساني براحة فورية من أول مرة ترتديه.',
    rating: 4.6, rating_count: 92,
    colors: [['Concrete Grey', 'رمادي خرساني', '#A9A6A0']],
    sizes: ['39','40','41','42','43','44','45'], stock: 12,
    images: [IMG('p10-saddle-loafer-a.png'), IMG('p10-saddle-loafer-b.png')] },
  { slug: 'breeze-slide', name_en: 'Breeze Slide', name_ar: 'بريز سلايد', cat: 'sandals', gender: 'unisex',
    price: 2400, sale: 1990, material_en: 'Moulded EVA', material_ar: 'إيفا مصبوب',
    desc_en: 'A minimal one-piece slide in moulded EVA. Pool, street, repeat.',
    desc_ar: 'شبشب عصري بقطعة واحدة من الإيفا المصبوب. للبيت وللشارع وللمصيف.',
    rating: 4.5, rating_count: 231,
    colors: [['Black', 'أسود', '#121212'], ['Ivory', 'عاجي', '#EFEAE0']],
    sizes: ['36','37','38','39','40','41','42','43','44','45'], stock: 20,
    images: [IMG('p11-breeze-slide-a.png'), IMG('p11-breeze-slide-b.png')] },
  { slug: 'court-motion', name_en: 'Court Motion', name_ar: 'كورت موشن', cat: 'sports', gender: 'unisex',
    price: 5100, material_en: 'Leather and mesh', material_ar: 'جلد وشبك',
    desc_en: 'A white and silver training shoe tuned for lateral work, gym floors and long weekends.',
    desc_ar: 'حذاء تمرين أبيض بلمسات فضية مصمم للحركات الجانبية وصالات الجيم وعطلات نهاية الأسبوع الطويلة.',
    best: true, rating: 4.7, rating_count: 176,
    colors: [['White / Silver', 'أبيض / فضي', '#F4F4F2']],
    sizes: ['36','37','38','39','40','41','42','43','44','45'], stock: 13,
    images: [IMG('p12-court-motion-a.png'), IMG('p12-court-motion-b.png')] },
  { slug: 'phantom-high', name_en: 'Phantom High', name_ar: 'فانتوم هاي', cat: 'sneakers', gender: 'men',
    price: 6600, material_en: 'Leather', material_ar: 'جلد',
    desc_en: 'A black high-top that disappears into the night and owns the room. Padded collar, tonal stitching.',
    desc_ar: 'سنيكر هاي أسود يذوب في الليل ويفرض حضوره. ياقة مبطنة وخياطة بنفس اللون.',
    is_new: true, sig: true, rating: 4.9, rating_count: 67,
    colors: [['Triple Black', 'أسود بالكامل', '#0C0C0C']],
    sizes: ['40','41','42','43','44','45','46'], stock: 9,
    images: [IMG('p13-phantom-high-a.png'), IMG('p13-phantom-high-b.png')] },
  { slug: 'aura-knit', name_en: 'Aura Knit', name_ar: 'أورا نيت', cat: 'running', gender: 'women',
    price: 5700, material_en: 'Engineered knit', material_ar: 'نسيج محبوك هندسياً',
    desc_en: 'An ivory knit runner that feels like nothing and looks like everything.',
    desc_ar: 'حذاء جري محبوك باللون العاجي، خفيف كأنه غير موجود وأنيق بشكل لا يُنسى.',
    is_new: true, rating: 4.8, rating_count: 84,
    colors: [['Ivory / White', 'عاجي / أبيض', '#F0EBE0']],
    sizes: ['36','37','38','39','40','41'], stock: 12,
    images: [IMG('p14-aura-knit-a.png'), IMG('p14-aura-knit-b.png')] },
];

const REVIEWS: [string, string, number, string, string][] = [
  // product slug, author, rating, title, body
  ['court-zero', 'Nour H.', 5, 'Perfect everyday sneaker', 'الجلد فخم فعلاً والمقاس مظبوط. وصلني في يومين.'],
  ['court-zero', 'Omar S.', 5, 'Worth every pound', 'Clean design, goes with everything. Delivery to Alexandria was fast.'],
  ['monolith', 'Karim A.', 5, 'Statement piece', 'الشكل مختلف عن أي سنيكر في السوق. مريح جداً رغم حجمه.'],
  ['velocity-knit', 'Sara M.', 5, 'My daily runner', 'Light and breathable. I run 5k every morning in them.'],
  ['terra-chelsea', 'Ahmed R.', 5, 'Premium quality', 'الخامة والتشطيب ممتازين. بوت يستاهل سعره.'],
  ['verra-loafer', 'Mariam I.', 5, 'Elegant and comfortable', 'أنيق جداً ومريح من أول يوم. اللون العاجي أجمل من الصور.'],
  ['court-motion', 'Youssef T.', 4, 'Great gym shoe', 'Solid grip and support. Runs half a size small.'],
  ['phantom-high', 'Hassan E.', 5, 'Best high-top I own', 'الخامة تقيلة والتفاصيل مدروسة. تحفة.'],
];

export async function seed() {
  for (const [slug, en, ar] of CATS) {
    await sql`INSERT INTO categories (slug, name_en, name_ar) VALUES (${slug}, ${en}, ${ar}) ON CONFLICT (slug) DO NOTHING`;
  }
  const catRows = await sql`SELECT id, slug FROM categories`;
  const catId = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));

  for (const p of PRODUCTS) {
    const existing = await sql`SELECT id FROM products WHERE slug = ${p.slug}`;
    let id: string;
    if (existing[0]) {
      id = existing[0].id as string;
      await sql`UPDATE products SET name_en=${p.name_en}, name_ar=${p.name_ar}, description_en=${p.desc_en}, description_ar=${p.desc_ar},
        base_price=${p.price}, sale_price=${p.sale ?? null}, material_en=${p.material_en}, material_ar=${p.material_ar},
        is_new=${!!p.is_new}, is_best_seller=${!!p.best}, is_signature=${!!p.sig}, rating=${p.rating}, rating_count=${p.rating_count} WHERE id=${id}`;
      await sql`DELETE FROM product_images WHERE product_id=${id}`;
      await sql`DELETE FROM product_variants WHERE product_id=${id}`;
      await sql`DELETE FROM product_colors WHERE product_id=${id}`;
    } else {
      const rows = await sql`INSERT INTO products (slug, name_en, name_ar, description_en, description_ar, category_id, gender, base_price, sale_price, material_en, material_ar, is_new, is_best_seller, is_signature, rating, rating_count)
        VALUES (${p.slug}, ${p.name_en}, ${p.name_ar}, ${p.desc_en}, ${p.desc_ar}, ${catId[p.cat]}, ${p.gender}, ${p.price}, ${p.sale ?? null}, ${p.material_en}, ${p.material_ar}, ${!!p.is_new}, ${!!p.best}, ${!!p.sig}, ${p.rating}, ${p.rating_count}) RETURNING id`;
      id = rows[0].id as string;
    }
    for (let i = 0; i < p.images.length; i++) {
      await sql`INSERT INTO product_images (product_id, url, sort) VALUES (${id}, ${p.images[i]}, ${i})`;
    }
    const colorIds: number[] = [];
    for (const [en, ar, hex] of p.colors) {
      const r = await sql`INSERT INTO product_colors (product_id, name_en, name_ar, hex) VALUES (${id}, ${en}, ${ar}, ${hex}) RETURNING id`;
      colorIds.push(r[0].id as number);
    }
    let n = 0;
    for (const colorId of colorIds) {
      for (const size of p.sizes) {
        // deterministic varying stock; a few sizes sold out
        const stock = (n % 7 === 3) ? 0 : p.stock + (n % 4);
        await sql`INSERT INTO product_variants (product_id, color_id, size, stock) VALUES (${id}, ${colorId}, ${size}, ${stock})`;
        n++;
      }
    }
  }

  // Coupons
  await sql`INSERT INTO coupons (code, kind, value, min_subtotal) VALUES ('WELCOME10', 'percent', 10, 0) ON CONFLICT (code) DO NOTHING`;
  await sql`INSERT INTO coupons (code, kind, value, min_subtotal) VALUES ('SOLEVA20', 'percent', 20, 8000) ON CONFLICT (code) DO NOTHING`;
  await sql`INSERT INTO coupons (code, kind, value, min_subtotal) VALUES ('FLAT300', 'fixed', 300, 3000) ON CONFLICT (code) DO NOTHING`;

  // Admin + demo customer (passwords come from env; defaults documented for local dev)
  const adminPw = process.env.SEED_ADMIN_PASSWORD || 'SolevaAdmin!2026';
  const adminHash = await bcrypt.hash(adminPw, 10);
  await sql`INSERT INTO users (email, password_hash, full_name, role) VALUES ('admin@soleva-eg.com', ${adminHash}, 'SOLEVA Admin', 'admin')
    ON CONFLICT (email) DO UPDATE SET role = 'admin'`;
  const demoHash = await bcrypt.hash('DemoCustomer!2026', 10);
  await sql`INSERT INTO users (email, password_hash, full_name, phone, role) VALUES ('demo@soleva-eg.com', ${demoHash}, 'Demo Customer', '+201055500111', 'customer')
    ON CONFLICT (email) DO NOTHING`;

  // Reviews
  const reviewCount = await sql`SELECT count(*)::int AS n FROM reviews`;
  if ((reviewCount[0].n as number) === 0) {
    for (const [slug, author, rating, title, body] of REVIEWS) {
      const prod = await sql`SELECT id FROM products WHERE slug = ${slug}`;
      if (prod[0]) await sql`INSERT INTO reviews (product_id, author_name, rating, title, body) VALUES (${prod[0].id}, ${author}, ${rating}, ${title}, ${body})`;
    }
  }

  const [stats] = await sql`SELECT (SELECT count(*) FROM products)::int AS products, (SELECT count(*) FROM product_variants)::int AS variants`;
  console.log('seeded:', JSON.stringify(stats));
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
