import { createClient } from '@libsql/client';

const db = createClient({
  url: (process.env.TURSO_DB_URL || 'file:local.db').trim(),
  authToken: process.env.TURSO_DB_TOKEN?.trim(),
});

export default db;

export async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      brand TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      category TEXT DEFAULT '',
      size TEXT DEFAULT '',
      retailer TEXT NOT NULL,
      url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(slug, retailer)
    );

    CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      price REAL NOT NULL,
      was_price REAL,
      cup_price_value REAL DEFAULT 0,
      cup_price_label TEXT DEFAULT '',
      is_on_special INTEGER DEFAULT 0,
      savings_amount REAL DEFAULT 0,
      scraped_at DATE NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      UNIQUE(product_id, scraped_at)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      phone TEXT NOT NULL,
      target_price REAL NOT NULL,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
    CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(scraped_at);
  `);
}

export async function upsertProductPrice(product: {
  name: string;
  slug: string;
  brand: string;
  imageUrl: string;
  category: string;
  size: string;
  retailer: string;
  url: string;
  price: number;
  wasPrice: number | null;
  cupPriceValue: number;
  cupPriceLabel: string;
  isOnSpecial: boolean;
  savingsAmount: number;
}) {
  const today = new Date().toISOString().split('T')[0];

  await db.execute({
    sql: `INSERT INTO products (name, slug, brand, image_url, category, size, retailer, url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(slug, retailer) DO UPDATE SET
            name = excluded.name, brand = excluded.brand,
            image_url = excluded.image_url, category = excluded.category,
            size = excluded.size, url = excluded.url`,
    args: [product.name, product.slug, product.brand, product.imageUrl,
           product.category, product.size, product.retailer, product.url],
  });

  const row = await db.execute({
    sql: 'SELECT id FROM products WHERE slug = ? AND retailer = ?',
    args: [product.slug, product.retailer],
  });

  const productId = row.rows[0].id as number;

  await db.execute({
    sql: `INSERT INTO prices (product_id, price, was_price, cup_price_value, cup_price_label, is_on_special, savings_amount, scraped_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(product_id, scraped_at) DO UPDATE SET
            price = excluded.price, was_price = excluded.was_price,
            cup_price_value = excluded.cup_price_value, cup_price_label = excluded.cup_price_label,
            is_on_special = excluded.is_on_special, savings_amount = excluded.savings_amount`,
    args: [productId, product.price, product.wasPrice, product.cupPriceValue,
           product.cupPriceLabel, product.isOnSpecial ? 1 : 0, product.savingsAmount, today],
  });

  return productId;
}
