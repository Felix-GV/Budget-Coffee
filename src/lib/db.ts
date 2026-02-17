import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'bargain.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Check if we need to migrate by looking at table structure
const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='products'").get();
const needsMigration = !tableExists || (() => {
  try {
    db.prepare("SELECT retailer FROM products LIMIT 1").get();
    return false;
  } catch {
    return true;
  }
})();

if (needsMigration) {
  // Drop old tables and recreate
  db.exec(`
    DROP TABLE IF EXISTS prices;
    DROP TABLE IF EXISTS alerts;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS scrape_log;
  `);
}

db.exec(`
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

  CREATE TABLE IF NOT EXISTS scrape_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    retailer TEXT NOT NULL,
    product_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'ok',
    error TEXT,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
  CREATE INDEX IF NOT EXISTS idx_products_retailer ON products(retailer);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
  CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(scraped_at);
  CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(active);
`);

export default db;

export function upsertProductPrice(product: {
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

  const upsertProduct = db.prepare(`
    INSERT INTO products (name, slug, brand, image_url, category, size, retailer, url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug, retailer) DO UPDATE SET
      name = excluded.name,
      brand = excluded.brand,
      image_url = excluded.image_url,
      category = excluded.category,
      size = excluded.size,
      url = excluded.url
  `);

  upsertProduct.run(
    product.name, product.slug, product.brand, product.imageUrl,
    product.category, product.size, product.retailer, product.url
  );

  const row = db.prepare('SELECT id FROM products WHERE slug = ? AND retailer = ?')
    .get(product.slug, product.retailer) as { id: number };

  const upsertPrice = db.prepare(`
    INSERT INTO prices (product_id, price, was_price, cup_price_value, cup_price_label, is_on_special, savings_amount, scraped_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(product_id, scraped_at) DO UPDATE SET
      price = excluded.price,
      was_price = excluded.was_price,
      cup_price_value = excluded.cup_price_value,
      cup_price_label = excluded.cup_price_label,
      is_on_special = excluded.is_on_special,
      savings_amount = excluded.savings_amount
  `);

  upsertPrice.run(
    row.id, product.price, product.wasPrice, product.cupPriceValue,
    product.cupPriceLabel, product.isOnSpecial ? 1 : 0, product.savingsAmount, today
  );

  return row.id;
}

export function logScrape(retailer: string, productCount: number, status: string, error?: string) {
  db.prepare('INSERT INTO scrape_log (retailer, product_count, status, error) VALUES (?, ?, ?, ?)')
    .run(retailer, productCount, status, error || null);
}
