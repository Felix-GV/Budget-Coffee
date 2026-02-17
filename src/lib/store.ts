import db, { upsertProductPrice } from './db';
import { slugify } from './slugify';
import type { CoffeeProduct } from './scrapers/woolworths';

/** Persist an array of scraped coffee products into SQLite, return them with slugs */
export function persistProducts(products: CoffeeProduct[]): (CoffeeProduct & { slug: string })[] {
  return products.map((p) => {
    const slug = slugify(p.name, p.retailer);
    upsertProductPrice({
      name: p.name,
      slug,
      brand: p.brand,
      imageUrl: p.image,
      category: p.category,
      size: p.size,
      retailer: p.retailer,
      url: p.url,
      price: p.price,
      wasPrice: p.wasPrice,
      cupPriceValue: p.cupPriceValue,
      cupPriceLabel: p.cupPrice,
      isOnSpecial: p.isOnSpecial,
      savingsAmount: p.savingsAmount,
    });
    return { ...p, slug };
  });
}

interface PriceRow {
  price: number;
  was_price: number | null;
  cup_price_value: number;
  cup_price_label: string;
  is_on_special: number;
  savings_amount: number;
  scraped_at: string;
}

interface ProductRow {
  id: number;
  name: string;
  slug: string;
  brand: string;
  image_url: string;
  category: string;
  size: string;
  retailer: string;
  url: string;
}

export function getProductBySlug(slug: string) {
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug) as ProductRow | undefined;
  if (!product) return null;

  const prices = db.prepare(
    'SELECT * FROM prices WHERE product_id = ? ORDER BY scraped_at ASC'
  ).all(product.id) as PriceRow[];

  const latest = prices[prices.length - 1];

  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    image: product.image_url,
    category: product.category,
    size: product.size,
    retailer: product.retailer,
    url: product.url,
    price: latest?.price ?? 0,
    wasPrice: latest?.was_price ?? null,
    cupPrice: latest?.cup_price_label ?? '',
    cupPriceValue: latest?.cup_price_value ?? 0,
    isOnSpecial: latest?.is_on_special === 1,
    savingsAmount: latest?.savings_amount ?? 0,
    priceHistory: prices.map((p) => ({
      date: p.scraped_at,
      price: p.price,
      wasPrice: p.was_price,
      isOnSpecial: p.is_on_special === 1,
    })),
  };
}

/** Find all products matching name, grouped across retailers, with price history */
export function getProductWithAlternatives(slug: string) {
  const product = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug) as ProductRow | undefined;
  if (!product) return null;

  // Find the single cheapest product per other retailer (same category)
  const alternatives = db.prepare(`
    SELECT p.* FROM products p
    INNER JOIN prices pr ON pr.product_id = p.id AND pr.scraped_at = (
      SELECT MAX(scraped_at) FROM prices WHERE product_id = p.id
    )
    WHERE p.category = ? AND p.retailer != ?
    ORDER BY pr.price ASC
  `).all(product.category, product.retailer) as ProductRow[];

  // Dedupe: keep only the cheapest product per retailer
  const retailerMap = new Map<string, { product: ProductRow; price: number }>();
  
  for (const p of [product, ...alternatives]) {
    const latestPrice = db.prepare(
      'SELECT price FROM prices WHERE product_id = ? ORDER BY scraped_at DESC LIMIT 1'
    ).get(p.id) as { price: number } | undefined;
    const price = latestPrice?.price ?? 999999;
    
    const existing = retailerMap.get(p.retailer);
    if (!existing || price < existing.price) {
      retailerMap.set(p.retailer, { product: p, price });
    }
  }

  return {
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    image: product.image_url,
    category: product.category,
    size: product.size,
    prices: Array.from(retailerMap.values()).map(({ product: p }) => {
      const prices = db.prepare(
        'SELECT * FROM prices WHERE product_id = ? ORDER BY scraped_at ASC'
      ).all(p.id) as PriceRow[];
      const latest = prices[prices.length - 1];
      return {
        retailer: p.retailer,
        price: latest?.price ?? 0,
        url: p.url,
        slug: p.slug,
        size: p.size,
        history: prices.map((pr) => ({
          date: pr.scraped_at,
          price: pr.price,
        })),
      };
    }),
  };
}
