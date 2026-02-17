/**
 * Daily coffee price scraper
 * Run with: npx tsx scripts/scrape-daily.ts
 * 
 * Scrapes all coffee products from:
 * - Woolworths (API)
 * - Amazon AU (HTML)
 * - Supabarn (Playwright)
 * 
 * Stores results in SQLite for the app to serve.
 */

import { upsertProductPrice, logScrape } from '../src/lib/db';
import { searchWoolworths } from '../src/lib/scrapers/woolworths';
import { searchAmazon } from '../src/lib/scrapers/amazon';
import { searchSupabarn } from '../src/lib/scrapers/supabarn';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const SEARCH_TERMS = [
  'coffee beans',
  'ground coffee',
  'instant coffee',
  'coffee capsules',
  'nespresso coffee',
  'coffee pods',
  'cold brew coffee',
  'coffee sachets',
];

async function scrapeRetailer(
  name: string,
  searchFn: (query: string) => Promise<Array<{
    name: string; brand: string; price: number; wasPrice: number | null;
    savingsAmount: number; isOnSpecial: boolean; cupPrice: string;
    cupPriceValue: number; size: string; image: string; url: string;
    retailer: string; category: string;
  }>>,
) {
  console.log(`\n🔄 Scraping ${name}...`);
  const allProducts = new Map<string, typeof products[0]>();
  let products: Awaited<ReturnType<typeof searchFn>> = [];

  for (const term of SEARCH_TERMS) {
    try {
      const results = await searchFn(term);
      for (const p of results) {
        const key = `${slugify(p.name)}-${p.retailer}`;
        if (!allProducts.has(key)) {
          allProducts.set(key, p);
        }
      }
      console.log(`  "${term}" → ${results.length} products`);
    } catch (err) {
      console.error(`  "${term}" failed:`, (err as Error).message?.substring(0, 80));
    }

    // Small delay between searches
    await new Promise(r => setTimeout(r, 1000));
  }

  products = Array.from(allProducts.values());
  console.log(`  Total unique: ${products.length}`);

  // Store in DB
  let stored = 0;
  for (const p of products) {
    try {
      upsertProductPrice({
        name: p.name,
        slug: slugify(p.name),
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
      stored++;
    } catch (err) {
      // Ignore individual insert errors
    }
  }

  console.log(`  ✅ Stored ${stored} products`);
  logScrape(name, stored, 'ok');
  return stored;
}

async function main() {
  console.log('☕ Daily Coffee Price Scrape');
  console.log(`📅 ${new Date().toISOString()}\n`);

  const results: Record<string, number> = {};

  // Woolworths (fast, API-based)
  try {
    results['Woolworths'] = await scrapeRetailer('Woolworths', searchWoolworths);
  } catch (err) {
    console.error('Woolworths scrape failed:', (err as Error).message);
    logScrape('Woolworths', 0, 'error', (err as Error).message);
  }

  // Amazon AU (HTML scraping)
  try {
    results['Amazon AU'] = await scrapeRetailer('Amazon AU', searchAmazon);
  } catch (err) {
    console.error('Amazon scrape failed:', (err as Error).message);
    logScrape('Amazon AU', 0, 'error', (err as Error).message);
  }

  // Supabarn (Playwright - slower)
  try {
    results['Supabarn'] = await scrapeRetailer('Supabarn', searchSupabarn);
  } catch (err) {
    console.error('Supabarn scrape failed:', (err as Error).message);
    logScrape('Supabarn', 0, 'error', (err as Error).message);
  }

  console.log('\n📊 Summary:');
  let total = 0;
  for (const [retailer, count] of Object.entries(results)) {
    console.log(`  ${retailer}: ${count} products`);
    total += count;
  }
  console.log(`  Total: ${total} products\n`);
  console.log('✅ Done!');

  // Exit (Playwright browser might keep process alive)
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
