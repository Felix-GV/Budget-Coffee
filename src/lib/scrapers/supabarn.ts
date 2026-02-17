import { chromium, type Browser } from 'playwright';
import type { CoffeeProduct } from './woolworths';

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({ headless: true });
  }
  return browserInstance;
}

function categoriseCoffee(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('bean')) return 'Beans';
  if (lower.includes('ground') || lower.includes('grind')) return 'Ground';
  if (lower.includes('instant') || lower.includes('soluble')) return 'Instant';
  if (lower.includes('capsule') || lower.includes('pod') || lower.includes('nespresso')) return 'Pods & Capsules';
  if (lower.includes('sachet') || lower.includes('stick')) return 'Sachets';
  if (lower.includes('cold brew') || lower.includes('iced')) return 'Cold Brew';
  return 'Other';
}

export async function searchSupabarn(query: string): Promise<CoffeeProduct[]> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(`https://supabarncrace.myfoodlink.com/search?q=${encodeURIComponent(query)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
    await page.waitForTimeout(6000);

    const text = await page.evaluate(() => document.body.innerText);
    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);

    const products: CoffeeProduct[] = [];

    // Pattern: [SAVE\n$X.XX\n]? ProductName Size\n[$XX.XX each | was $XX.XX\n$XX.XX each]\n[$X.XX per 100g]\nAdd+
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect product name: contains size like "1kg", "500g", "250g" etc.
      const nameMatch = line.match(/^(.+?)\s+(\d+(?:\.\d+)?\s*(?:kg|g|ml|l|pk|pack|capsules|pods))\s*$/i);
      if (!nameMatch) continue;

      const name = line;
      const size = nameMatch[2];

      // Look ahead for price
      let price = 0;
      let wasPrice: number | null = null;
      let cupPrice = '';
      let cupPriceValue = 0;
      let savingsAmount = 0;

      for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
        const next = lines[j];

        // "$XX.XX each" pattern
        const eachMatch = next.match(/^\$([\d.]+)\s*each$/);
        if (eachMatch) {
          price = parseFloat(eachMatch[1]);
        }

        // "was $XX.XX" pattern
        const wasMatch = next.match(/^was\s*\$([\d.]+)$/);
        if (wasMatch) {
          wasPrice = parseFloat(wasMatch[1]);
        }

        // "$X.XX per 100g" or "per kg" pattern
        const cupMatch = next.match(/^\$([\d.]+)\s*per\s+(.+)$/);
        if (cupMatch) {
          cupPriceValue = parseFloat(cupMatch[1]);
          cupPrice = `$${cupMatch[1]} / ${cupMatch[2]}`;
        }

        if (next === 'Add+') break;
      }

      // Check for SAVE amount before the product name
      if (i >= 2 && lines[i - 2] === 'SAVE') {
        const saveMatch = lines[i - 1].match(/^\$([\d.]+)$/);
        if (saveMatch) savingsAmount = parseFloat(saveMatch[1]);
      }

      if (price <= 0) continue;

      // Filter out non-coffee
      const lower = name.toLowerCase();
      const excludePatterns = ['machine', 'maker', 'frother', 'grinder', 'kettle', 'mug', 'cup ', 'tumbler'];
      if (excludePatterns.some(pat => lower.includes(pat))) continue;

      // Extract brand (first word or two)
      const brandMatch = name.match(/^([A-Z][a-zA-Z']+(?:\s[A-Z][a-zA-Z']+)?)/);
      const brand = brandMatch ? brandMatch[1] : '';

      if (wasPrice && wasPrice > price) {
        savingsAmount = Math.round((wasPrice - price) * 100) / 100;
      }

      products.push({
        id: `supabarn-${products.length}`,
        name,
        brand,
        price,
        wasPrice: wasPrice && wasPrice > price ? wasPrice : null,
        savingsAmount,
        isOnSpecial: savingsAmount > 0,
        cupPrice,
        cupPriceValue,
        size,
        image: '',
        url: `https://supabarncrace.myfoodlink.com/search?q=${encodeURIComponent(query)}`,
        retailer: 'Supabarn',
        category: categoriseCoffee(name),
      });
    }

    return products;
  } finally {
    await page.close();
  }
}
