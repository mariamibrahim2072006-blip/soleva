import { Router } from 'express';
import { z } from 'zod';
import { sql } from './db.js';
import { requireAdmin } from './auth.js';
import { shapeProducts, productQuery } from './shape.js';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get('/stats', async (_req, res) => {
  const [rev] = await sql`SELECT COALESCE(sum(total),0)::int AS revenue, count(*)::int AS orders FROM orders WHERE status != 'cancelled'`;
  const [prod] = await sql`SELECT count(*)::int AS products FROM products`;
  const [cust] = await sql`SELECT count(*)::int AS customers FROM users WHERE role = 'customer'`;
  const byStatus = await sql`SELECT status, count(*)::int AS n FROM orders GROUP BY status`;
  const daily = await sql`SELECT date_trunc('day', created_at)::date AS day, sum(total)::int AS revenue, count(*)::int AS orders
    FROM orders WHERE created_at > now() - interval '30 days' AND status != 'cancelled' GROUP BY 1 ORDER BY 1`;
  const best = await sql`SELECT name_en, sum(qty)::int AS sold, sum(qty * unit_price)::int AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.status != 'cancelled'
    GROUP BY name_en ORDER BY sold DESC LIMIT 5`;
  const recent = await sql`SELECT order_number, full_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 8`;
  res.json({ revenue: rev.revenue, orders: rev.orders, products: prod.products, customers: cust.customers, by_status: byStatus, daily, best_sellers: best, recent_orders: recent });
});

// ----- Products CRUD -----
const productSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/).max(120),
  name_en: z.string().min(2).max(160), name_ar: z.string().min(2).max(160),
  description_en: z.string().max(4000).optional().default(''),
  description_ar: z.string().max(4000).optional().default(''),
  category_slug: z.string(),
  gender: z.enum(['men', 'women', 'unisex']),
  base_price: z.number().int().min(0),
  sale_price: z.number().int().min(0).nullable().optional(),
  material_en: z.string().max(200).optional().default(''),
  material_ar: z.string().max(200).optional().default(''),
  is_new: z.boolean().optional().default(false),
  is_best_seller: z.boolean().optional().default(false),
  is_signature: z.boolean().optional().default(false),
  images: z.array(z.string()).max(8).optional().default([]),
  colors: z.array(z.object({ name_en: z.string(), name_ar: z.string(), hex: z.string() })).max(8).optional().default([]),
  variants: z.array(z.object({ color_index: z.number().int(), size: z.string(), stock: z.number().int().min(0) })).max(200).optional().default([]),
});

adminRouter.get('/products', async (_req, res) => {
  const rows = await productQuery('ORDER BY p.created_at DESC');
  res.json({ items: await shapeProducts(rows as any[]) });
});

adminRouter.post('/products', async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input', details: parsed.error.issues });
  const d = parsed.data;
  const cat = await sql`SELECT id FROM categories WHERE slug = ${d.category_slug}`;
  if (!cat[0]) return res.status(400).json({ error: 'unknown_category' });
  const exists = await sql`SELECT id FROM products WHERE slug = ${d.slug}`;
  if (exists[0]) return res.status(409).json({ error: 'slug_taken' });
  const rows = await sql`INSERT INTO products (slug, name_en, name_ar, description_en, description_ar, category_id, gender, base_price, sale_price, material_en, material_ar, is_new, is_best_seller, is_signature)
    VALUES (${d.slug}, ${d.name_en}, ${d.name_ar}, ${d.description_en}, ${d.description_ar}, ${cat[0].id}, ${d.gender}, ${d.base_price}, ${d.sale_price ?? null}, ${d.material_en}, ${d.material_ar}, ${d.is_new}, ${d.is_best_seller}, ${d.is_signature}) RETURNING *`;
  const p = rows[0];
  for (let i = 0; i < d.images.length; i++) await sql`INSERT INTO product_images (product_id, url, sort) VALUES (${p.id}, ${d.images[i]}, ${i})`;
  const colorIds: number[] = [];
  for (const c of d.colors) {
    const r = await sql`INSERT INTO product_colors (product_id, name_en, name_ar, hex) VALUES (${p.id}, ${c.name_en}, ${c.name_ar}, ${c.hex}) RETURNING id`;
    colorIds.push(r[0].id as number);
  }
  for (const v of d.variants) {
    const colorId = colorIds[v.color_index];
    if (colorId) await sql`INSERT INTO product_variants (product_id, color_id, size, stock) VALUES (${p.id}, ${colorId}, ${v.size}, ${v.stock}) ON CONFLICT (product_id, color_id, size) DO UPDATE SET stock = EXCLUDED.stock`;
  }
  res.status(201).json({ product: p });
});

adminRouter.put('/products/:id', async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const d = parsed.data;
  const cur = await sql`SELECT * FROM products WHERE id = ${req.params.id}`;
  if (!cur[0]) return res.status(404).json({ error: 'not_found' });
  const m = { ...cur[0], ...d } as any;
  let categoryId = m.category_id;
  if (d.category_slug) {
    const cat = await sql`SELECT id FROM categories WHERE slug = ${d.category_slug}`;
    if (!cat[0]) return res.status(400).json({ error: 'unknown_category' });
    categoryId = cat[0].id;
  }
  await sql`UPDATE products SET slug=${m.slug}, name_en=${m.name_en}, name_ar=${m.name_ar}, description_en=${m.description_en}, description_ar=${m.description_ar},
    category_id=${categoryId}, gender=${m.gender}, base_price=${m.base_price}, sale_price=${m.sale_price ?? null}, material_en=${m.material_en}, material_ar=${m.material_ar},
    is_new=${m.is_new}, is_best_seller=${m.is_best_seller}, is_signature=${m.is_signature} WHERE id=${req.params.id}`;
  if (d.images) {
    await sql`DELETE FROM product_images WHERE product_id = ${req.params.id}`;
    for (let i = 0; i < d.images.length; i++) await sql`INSERT INTO product_images (product_id, url, sort) VALUES (${req.params.id}, ${d.images[i]}, ${i})`;
  }
  if (d.variants) {
    // Update stock per size/color pair; pairs not listed keep their stock.
    for (const v of d.variants) {
      const colors = await sql`SELECT id FROM product_colors WHERE product_id = ${req.params.id} ORDER BY id`;
      const colorId = (colors[v.color_index] as any)?.id;
      if (colorId) await sql`INSERT INTO product_variants (product_id, color_id, size, stock) VALUES (${req.params.id}, ${colorId}, ${v.size}, ${v.stock}) ON CONFLICT (product_id, color_id, size) DO UPDATE SET stock = EXCLUDED.stock`;
    }
  }
  res.json({ ok: true });
});

adminRouter.delete('/products/:id', async (req, res) => {
  await sql`DELETE FROM products WHERE id = ${req.params.id}`;
  res.json({ ok: true });
});

// ----- Orders -----
adminRouter.get('/orders', async (req, res) => {
  const status = (req.query.status as string) || '';
  const rows = status
    ? await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC LIMIT 200`
    : await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`;
  res.json({ orders: rows });
});

adminRouter.get('/orders/:orderNumber', async (req, res) => {
  const rows = await sql`SELECT * FROM orders WHERE order_number = upper(${req.params.orderNumber})`;
  if (!rows[0]) return res.status(404).json({ error: 'not_found' });
  const items = await sql`SELECT * FROM order_items WHERE order_id = ${rows[0].id}`;
  res.json({ order: rows[0], items });
});

adminRouter.put('/orders/:orderNumber', async (req, res) => {
  const schema = z.object({ status: z.enum(['placed', 'confirmed', 'shipped', 'delivered', 'cancelled']), payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']).optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const cur = await sql`SELECT * FROM orders WHERE order_number = upper(${req.params.orderNumber})`;
  if (!cur[0]) return res.status(404).json({ error: 'not_found' });
  const history = [...(cur[0].status_history as any[]), { status: parsed.data.status, at: new Date().toISOString() }];
  await sql`UPDATE orders SET status = ${parsed.data.status}, payment_status = COALESCE(${parsed.data.payment_status ?? null}, payment_status), status_history = ${JSON.stringify(history)} WHERE id = ${cur[0].id}`;
  // Restock on cancellation
  if (parsed.data.status === 'cancelled' && cur[0].status !== 'cancelled') {
    const items = await sql`SELECT * FROM order_items WHERE order_id = ${cur[0].id}`;
    for (const it of items) {
      if (it.product_id) await sql`UPDATE product_variants SET stock = stock + ${it.qty} WHERE product_id = ${it.product_id} AND size = ${it.size}`;
    }
  }
  res.json({ ok: true });
});

// ----- Customers -----
adminRouter.get('/customers', async (_req, res) => {
  const rows = await sql`SELECT u.id, u.email, u.full_name, u.phone, u.created_at,
      count(o.id)::int AS order_count, COALESCE(sum(o.total),0)::int AS lifetime_value
    FROM users u LEFT JOIN orders o ON o.user_id = u.id AND o.status != 'cancelled'
    WHERE u.role = 'customer' GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200`;
  res.json({ customers: rows });
});

adminRouter.get('/customers/:id', async (req, res) => {
  const u = await sql`SELECT id, email, full_name, phone, created_at FROM users WHERE id = ${req.params.id}`;
  if (!u[0]) return res.status(404).json({ error: 'not_found' });
  const orders = await sql`SELECT order_number, total, status, created_at FROM orders WHERE user_id = ${req.params.id} ORDER BY created_at DESC`;
  const addresses = await sql`SELECT * FROM addresses WHERE user_id = ${req.params.id}`;
  res.json({ customer: u[0], orders, addresses });
});

// ----- Coupons -----
adminRouter.get('/coupons', async (_req, res) => {
  res.json({ coupons: await sql`SELECT * FROM coupons ORDER BY code` });
});

adminRouter.post('/coupons', async (req, res) => {
  const schema = z.object({ code: z.string().min(2).max(40), kind: z.enum(['percent', 'fixed']), value: z.number().int().min(1), min_subtotal: z.number().int().min(0).optional().default(0), expires_at: z.string().nullable().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const d = parsed.data;
  const rows = await sql`INSERT INTO coupons (code, kind, value, min_subtotal, expires_at) VALUES (upper(${d.code}), ${d.kind}, ${d.value}, ${d.min_subtotal}, ${d.expires_at ?? null})
    ON CONFLICT (code) DO UPDATE SET kind = EXCLUDED.kind, value = EXCLUDED.value, min_subtotal = EXCLUDED.min_subtotal, expires_at = EXCLUDED.expires_at, active = true RETURNING *`;
  res.status(201).json({ coupon: rows[0] });
});

adminRouter.delete('/coupons/:code', async (req, res) => {
  await sql`UPDATE coupons SET active = false WHERE code = upper(${req.params.code})`;
  res.json({ ok: true });
});
