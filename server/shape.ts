// Shared product row shaping: attaches images, colors, variants, category.
import { sql } from './db.js';

export async function shapeProducts(rows: any[]) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const images = await sql`SELECT product_id, url, sort FROM product_images WHERE product_id = ANY(${ids}) ORDER BY sort`;
  const colors = await sql`SELECT id, product_id, name_en, name_ar, hex FROM product_colors WHERE product_id = ANY(${ids})`;
  const variants = await sql`SELECT id, product_id, color_id, size, stock FROM product_variants WHERE product_id = ANY(${ids})`;
  return rows.map((p) => ({
    ...p,
    price: p.sale_price ?? p.base_price,
    on_sale: p.sale_price != null && p.sale_price < p.base_price,
    images: images.filter((i) => i.product_id === p.id).map((i) => i.url),
    colors: colors.filter((c) => c.product_id === p.id),
    variants: variants.filter((v) => v.product_id === p.id),
    total_stock: variants.filter((v) => v.product_id === p.id).reduce((s, v) => s + v.stock, 0),
  }));
}

export const PRODUCT_SELECT = `
  SELECT p.id, p.slug, p.name_en, p.name_ar, p.description_en, p.description_ar,
         p.gender, p.base_price, p.sale_price, p.material_en, p.material_ar,
         p.is_new, p.is_best_seller, p.is_signature, p.rating, p.rating_count,
         p.created_at, c.slug AS category_slug, c.name_en AS category_en, c.name_ar AS category_ar
  FROM products p JOIN categories c ON c.id = p.category_id`;

export function productQuery(tail = '', params: unknown[] = []) {
  return sql.query(`${PRODUCT_SELECT} ${tail}`, params as any[]);
}
