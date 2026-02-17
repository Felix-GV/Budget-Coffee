/**
 * Reads from src/data/products.json for static/Netlify deployments.
 * Used as fallback when SQLite is not available.
 */

import type { CoffeeProduct } from './scrapers/woolworths';

interface StaticData {
  scrapedAt: string;
  count: number;
  products: (CoffeeProduct & { slug: string })[];
}

let _cache: StaticData | null = null;

export function getStaticProducts(): (CoffeeProduct & { slug: string })[] {
  if (_cache) return _cache.products;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require('../../src/data/products.json') as StaticData;
    _cache = data;
    return data.products;
  } catch {
    return [];
  }
}

export function searchStaticProducts(query: string): (CoffeeProduct & { slug: string })[] {
  const products = getStaticProducts();
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  return products.filter(p => {
    const haystack = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
    return words.some(w => haystack.includes(w));
  });
}

export function browseStaticProducts(category: string): (CoffeeProduct & { slug: string })[] {
  const products = getStaticProducts();
  if (category === 'all') return products;

  const categoryMap: Record<string, string> = {
    beans: 'Beans',
    ground: 'Ground',
    instant: 'Instant',
    pods: 'Pods & Capsules',
    sachets: 'Sachets',
    coldbrew: 'Cold Brew',
  };

  const label = categoryMap[category];
  if (!label) return products;
  return products.filter(p => p.category === label);
}

export function getStaticProductBySlug(slug: string): (CoffeeProduct & { slug: string }) | null {
  return getStaticProducts().find(p => p.slug === slug) ?? null;
}
