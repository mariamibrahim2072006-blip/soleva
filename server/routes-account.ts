import { Router } from 'express';
import { z } from 'zod';
import { customAlphabet } from 'nanoid';
import { sql } from './db.js';
import { requireAuth, optionalAuth, type AuthedRequest } from './auth.js';
import { EGYPT_GOVERNORATES } from './routes-shop.js';

export const accountRouter = Router();
const orderNo = customAlphabet('0123456789ABCDEFGHJKMNPQRSTVWXYZ', 8);

// ---------- Cart ----------
async function cartFor(userId: string) {
  const rows = await sql`
    SELECT ci.id AS cart_item_id, ci.qty, v.id AS variant_id, v.size, v.stock,
           c.id AS color_id, c.name_en AS color_en, c.name_ar AS color_ar, c.hex,
           p.id AS product_id, p.slug, p.name_en, p.name_ar, p.base_price, p.sale_price,
           (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY sort LIMIT 1) AS image_url
    FROM cart_items ci
    JOIN product_variants v ON v.id = ci.variant_id
    JOIN product_colors c ON c.id = v.color_id
    JOIN products p ON p.id = v.product_id
    WHERE ci.user_id = ${userId} ORDER BY ci.created_at`;
  const items = rows.map((r) => ({ ...r, unit_price: r.sale_price ?? r.base_price }));
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.qty, 0);
  return { items, subtotal };
}

accountRouter.get('/cart', requireAuth, async (req: AuthedRequest, res) => {
  res.json(await cartFor(req.user!.id));
});

accountRouter.post('/cart', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ variant_id: z.number().int(), qty: z.number().int().min(1).max(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const v = await sql`SELECT * FROM product_variants WHERE id = ${parsed.data.variant_id}`;
  if (!v[0]) return res.status(404).json({ error: 'variant_not_found' });
  if (v[0].stock < parsed.data.qty) return res.status(409).json({ error: 'insufficient_stock', stock: v[0].stock });
  await sql`INSERT INTO cart_items (user_id, variant_id, qty) VALUES (${req.user!.id}, ${parsed.data.variant_id}, ${parsed.data.qty})
    ON CONFLICT (user_id, variant_id) DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty`;
  res.status(201).json(await cartFor(req.user!.id));
});

accountRouter.put('/cart/:itemId', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ qty: z.number().int().min(1).max(10) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  await sql`UPDATE cart_items SET qty = ${parsed.data.qty} WHERE id = ${+req.params.itemId} AND user_id = ${req.user!.id}`;
  res.json(await cartFor(req.user!.id));
});

accountRouter.delete('/cart/:itemId', requireAuth, async (req: AuthedRequest, res) => {
  await sql`DELETE FROM cart_items WHERE id = ${+req.params.itemId} AND user_id = ${req.user!.id}`;
  res.json(await cartFor(req.user!.id));
});

accountRouter.post('/cart/merge', requireAuth, async (req: AuthedRequest, res) => {
  const schema = z.object({ items: z.array(z.object({ variant_id: z.number().int(), qty: z.number().int().min(1).max(10) })).max(50) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  for (const item of parsed.data.items) {
    const v = await sql`SELECT stock FROM product_variants WHERE id = ${item.variant_id}`;
    if (!v[0] || v[0].stock < 1) continue;
    await sql`INSERT INTO cart_items (user_id, variant_id, qty) VALUES (${req.user!.id}, ${item.variant_id}, ${Math.min(item.qty, v[0].stock as number)})
      ON CONFLICT (user_id, variant_id) DO UPDATE SET qty = LEAST(cart_items.qty + EXCLUDED.qty, 10)`;
  }
  res.json(await cartFor(req.user!.id));
});

// ---------- Wishlist ----------
accountRouter.get('/wishlist', requireAuth, async (req: AuthedRequest, res) => {
  const rows = await sql`
    SELECT p.id, p.slug, p.name_en, p.name_ar, p.base_price, p.sale_price, p.rating, p.rating_count,
           (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY sort LIMIT 1) AS image_url
    FROM wishlists w JOIN products p ON p.id = w.product_id WHERE w.user_id = ${req.user!.id} ORDER BY w.created_at DESC`;
  res.json({ items: rows.map((r) => ({ ...r, price: r.sale_price ?? r.base_price })) });
});

accountRouter.post('/wishlist/:productId', requireAuth, async (req: AuthedRequest, res) => {
  await sql`INSERT INTO wishlists (user_id, product_id) VALUES (${req.user!.id}, ${req.params.productId}) ON CONFLICT DO NOTHING`;
  res.json({ ok: true });
});

accountRouter.delete('/wishlist/:productId', requireAuth, async (req: AuthedRequest, res) => {
  await sql`DELETE FROM wishlists WHERE user_id = ${req.user!.id} AND product_id = ${req.params.productId}`;
  res.json({ ok: true });
});

// ---------- Addresses ----------
const addressSchema = z.object({
  label: z.string().max(40).optional().default('Home'),
  full_name: z.string().min(2).max(120),
  phone: z.string().min(6).max(30),
  governorate: z.string().min(2).max(60),
  city: z.string().min(2).max(80),
  area: z.string().max(120).optional().default(''),
  street: z.string().min(3).max(200),
  postal_code: z.string().max(12).optional().default(''),
  is_default: z.boolean().optional().default(false),
});

accountRouter.get('/addresses', requireAuth, async (req: AuthedRequest, res) => {
  const rows = await sql`SELECT * FROM addresses WHERE user_id = ${req.user!.id} ORDER BY is_default DESC, created_at DESC`;
  res.json({ addresses: rows });
});

accountRouter.post('/addresses', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = addressSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const d = parsed.data;
  if (d.is_default) await sql`UPDATE addresses SET is_default = false WHERE user_id = ${req.user!.id}`;
  const rows = await sql`INSERT INTO addresses (user_id, label, full_name, phone, governorate, city, area, street, postal_code, is_default)
    VALUES (${req.user!.id}, ${d.label}, ${d.full_name}, ${d.phone}, ${d.governorate}, ${d.city}, ${d.area}, ${d.street}, ${d.postal_code}, ${d.is_default}) RETURNING *`;
  res.status(201).json({ address: rows[0] });
});

accountRouter.put('/addresses/:id', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = addressSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });
  const d = parsed.data;
  if (d.is_default) await sql`UPDATE addresses SET is_default = false WHERE user_id = ${req.user!.id}`;
  const cur = await sql`SELECT * FROM addresses WHERE id = ${req.params.id} AND user_id = ${req.user!.id}`;
  if (!cur[0]) return res.status(404).json({ error: 'not_found' });
  const m = { ...cur[0], ...d };
  const rows = await sql`UPDATE addresses SET label=${m.label}, full_name=${m.full_name}, phone=${m.phone}, governorate=${m.governorate}, city=${m.city}, area=${m.area}, street=${m.street}, postal_code=${m.postal_code}, is_default=${m.is_default} WHERE id=${req.params.id} RETURNING *`;
  res.json({ address: rows[0] });
});

accountRouter.delete('/addresses/:id', requireAuth, async (req: AuthedRequest, res) => {
  await sql`DELETE FROM addresses WHERE id = ${req.params.id} AND user_id = ${req.user!.id}`;
  res.json({ ok: true });
});

// ---------- Orders ----------
const checkoutSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  governorate: z.string().min(2).max(60),
  city: z.string().min(2).max(80),
  area: z.string().max(120).optional().default(''),
  street: z.string().min(3).max(200),
  postal_code: z.string().max(12).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
  payment_method: z.enum(['cod', 'card']),
  coupon_code: z.string().max(40).optional(),
  save_address: z.boolean().optional().default(false),
  items: z.array(z.object({ variant_id: z.number().int(), qty: z.number().int().min(1).max(10) })).min(1).max(50),
});

accountRouter.post('/orders', optionalAuth, async (req: AuthedRequest, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input', details: parsed.error.issues });
  const d = parsed.data;

  if (d.payment_method === 'card') {
    // Card payments go through Paymob when credentials are configured. Without
    // them the method is unavailable rather than faked.
    if (!process.env.PAYMOB_API_KEY) {
      return res.status(400).json({ error: 'card_payments_not_configured' });
    }
    return res.status(501).json({ error: 'card_gateway_not_live' });
  }

  // Resolve + price every line from the database, never from client prices.
  const lines: any[] = [];
  for (const item of d.items) {
    const rows = await sql`
      SELECT v.id AS variant_id, v.size, v.stock, c.name_en AS color_en, c.name_ar AS color_ar,
             p.id AS product_id, p.name_en, p.name_ar, p.base_price, p.sale_price,
             (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY sort LIMIT 1) AS image_url
      FROM product_variants v JOIN product_colors c ON c.id = v.color_id JOIN products p ON p.id = v.product_id
      WHERE v.id = ${item.variant_id}`;
    if (!rows[0]) return res.status(400).json({ error: 'variant_not_found', variant_id: item.variant_id });
    const r = rows[0];
    if ((r.stock as number) < item.qty) return res.status(409).json({ error: 'insufficient_stock', name: r.name_en, size: r.size, stock: r.stock });
    lines.push({ ...r, qty: item.qty, unit_price: r.sale_price ?? r.base_price });
  }

  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.qty, 0);
  let discount = 0;
  let coupon: string | null = null;
  if (d.coupon_code) {
    const c = await sql`SELECT * FROM coupons WHERE code = upper(${d.coupon_code}) AND active = true AND (expires_at IS NULL OR expires_at > now())`;
    if (c[0] && subtotal >= (c[0].min_subtotal as number)) {
      discount = c[0].kind === 'percent' ? Math.round(subtotal * (c[0].value as number) / 100) : Math.min(c[0].value as number, subtotal);
      coupon = c[0].code;
    }
  }
  const gov = EGYPT_GOVERNORATES.find((g) => g.name.toLowerCase() === d.governorate.toLowerCase());
  const shipping = subtotal - discount >= 10000 ? 0 : (gov?.fee ?? 100);
  const total = subtotal - discount + shipping;
  const number = `SV-${orderNo()}`;

  const orderRows = await sql`
    INSERT INTO orders (order_number, user_id, full_name, email, phone, governorate, city, area, street, postal_code, notes,
      payment_method, payment_status, status, subtotal, discount, shipping_fee, total, coupon_code, status_history)
    VALUES (${number}, ${req.user?.id ?? null}, ${d.full_name}, ${d.email.toLowerCase()}, ${d.phone}, ${d.governorate}, ${d.city},
      ${d.area}, ${d.street}, ${d.postal_code}, ${d.notes}, 'cod', 'pending', 'placed',
      ${subtotal}, ${discount}, ${shipping}, ${total}, ${coupon},
      ${JSON.stringify([{ status: 'placed', at: new Date().toISOString() }])})
    RETURNING *`;
  const order = orderRows[0];

  for (const l of lines) {
    await sql`INSERT INTO order_items (order_id, product_id, name_en, name_ar, image_url, size, color_name_en, color_name_ar, qty, unit_price)
      VALUES (${order.id}, ${l.product_id}, ${l.name_en}, ${l.name_ar}, ${l.image_url ?? ''}, ${l.size}, ${l.color_en}, ${l.color_ar}, ${l.qty}, ${l.unit_price})`;
    await sql`UPDATE product_variants SET stock = stock - ${l.qty} WHERE id = ${l.variant_id}`;
  }

  if (req.user) {
    await sql`DELETE FROM cart_items WHERE user_id = ${req.user.id} AND variant_id = ANY(${d.items.map((i) => i.variant_id)})`;
    if (d.save_address) {
      await sql`INSERT INTO addresses (user_id, label, full_name, phone, governorate, city, area, street, postal_code)
        VALUES (${req.user.id}, 'Checkout', ${d.full_name}, ${d.phone}, ${d.governorate}, ${d.city}, ${d.area}, ${d.street}, ${d.postal_code})`;
    }
  }

  res.status(201).json({ order: { ...order, items: lines.map((l) => ({ name_en: l.name_en, name_ar: l.name_ar, size: l.size, qty: l.qty, unit_price: l.unit_price, image_url: l.image_url })) } });
});

accountRouter.get('/orders/mine', requireAuth, async (req: AuthedRequest, res) => {
  const rows = await sql`SELECT * FROM orders WHERE user_id = ${req.user!.id} ORDER BY created_at DESC LIMIT 50`;
  res.json({ orders: rows });
});

// Public tracking by order number + email.
accountRouter.get('/orders/track/:orderNumber', async (req, res) => {
  const email = (req.query.email as string || '').toLowerCase();
  if (!email) return res.status(400).json({ error: 'email_required' });
  const rows = await sql`SELECT * FROM orders WHERE order_number = upper(${req.params.orderNumber}) AND email = ${email}`;
  if (!rows[0]) return res.status(404).json({ error: 'order_not_found' });
  const items = await sql`SELECT * FROM order_items WHERE order_id = ${rows[0].id}`;
  const o = rows[0];
  res.json({ order: { order_number: o.order_number, status: o.status, payment_method: o.payment_method, payment_status: o.payment_status, total: o.total, shipping_fee: o.shipping_fee, discount: o.discount, subtotal: o.subtotal, created_at: o.created_at, status_history: o.status_history, governorate: o.governorate, city: o.city, items } });
});

accountRouter.get('/orders/:orderNumber', requireAuth, async (req: AuthedRequest, res) => {
  const rows = await sql`SELECT * FROM orders WHERE order_number = upper(${req.params.orderNumber}) AND (user_id = ${req.user!.id} OR ${req.user!.role === 'admin'})`;
  if (!rows[0]) return res.status(404).json({ error: 'order_not_found' });
  const items = await sql`SELECT * FROM order_items WHERE order_id = ${rows[0].id}`;
  res.json({ order: rows[0], items });
});
