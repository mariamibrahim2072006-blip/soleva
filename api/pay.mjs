// Stripe Checkout (TEST mode) for SOLEVA. Prices are always read from the database.
import { neon } from '@neondatabase/serverless';

const GOVS = [
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
const ORIGINS = ['https://soleva-cyan-phi.vercel.app', 'https://soleva-eg.surge.sh', 'http://localhost:5173'];
const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const orderNo = () => Array.from({ length: 8 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');

async function stripe(path, body) {
  const r = await fetch('https://api.stripe.com' + path, {
    method: body ? 'POST' : 'GET',
    headers: { authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY, ...(body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
    body,
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j && j.error && j.error.message) || 'stripe_error');
  return j;
}

export default async function handler(req, res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'content-type,authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ error: 'card_payments_not_configured' });
  const sql = neon(process.env.DATABASE_URL);
  const url = new URL(req.url, 'http://x');

  if (req.method === 'GET' && url.pathname.endsWith('/confirm')) {
    const sid = url.searchParams.get('session_id') || '';
    if (!sid.startsWith('cs_')) return res.status(400).json({ error: 'invalid_session' });
    try {
      const sess = await stripe('/v1/checkout/sessions/' + encodeURIComponent(sid));
      const number = sess.client_reference_id;
      if (sess.payment_status === 'paid' && number) {
        await sql`UPDATE orders SET payment_status = 'paid' WHERE order_number = ${number} AND payment_method = 'card'`;
      }
      const rows = await sql`SELECT order_number, total, payment_status FROM orders WHERE order_number = ${number}`;
      if (!rows[0]) return res.status(404).json({ error: 'not_found' });
      return res.json({ order: rows[0], paid: sess.payment_status === 'paid' });
    } catch (e) { return res.status(404).json({ error: 'session_not_found' }); }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const d = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const need = ['full_name', 'email', 'phone', 'governorate', 'city', 'street'];
  if (need.some((k) => !d[k] || String(d[k]).length < 2) || !/^[^@\s]+@[^@\s]+$/.test(d.email) || !Array.isArray(d.items) || !d.items.length || d.items.length > 50) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  let userId = null;
  try {
    const tok = (req.headers.authorization || '').replace('Bearer ', '');
    if (tok) {
      const jwt = (await import('jsonwebtoken')).default;
      const p = jwt.verify(tok, process.env.JWT_SECRET || 'soleva-dev-secret-change-me');
      userId = p.id || p.sub || null;
    }
  } catch {}

  const lines = [];
  for (const it of d.items) {
    const qty = Math.min(10, Math.max(1, parseInt(it.qty, 10) || 1));
    const vid = parseInt(it.variant_id, 10);
    const rows = await sql`
      SELECT v.id AS variant_id, v.size, v.stock, c.name_en AS color_en, c.name_ar AS color_ar,
             p.id AS product_id, p.name_en, p.name_ar, p.base_price, p.sale_price,
             (SELECT url FROM product_images i WHERE i.product_id = p.id ORDER BY sort LIMIT 1) AS image_url
      FROM product_variants v JOIN product_colors c ON c.id = v.color_id JOIN products p ON p.id = v.product_id
      WHERE v.id = ${vid}`;
    if (!rows[0]) return res.status(400).json({ error: 'variant_not_found' });
    if (rows[0].stock < qty) return res.status(409).json({ error: 'insufficient_stock', name: rows[0].name_en, size: rows[0].size, stock: rows[0].stock });
    lines.push({ ...rows[0], qty, unit_price: rows[0].sale_price ?? rows[0].base_price });
  }
  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.qty, 0);
  let discount = 0, coupon = null;
  if (d.coupon_code) {
    const c = await sql`SELECT * FROM coupons WHERE code = upper(${d.coupon_code}) AND active = true AND (expires_at IS NULL OR expires_at > now())`;
    if (c[0] && subtotal >= c[0].min_subtotal) {
      discount = c[0].kind === 'percent' ? Math.round(subtotal * c[0].value / 100) : Math.min(c[0].value, subtotal);
      coupon = c[0].code;
    }
  }
  const gov = GOVS.find((g) => g.name.toLowerCase() === String(d.governorate).toLowerCase());
  const shipping = subtotal - discount >= 10000 ? 0 : (gov ? gov.fee : 100);
  const total = subtotal - discount + shipping;
  const number = 'SV-' + orderNo();

  const orderRows = await sql`
    INSERT INTO orders (order_number, user_id, full_name, email, phone, governorate, city, area, street, postal_code, notes,
      payment_method, payment_status, status, subtotal, discount, shipping_fee, total, coupon_code, status_history)
    VALUES (${number}, ${userId}, ${d.full_name}, ${String(d.email).toLowerCase()}, ${d.phone}, ${d.governorate}, ${d.city},
      ${d.area || ''}, ${d.street}, ${d.postal_code || ''}, ${d.notes || ''}, 'card', 'pending', 'placed',
      ${subtotal}, ${discount}, ${shipping}, ${total}, ${coupon},
      ${JSON.stringify([{ status: 'placed', at: new Date().toISOString() }])})
    RETURNING id`;
  const orderId = orderRows[0].id;
  for (const l of lines) {
    await sql`INSERT INTO order_items (order_id, product_id, name_en, name_ar, image_url, size, color_name_en, color_name_ar, qty, unit_price)
      VALUES (${orderId}, ${l.product_id}, ${l.name_en}, ${l.name_ar}, ${l.image_url ?? ''}, ${l.size}, ${l.color_en}, ${l.color_ar}, ${l.qty}, ${l.unit_price})`;
    await sql`UPDATE product_variants SET stock = stock - ${l.qty} WHERE id = ${l.variant_id}`;
  }

  const origin = ORIGINS.includes(d.return_origin) ? d.return_origin : ORIGINS[0];
  const f = new URLSearchParams();
  f.set('mode', 'payment');
  f.set('client_reference_id', number);
  f.set('customer_email', String(d.email).toLowerCase());
  f.set('success_url', origin + '/checkout/success?order=' + number + '&session_id={CHECKOUT_SESSION_ID}');
  f.set('cancel_url', origin + '/checkout?cancelled=1');
  f.set('metadata[order_number]', number);
  let i = 0;
  const addLine = (name, amount, qty) => {
    f.set(`line_items[${i}][quantity]`, String(qty));
    f.set(`line_items[${i}][price_data][currency]`, 'egp');
    f.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(amount * 100)));
    f.set(`line_items[${i}][price_data][product_data][name]`, name);
    i++;
  };
  for (const l of lines) addLine(`${l.name_en} (EU ${l.size})`, l.unit_price, l.qty);
  if (shipping > 0) addLine('Shipping', shipping, 1);
  try {
    if (discount > 0) {
      const cr = await stripe('/v1/coupons', new URLSearchParams({ amount_off: String(Math.round(discount * 100)), currency: 'egp', duration: 'once', name: 'Discount ' + (coupon || '') }));
      f.set('discounts[0][coupon]', cr.id);
    }
    const session = await stripe('/v1/checkout/sessions', f);
    return res.status(201).json({ checkout_url: session.url, order_number: number });
  } catch (e) {
    await sql`UPDATE orders SET payment_status = 'failed' WHERE id = ${orderId}`;
    return res.status(502).json({ error: 'card_session_failed' });
  }
}
