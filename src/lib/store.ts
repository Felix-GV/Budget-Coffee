import db, { upsertProductPrice } from './db';
import { slugify } from './slugify';
import type { CoffeeProduct } from './scrapers/woolworths';

export async function persistProducts(products: CoffeeProduct[]): Promise<(CoffeeProduct & { slug: string })[]> {
  const results: (CoffeeProduct & { slug: string })[] = [];
  for (const p of products) {
    const slug = slugify(p.name, p.retailer);
    try {
      await upsertProductPrice({
        name: p.name, slug, brand: p.brand, imageUrl: p.image,
        category: p.category, size: p.size, retailer: p.retailer, url: p.url,
        price: p.price, wasPrice: p.wasPrice, cupPriceValue: p.cupPriceValue,
        cupPriceLabel: p.cupPrice, isOnSpecial: p.isOnSpecial, savingsAmount: p.savingsAmount,
      });
    } catch { /* ignore individual failures */ }
    results.push({ ...p, slug });
  }
  return results;
}

export async function getProductWithAlternatives(slug: string) {
  const productRes = await db.execute({
    sql: 'SELECT * FROM products WHERE slug = ?',
    args: [slug],
  });
  if (!productRes.rows.length) return null;
  const product = productRes.rows[0];

  // Get prices + history for the main product
  const pricesRes = await db.execute({
    sql: 'SELECT * FROM prices WHERE product_id = ? ORDER BY scraped_at ASC',
    args: [product.id as number],
  });

  const latest = pricesRes.rows[pricesRes.rows.length - 1];

  // Find cheapest product per other retailer in same category
  const othersRes = await db.execute({
    sql: `SELECT p.*, pr.price as latest_price, p.url as product_url
          FROM products p
          INNER JOIN prices pr ON pr.product_id = p.id AND pr.scraped_at = (
            SELECT MAX(scraped_at) FROM prices WHERE product_id = p.id
          )
          WHERE p.category = ? AND p.retailer != ?
          ORDER BY pr.price ASC`,
    args: [product.category as string, product.retailer as string],
  });

  // Dedupe by retailer (cheapest)
  const retailerMap = new Map<string, typeof othersRes.rows[0]>();
  for (const row of othersRes.rows) {
    if (!retailerMap.has(row.retailer as string)) {
      retailerMap.set(row.retailer as string, row);
    }
  }

  return {
    name: product.name as string,
    slug: product.slug as string,
    brand: product.brand as string,
    image: product.image_url as string,
    category: product.category as string,
    size: product.size as string,
    prices: [
      {
        retailer: product.retailer as string,
        price: latest?.price as number ?? 0,
        url: product.url as string,
        slug: product.slug as string,
        size: product.size as string,
        history: pricesRes.rows.map(r => ({
          date: r.scraped_at as string,
          price: r.price as number,
        })),
      },
      ...Array.from(retailerMap.values()).map(r => ({
        retailer: r.retailer as string,
        price: r.latest_price as number,
        url: r.product_url as string,
        slug: r.slug as string,
        size: r.size as string,
        history: [],
      })),
    ].sort((a, b) => a.price - b.price),
  };
}
