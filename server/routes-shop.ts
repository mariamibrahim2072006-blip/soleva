import { Router } from 'express';
import { z } from 'zod';
import { sql } from './db.js';
import { optionalAuth, type AuthedRequest } from './auth.js';
import { shapeProducts, productQuery } from './shape.js';

export const shopRouter = Router();

export const EGYPT_GOVERNORATES: { name: string; fee: number }[] = [
  { name: 'Cairo', fee: 60 }, { name: 'Giza', fee: 60 }, { name: 'Alexandria', fee: 70 },
  { name: 'Qalyubia', fee: 70 }, { name: 'Dakahlia', fee: 80 }, { name: 'Sharqia', fee: 80 },
  { name: 'Gharbia', fee: 80 }, { name: 'Monufia', fee: 80 }, { name: 'Kafr El Sheikh', fee: 85 },
  { name: 'Damietta', fee: 85 }, { name: 'Port Said', fee: 85 }, { name: 'Ismailia', fee: 85 },
  { name: 'Suez', fee: 85 }, { name: 'Beheira', fee: 85 }, { name: 'Faiyum', fee: 90 },
  { name: 'Beni Suef', fee: 90 }, { name: 'Minya', fee: 95 }, { name: 'Assiut', fee: 95 },
  { name: 'Sohag', fee: 95 }, { name: 'Qena', fee: 100 }, { name: 'Luxor', fee: 100 },
  { name: 'Aswan', fee: 100 }, { name: 'Red Sea', fee: 110 }, { name: 'New Valley', fee: 110 },
  { name: 'Matrouh', fee: 100 }, { name: 'North Sinai', fee: 110 }, { name: 'South Sinai', fee: 110 },
];

shopRouter.get('/shipping', (_req, res) => {
  res.json({ country: 'Egypt', governorates: EGYPT_GOVERNORATES });
});

shopRouter.get('/categories', async (_req, res) => {
  const rows = await sql`SELECT c.*, count(p.id)::int AS product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id GROUP BY c.id ORDER BY c.id`;
  res.json({ categories: rows });
});

shopRouter.get('/products', async (req, res) => {
  const q = (req.query.q as string)?.trim() || '';
  const category = (req.query.category as string) || '';
  const gender = (req.query.gender as string) || '';
  const size = (req.query.size as string) || '';
  const color = (req.query.color as string) || '';
  const material = (req.query.material as string) || '';
  const minPrice = parseInt(req.query.min as string) || 0;
  const maxPrice = parseInt(req.query.max as string) || 0;
  const availability = (req.query.availability as string) || '';
  const collection = (req.query.collection as string) || ''; // new | best | sale | signature
  const sort = (req.query.sort as string) || 'newest';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(48, parseInt(req.query.limit as string) || 12);

  const rows = await productQuery();
  let list = await shapeProducts(rows as any[]);

  if (q) {
    const needle = q.toLowerCase();
    list = list.filter((p) =>
      [p.name_en, p.name_ar, p.description_en, p.description_ar, p.category_en, p.category_ar]
        .join(' ').toLowerCase().includes(needle));
  }
  if (category) list = list.filter((p) => p.category_slug === category);
  if (gender) list = list.filter((p) => p.gender === gender || p.gender === 'unisex');
  if (size) list = list.filter((p) => p.variants.some((v: any) => v.size === size && v.stock > 0));
  if (color) {
    const needle = color.toLowerCase();
    list = list.filter((p) => p.colors.some((c: any) => c.name_en.toLowerCase().includes(needle) || c.hex.toLowerCase() === needle));
  }
  if (material) {
    const needle = material.toLowerCase();
    list = list.filter((p) => (p.material_en || '').toLowerCase().includes(needle));
  }
  if (minPrice) list = list.filter((p) => p.price >= minPrice);
  if (maxPrice) list = list.filter((p) => p.price <= maxPrice);
  if (availability === 'in_stock') list = list.filter((p) => p.total_stock > 0);
  if (collection === 'new') list = list.filter((p) => p.is_new);
  if (collection === 'best') list = list.filter((p) => p.is_best_seller);
  if (collection === 'sale') list = list.filter((p) => p.on_sale);
  if (collection === 'signature') list = list.filter((p) => p.is_signature);

  switch (sort) {
    case 'price_asc': list.sort((a, b) => a.price - b.price); break;
    case 'price_desc': list.sort((a, b) => b.price - a.price); break;
    case 'popular': list.sort((a, b) => b.rating_count - a.rating_count || b.rating - a.rating); break;
    case 'best_selling': list.sort((a, b) => Number(b.is_best_seller) - Number(a.is_best_seller) || b.rating_count - a.rating_count); break;
    default: list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }

  const total = list.length;
  const items = list.slice((page - 1) * limit, page * limit);
  const facets = {
    sizes: [...new Set(list.flatMap((p) => p.variants.map((v: any) => v.size)))].sort((a, b) => +a - +b),
    colors: [...new Set(list.flatMap((p) => p.colors.map((c: any) => c.name_en)))],
    materials: [...new Set(list.map((p) => p.material_en).filter(Boolean))],
    price_max: Math.max(0, ...list.map((p) => p.price)),
  };
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), facets });
});

shopRouter.get('/products/:slug', async (req, res) => {
  const rows = await productQuery('WHERE p.slug = $1', [req.params.slug]);
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  const [product] = await shapeProducts(rows as any[]);
  const reviews = await sql`SELECT r.id, r.author_name, r.rating, r.title, r.body, r.created_at FROM reviews r WHERE r.product_id = ${product.id} ORDER BY r.created_at DESC LIMIT 20`;
  const relatedRows = await productQuery('WHERE c.slug = $1 AND p.id != $2 LIMIT 4', [product.category_slug, product.id]);
  const related = await shapeProducts(relatedRows as any[]);
  res.json({ product, reviews, related });
});

const reviewSchema = z.object({
  author_name: z.string().min(2).max(120),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(160).optional().default(''),
  body: z.string().max(2000).optional().default(''),
});

shopRouter.post('/products/:slug/reviews', optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const prod = await sql`SELECT id FROM products WHERE slug = ${req.params.slug}`;
  if (!prod[0]) return res.status(404).json({ error: 'not_found' });
  const d = parsed.data;
  const rows = await sql`INSERT INTO reviews (product_id, user_id, author_name, rating, title, body)
    VALUES (${prod[0].id}, ${req.user?.id ?? null}, ${d.author_name}, ${d.rating}, ${d.title}, ${d.body}) RETURNING *`;
  const agg = await sql`SELECT round(avg(rating)::numeric, 1) AS r, count(*)::int AS n FROM reviews WHERE product_id = ${prod[0].id}`;
  await sql`UPDATE products SET rating = ${agg[0].r}, rating_count = ${agg[0].n} WHERE id = ${prod[0].id}`;
  res.status(201).json({ review: rows[0] });
});

shopRouter.post('/coupons/validate', async (req, res) => {
  const schema = z.object({ code: z.string().min(2).max(40), subtotal: z.number().int().min(0) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const rows = await sql`SELECT * FROM coupons WHERE code = upper(${parsed.data.code}) AND active = true AND (expires_at IS NULL OR expires_at > now())`;
  const c = rows[0];
  if (!c) return res.status(404).json({ error: 'invalid_coupon' });
  if (parsed.data.subtotal < (c.min_subtotal as number)) {
    return res.status(400).json({ error: 'min_subtotal_not_met', min_subtotal: c.min_subtotal });
  }
  const discount = c.kind === 'percent'
    ? Math.round(parsed.data.subtotal * (c.value as number) / 100)
    : Math.min(c.value as number, parsed.data.subtotal);
  res.json({ code: c.code, kind: c.kind, value: c.value, discount });
});

shopRouter.post('/newsletter', async (req, res) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  await sql`INSERT INTO newsletter (email) VALUES (${parsed.data.email.toLowerCase()}) ON CONFLICT (email) DO NOTHING`;
  res.json({ ok: true });
});

shopRouter.post('/contact', async (req, res) => {
  const schema = z.object({ name: z.string().min(2).max(120), email: z.string().email(), subject: z.string().max(200).optional().default(''), message: z.string().min(5).max(4000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const d = parsed.data;
  await sql`INSERT INTO contacts (name, email, subject, message) VALUES (${d.name}, ${d.email}, ${d.subject}, ${d.message})`;
  res.json({ ok: true });
});
