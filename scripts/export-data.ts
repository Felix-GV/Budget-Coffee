/**
 * Scrape all coffee products and export to src/data/products.json
 * Commit the JSON to deploy fresh data to Netlify.
 * 
 * Run: npm run export-data
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { browseCoffeeCategory } from '../src/lib/scrapers/woolworths';
import { searchAmazon } from '../src/lib/scrapers/amazon';
import { slugify } from '../src/lib/slugify';

const CATEGORIES = ['beans', 'ground', 'instant', 'pods', 'sachets', 'coldbrew'];
const AMAZON_TERMS: Record<string, string> = {
  beans: 'coffee beans',
  ground: 'ground coffee',
  instant: 'instant coffee',
  pods: 'coffee capsules pods',
  sachets: 'coffee sachets',
  coldbrew: 'cold brew coffee',
};

async function main() {
  console.log('☕ Scraping coffee data for export...\n');

  const seen = new Set<string>();
  const allProducts: object[] = [];

  for (const category of CATEGORIES) {
    console.log(`🔄 ${category}...`);

    const [woolies, amazon] = await Promise.allSettled([
      browseCoffeeCategory(category),
      searchAmazon(AMAZON_TERMS[category]),
    ]);

    const products = [
      ...(woolies.status === 'fulfilled' ? woolies.value : []),
      ...(amazon.status === 'fulfilled' ? amazon.value : []),
    ];

    for (const p of products) {
      const slug = slugify(p.name, p.retailer);
      if (seen.has(slug)) continue;
      seen.add(slug);
      allProducts.push({ ...p, slug });
    }

    console.log(`  ✅ ${products.length} products`);

    // Polite delay between categories
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n📦 Total: ${allProducts.length} products`);

  // Write to both src/data (for server import) and public/data (for client fetch)
  const outDir = join(process.cwd(), 'src', 'data');
  const pubDir = join(process.cwd(), 'public', 'data');
  mkdirSync(outDir, { recursive: true });
  mkdirSync(pubDir, { recursive: true });
  const outPath = join(outDir, 'products.json');
  writeFileSync(join(pubDir, 'products.json'), JSON.stringify({
    scrapedAt: new Date().toISOString(),
    count: allProducts.length,
    products: allProducts,
  }, null, 2));

  writeFileSync(outPath, JSON.stringify({
    scrapedAt: new Date().toISOString(),
    count: allProducts.length,
    products: allProducts,
  }, null, 2));

  console.log(`\n✅ Saved to src/data/products.json`);
  console.log(`📤 Now run: git add -A && git commit -m "data: refresh coffee prices" && git push`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
