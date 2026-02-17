import axios from 'axios';

export interface CoffeeProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  wasPrice: number | null;
  savingsAmount: number;
  isOnSpecial: boolean;
  cupPrice: string; // e.g. "$3.30 / 100G"
  cupPriceValue: number; // numeric cup price for sorting
  size: string;
  image: string;
  url: string;
  retailer: string;
  category: string; // beans, ground, instant, pods, capsules
}

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

export async function searchWoolworths(query: string): Promise<CoffeeProduct[]> {
  const res = await axios.post('https://www.woolworths.com.au/apis/ui/v2/Search/products', {
    SearchTerm: query,
    PageSize: 36,
    PageNumber: 1,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 10000,
  });

  const groups = res.data?.Products || [];
  const products: CoffeeProduct[] = [];

  for (const group of groups) {
    const p = group.Products?.[0];
    if (!p || !p.Price) continue;

    // Filter out non-coffee products (machines, accessories, mugs etc.)
    const pName = (p.Name || p.DisplayName || '').toLowerCase();
    const excludePatterns = ['machine', 'maker', 'frother', 'grinder', 'kettle', 'mug', 'cup ', 'travel cup', 'flask', 'tumbler', 'descaler', 'cleaner', 'filter paper', 'tamper', 'milk jug'];
    if (excludePatterns.some(pat => pName.includes(pat))) continue;

    // Filter out individual/single capsules (not packs)
    const category = categoriseCoffee(p.Name || p.DisplayName || '');
    if (category === 'Pods & Capsules') {
      const packMatch = pName.match(/(\d+)\s*(?:pack|capsule|pod|ct|count|serve)/);
      const singleIndicators = ['single capsule', 'single pod', '1 capsule', '1 pod', 'sample'];
      if (singleIndicators.some(s => pName.includes(s))) continue;
      // If we can parse a count and it's very small (1-2), skip
      if (packMatch && parseInt(packMatch[1]) <= 2) continue;
    }

    // Parse cup price value
    let cupPriceValue = 0;
    const cupMatch = p.CupString?.match(/\$([\d.]+)/);
    if (cupMatch) cupPriceValue = parseFloat(cupMatch[1]);

    products.push({
      id: `woolworths-${p.Stockcode}`,
      name: p.Name || p.DisplayName,
      brand: p.Brand || '',
      price: p.Price,
      wasPrice: p.WasPrice && p.WasPrice > p.Price ? p.WasPrice : null,
      savingsAmount: p.SavingsAmount || 0,
      isOnSpecial: p.IsOnSpecial || false,
      cupPrice: p.CupString || '',
      cupPriceValue,
      size: p.PackageSize || '',
      image: p.MediumImageFile || p.SmallImageFile || '',
      url: `https://www.woolworths.com.au/shop/productdetails/${p.Stockcode}/${p.UrlFriendlyName}`,
      retailer: 'Woolworths',
      category,
    });
  }

  return products;
}

// Browse coffee by category
export async function browseCoffeeCategory(category: string): Promise<CoffeeProduct[]> {
  const searchTerms: Record<string, string> = {
    beans: 'coffee beans',
    ground: 'ground coffee',
    instant: 'instant coffee',
    pods: 'coffee capsules pods',
    sachets: 'coffee sachets',
    coldbrew: 'cold brew coffee iced',
  };

  if (category === 'all') {
    // Search all categories in parallel and dedupe by id
    const results = await Promise.allSettled(
      Object.values(searchTerms).map((term) => searchWoolworths(term))
    );
    const seen = new Set<string>();
    const all: CoffeeProduct[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const p of r.value) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            all.push(p);
          }
        }
      }
    }
    return all;
  }

  const term = searchTerms[category] || 'coffee';
  return searchWoolworths(term);
}
