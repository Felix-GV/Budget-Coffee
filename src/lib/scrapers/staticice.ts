import axios from 'axios';

export interface ScrapedProduct {
  name: string;
  price: number;
  retailer: string;
  url: string;
  image: string;
}

// Accessory indicators
const accessoryPatterns = [
  'case', 'cover', 'protector', 'screen protector', 'tempered glass',
  'charger', 'cable', 'adapter', 'mount', 'holder', 'stand',
  'skin', 'sleeve', 'pouch', 'strap', 'band', 'wallet',
  'screwdriver', 'tool kit', 'sticker', 'decal',
  'silicone', 'otterbox', 'spigen', 'ringke', 'ugreen', 'jakemy',
  'cleaning', 'cloth', 'wipe', 'stylus', 'pen tip',
  'repair', 'replacement part', 'spare', 'cradle',
  'film', 'folio', 'bumper', 'armor', 'rugged',
  'lens', 'tripod', 'gimbal',
  'screw driver', 'dux ', 'charging station', 'charge station',
  'docking station', 'hub ', 'dongle',
  'privacy screen', 'kensington', 'jetdrive', 'ssd upgrade',
  'media remote', 'remote control',
  'lock ', 'keyed lock', 'hirise', 'riser', 'cooling pad',
];

function isAccessory(name: string, queryWords: string[]): boolean {
  // Normalize hyphens to spaces for matching
  const lower = name.toLowerCase().replace(/-/g, ' ');
  
  // Direct accessory keyword match
  if (accessoryPatterns.some(kw => lower.includes(kw))) return true;
  
  // "for <product>" pattern — accessory FOR a product
  for (const word of queryWords) {
    if (lower.includes(`for ${word}`) || lower.includes(`for apple ${word}`)) return true;
  }
  
  // If name starts with an accessory brand, it's likely an accessory
  const accessoryBrands = [
    'speck', 'startech', 'twelve south', 'compulocks', 'targus', 'incase',
    'moshi', 'tomtoc', 'thule', 'stm ', 'belkin', 'anker', 'satechi',
    'hyper', 'brydge', 'logitech', 'jm-', 'nd3236', 'goobay',
    'astro ', 'hyperx', 'hp hyperx', 'razer',
  ];
  if (accessoryBrands.some(b => lower.startsWith(b))) return true;
  
  // Product code prefix like [ABC123] followed by accessory brand
  if (/^\[/.test(lower)) {
    const afterBracket = lower.replace(/^\[[^\]]*\]\s*/, '');
    if (accessoryBrands.some(b => afterBracket.startsWith(b))) return true;
  }
  
  // Dash pattern: "BrandName - MacBook Air" often means accessory
  const dashMatch = lower.match(/^.+\s-\s/);
  if (dashMatch) {
    const beforeDash = dashMatch[0].toLowerCase();
    // If the query words appear AFTER the dash, it's "AccessoryName - for Product"
    const afterDash = lower.substring(dashMatch[0].length);
    const queryInAfterDash = queryWords.every(w => afterDash.includes(w));
    const queryInBeforeDash = queryWords.some(w => beforeDash.includes(w));
    if (queryInAfterDash && !queryInBeforeDash) return true;
  }
  
  return false;
}

function relevanceScore(name: string, queryWords: string[], price: number): number {
  const lower = name.toLowerCase();
  let score = 0;
  
  // Each query word present in name
  let matchedWords = 0;
  for (const word of queryWords) {
    if (lower.includes(word)) {
      score += 10;
      matchedWords++;
    }
  }
  
  // Must match ALL query words to be relevant
  if (matchedWords < queryWords.length) return -1000;
  
  // Hard filter: accessories
  if (isAccessory(lower, queryWords)) return -1000;
  
  // Boost actual products with storage/screen specs
  if (/\d+\s*(gb|tb)/i.test(lower)) score += 20;
  if (/\d+(\.\d+)?\s*(inch|")/i.test(lower)) score += 15;
  
  // Boost if name starts with a known brand + product line (strong signal it's the actual product)
  const productSignals = [
    'apple iphone', 'apple macbook', 'apple ipad', 'apple airpods', 'apple watch',
    'samsung galaxy', 'sony playstation', 'playstation 5', 'nintendo switch',
    'xbox series', 'google pixel', 'sony wh-', 'bose quietcomfort',
    'lg oled', 'samsung neo', 'dell xps', 'lenovo thinkpad', 'asus rog',
    'console', 'laptop', 'notebook', 'smartphone',
  ];
  if (productSignals.some(sig => lower.includes(sig))) score += 25;
  
  // Boost higher-priced items (more likely the actual product)
  if (price >= 500) score += 20;
  else if (price >= 200) score += 10;
  else if (price >= 50) score += 5;
  else score -= 10;
  
  // Final sanity: if score is positive but price is suspiciously low for the category, demote
  // Phones/laptops/consoles under $100 are almost certainly accessories
  const expensiveCategories = ['iphone', 'macbook', 'galaxy s', 'playstation', 'xbox', 'ipad', 'pixel'];
  if (expensiveCategories.some(c => queryWords.join(' ').includes(c)) && price < 100) {
    score -= 50;
  }
  
  return score;
}

export async function scrapeStaticice(query: string): Promise<ScrapedProduct[]> {
  // Scrape multiple price ranges to find actual products, not accessories
  // Higher min prices first to prioritize actual products
  const q = encodeURIComponent(query);
  const base = `https://www.staticice.com.au/cgi-bin/search.cgi?stype=1&re=+&sta=AUS`;
  const urls = [
    `${base}&q=${q}&price-min=100`,
    `${base}&q=${q}&price-min=100&pos=21`,
    `${base}&q=${q}&price-min=100&pos=41`,
    `${base}&q=${q}`, // fallback with no price filter
  ];
  
  const allResults: ScrapedProduct[] = [];
  
  for (const url of urls) {
    try {
      const results = await scrapeOneStaticicePage(url, query);
      allResults.push(...results);
    } catch {
      // Continue with other pages
    }
    // Small delay between requests
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Deduplicate by name+retailer
  const seen = new Set<string>();
  const deduped = allResults.filter(r => {
    const key = `${r.name}::${r.retailer}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  const queryWords = query.toLowerCase().split(/\s+/);
  
  // Score and filter
  const scored = deduped
    .map(r => ({ ...r, score: relevanceScore(r.name, queryWords, r.price) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);
  
  return scored.length > 0 ? scored : deduped.filter(r => !isAccessory(r.name, queryWords));
}

async function scrapeOneStaticicePage(url: string, query: string): Promise<ScrapedProduct[]> {
  
  const { data } = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  const results: ScrapedProduct[] = [];
  
  // Pattern: linkid=2 means product link (linkid=1 is retailer homepage)
  const regex = new RegExp('redirect\\.cgi\\?name=([^&]+)&linkid=2&newurl=([^&]+)[^"]*"[^>]*>\\$([\\d,]+\\.\\d{2})<\\/a>.*?<\\/td>\\s*<td[^>]*>([^<]+)', 'gs');
  
  let match;
  while ((match = regex.exec(data)) !== null) {
    const retailer = decodeURIComponent(match[1]).replace(/\+/g, ' ');
    const productUrl = decodeURIComponent(match[2]);
    const price = parseFloat(match[3].replace(',', ''));
    const name = match[4].trim();
    
    if (name && price > 0 && !name.startsWith('Click')) {
      results.push({
        name,
        price,
        retailer,
        url: productUrl,
        image: '',
      });
    }
  }
  
  return results;
}

// Group scraped results into products with multiple retailer prices
export interface GroupedProduct {
  name: string;
  slug: string;
  category: string;
  image: string;
  prices: {
    retailer: string;
    price: number;
    url: string;
  }[];
  bestPrice: number;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeProductName(name: string): string {
  // Remove condition tags like [~Refurbished: Good]
  let n = name.replace(/\[~[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
  // Remove trailing "(In Stock)" etc.
  n = n.replace(/\(In Stock\)$/i, '').trim();
  return n;
}

function groupKey(name: string): string {
  let key = normalizeProductName(name).toLowerCase();
  // Remove colour variants for grouping: (Black), (Blue), (Pink) etc.
  key = key.replace(/\((black|white|blue|pink|red|green|yellow|purple|grey|gray|silver|gold|graphite|midnight|starlight|cream|lavender|phantom|titanium|natural|desert|cosmic|mint|coral|orange|navy|rose|beige)\)/gi, '');
  // Remove refurbished condition for grouping
  key = key.replace(/\[?~?refurbished:?\s*(good|very good|excellent|fair)\]?/gi, '');
  // Collapse whitespace
  key = key.replace(/\s+/g, ' ').trim();
  return key;
}

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('iphone') || n.includes('galaxy s') || n.includes('pixel')) return 'Phones';
  if (n.includes('macbook') || n.includes('laptop') || n.includes('thinkpad') || n.includes('notebook')) return 'Laptops';
  if (n.includes('ipad') || n.includes('tab s') || n.includes('tablet')) return 'Tablets';
  if (n.includes('airpods') || n.includes('headphone') || n.includes('earbuds') || n.includes('buds')) return 'Audio';
  if (n.includes('playstation') || n.includes('xbox') || n.includes('nintendo') || n.includes('ps5')) return 'Gaming';
  if (n.includes('tv') || n.includes('television')) return 'TVs';
  return 'Electronics';
}

export function groupProducts(scraped: ScrapedProduct[]): GroupedProduct[] {
  const groups = new Map<string, GroupedProduct>();
  
  for (const item of scraped) {
    const normalized = normalizeProductName(item.name);
    const key = groupKey(item.name);
    const slug = slugify(key);
    
    if (groups.has(key)) {
      const existing = groups.get(key)!;
      // Only add if this retailer isn't already listed, or has a better price
      const existingRetailer = existing.prices.find(p => p.retailer === item.retailer);
      if (!existingRetailer) {
        existing.prices.push({ retailer: item.retailer, price: item.price, url: item.url });
      } else if (item.price < existingRetailer.price) {
        existingRetailer.price = item.price;
        existingRetailer.url = item.url;
      }
      existing.bestPrice = Math.min(existing.bestPrice, item.price);
    } else {
      groups.set(key, {
        name: normalized,
        slug,
        category: guessCategory(normalized),
        image: item.image,
        prices: [{ retailer: item.retailer, price: item.price, url: item.url }],
        bestPrice: item.price,
      });
    }
  }
  
  // Sort by best price
  return Array.from(groups.values()).sort((a, b) => a.bestPrice - b.bestPrice);
}
