import { NextRequest, NextResponse } from 'next/server';
import { searchStaticProducts } from '@/lib/staticData';

// On Netlify/static: use pre-scraped JSON
// Locally: scrape live and persist to SQLite
const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_DATA === 'true' || process.env.NETLIFY === 'true';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ products: [], sources: [] });
  }

  if (IS_STATIC) {
    const products = searchStaticProducts(q);
    const sources = [...new Set(products.map(p => p.retailer))];
    return NextResponse.json({ products, sources });
  }

  // Live scraping (local dev)
  const { searchWoolworths } = await import('@/lib/scrapers/woolworths');
  const { searchAmazon } = await import('@/lib/scrapers/amazon');
  const { persistProducts } = await import('@/lib/store');

  const results = await Promise.allSettled([
    searchWoolworths(q),
    searchAmazon(q),
  ]);

  const allProducts = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const withSlugs = persistProducts(allProducts);
  const sources = [...new Set(withSlugs.map(p => p.retailer))];

  return NextResponse.json({
    products: withSlugs,
    sources,
  });
}
