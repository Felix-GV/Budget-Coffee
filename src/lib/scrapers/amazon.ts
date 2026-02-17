import axios from 'axios';
import * as cheerio from 'cheerio';
import type { CoffeeProduct } from './woolworths';

function categoriseCoffee(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('bean')) return 'Beans';
  if (lower.includes('ground') || lower.includes('grind')) return 'Ground';
  if (lower.includes('instant') || lower.includes('soluble')) return 'Instant';
  if (lower.includes('capsule') || lower.includes('pod') || lower.includes('nespresso') || lower.includes('dolce gusto')) return 'Pods & Capsules';
  if (lower.includes('sachet') || lower.includes('stick') || lower.includes('mix')) return 'Sachets';
  if (lower.includes('cold brew') || lower.includes('iced')) return 'Cold Brew';
  return 'Other';
}

export async function searchAmazon(query: string): Promise<CoffeeProduct[]> {
  const searchTerm = query.toLowerCase().includes('coffee') ? query : `${query} coffee`;
  
  const { data } = await axios.get(`https://www.amazon.com.au/s`, {
    params: {
      k: searchTerm,
      i: 'grocery',
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-AU,en;q=0.9',
      'Accept': 'text/html',
    },
    timeout: 10000,
  });

  const $ = cheerio.load(data);
  const products: CoffeeProduct[] = [];

  $('[data-component-type="s-search-result"]').each(function () {
    const card = $(this);
    const title = card.find('h2 span').text().trim();
    const priceWhole = card.find('.a-price-whole').first().text().trim().replace(',', '');
    const priceFrac = card.find('.a-price-fraction').first().text().trim();
    const image = card.find('img.s-image').attr('src') || '';
    // Try multiple selectors for the product link
    const link = card.find('h2 a').attr('href')
      || card.find('a.a-link-normal[href*="/dp/"]').first().attr('href')
      || card.find('a[href*="/dp/"]').first().attr('href')
      || '';

    // Use ASIN to build canonical URL if possible
    const asin = card.attr('data-asin') || '';

    if (!title || !priceWhole) return;

    const price = parseFloat(`${priceWhole}.${priceFrac || '00'}`);
    if (isNaN(price) || price <= 0) return;

    // Filter out non-coffee items (machines, accessories)
    const lower = title.toLowerCase();
    const excludePatterns = ['machine', 'maker', 'frother', 'grinder', 'kettle', 'mug', 'tumbler', 'descaler', 'filter paper', 'tamper'];
    if (excludePatterns.some(pat => lower.includes(pat))) return;

    // Filter out individual/single capsules (not packs)
    const category = categoriseCoffee(title);
    if (category === 'Pods & Capsules') {
      const packMatch = lower.match(/(\d+)\s*(?:pack|capsule|pod|ct|count|serve)/);
      const singleIndicators = ['single capsule', 'single pod', '1 capsule', '1 pod', 'sample'];
      if (singleIndicators.some(s => lower.includes(s))) return;
      if (packMatch && parseInt(packMatch[1]) <= 2) return;
    }

    // Try to extract size and calculate cup price
    const sizeMatch = title.match(/(\d+(?:\.\d+)?)\s*(kg|g|ml|l|pack|pods|capsules|ct)\b/i);
    let size = '';
    let cupPriceValue = 0;
    let cupPrice = '';

    if (sizeMatch) {
      const amount = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toLowerCase();
      size = `${sizeMatch[1]}${sizeMatch[2]}`;

      if (unit === 'kg') {
        cupPriceValue = Math.round((price / (amount * 10)) * 100) / 100;
        cupPrice = `$${cupPriceValue.toFixed(2)} / 100g`;
      } else if (unit === 'g') {
        cupPriceValue = Math.round((price / amount * 100) * 100) / 100;
        cupPrice = `$${cupPriceValue.toFixed(2)} / 100g`;
      }
    }

    // Check for original/list price
    const listPriceEl = card.find('.a-price.a-text-price span.a-offscreen').first();
    const listPriceText = listPriceEl.text().trim();
    const wasPrice = listPriceText ? parseFloat(listPriceText.replace('$', '').replace(',', '')) : null;
    const savingsAmount = wasPrice && wasPrice > price ? Math.round((wasPrice - price) * 100) / 100 : 0;

    // Extract brand from title (usually first word)
    const brandMatch = title.match(/^([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/);
    const brand = brandMatch ? brandMatch[1] : '';

    // Build URL: prefer ASIN-based canonical, then parsed link, skip if neither
    let fullUrl = '';
    if (asin) {
      fullUrl = `https://www.amazon.com.au/dp/${asin}`;
    } else if (link && link !== '/') {
      fullUrl = link.startsWith('http') ? link : `https://www.amazon.com.au${link}`;
    } else {
      return; // No valid URL, skip
    }

    products.push({
      id: `amazon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${products.length}`,
      name: title,
      brand,
      price,
      wasPrice: wasPrice && wasPrice > price ? wasPrice : null,
      savingsAmount,
      isOnSpecial: savingsAmount > 0,
      cupPrice,
      cupPriceValue,
      size,
      image,
      url: fullUrl,
      retailer: 'Amazon AU',
      category,
    });
  });

  return products;
}
