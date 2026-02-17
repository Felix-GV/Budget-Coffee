/**
 * Scrapes all coffee products and stores to Turso DB.
 * Run by GitHub Actions every 6 hours.
 * Can also run locally: TURSO_DB_URL=... TURSO_DB_TOKEN=... npx tsx scripts/scrape-turso.ts
 */

import { initDb, upsertProductPrice } from '../src/lib/db';
import { browseCoffeeCategory } from '../src/lib/scrapers/woolworths';
import { searchAmazon } from '../src/lib/scrapers/amazon';
import { slugify } from '../src/lib/slugify';

const CATEGORIES = ['beans', 'ground', 'instant', 'pods', 'sachets', 'coldbrew'];
const AMAZON_TERMS: Record<string, string> = {
  beans: 'coffee beans', ground: 'ground coffee', instant: 'instant coffee',
  pods: 'coffee capsules pods', sachets: 'coffee sachets', coldbrew: 'cold brew coffee',
};

async function main() {
  console.log('☕ Coffee Price Scrape →', new Date().toISOString());
  console.log('📡 DB:', process.env.TURSO_DB_URL);

  await initDb();
  console.log('✅ DB initialised\n');

  let total = 0;

  for (const category of CATEGORIES) {
    console.log(`🔄 ${category}...`);
    try {
      const [woolies, amazon] = await Promise.allSettled([
        browseCoffeeCategory(category),
        searchAmazon(AMAZON_TERMS[category]),
      ]);

      const products = [
        ...(woolies.status === 'fulfilled' ? woolies.value : []),
        ...(amazon.status === 'fulfilled' ? amazon.value : []),
      ];

      const seen = new Set<string>();
      for (const p of products) {
        const slug = slugify(p.name, p.retailer);
        if (seen.has(slug)) continue;
        seen.add(slug);
        try {
          await upsertProductPrice({
            name: p.name, slug, brand: p.brand, imageUrl: p.image,
            category: p.category, size: p.size, retailer: p.retailer, url: p.url,
            price: p.price, wasPrice: p.wasPrice, cupPriceValue: p.cupPriceValue,
            cupPriceLabel: p.cupPrice, isOnSpecial: p.isOnSpecial, savingsAmount: p.savingsAmount,
          });
          total++;
        } catch (e) {
          // ignore individual failures
        }
      }
      console.log(`  ✅ ${products.length} products`);
    } catch (e) {
      console.error(`  ❌ ${(e as Error).message}`);
    }

    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n📦 Total stored: ${total}`);
  console.log('✅ Done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
