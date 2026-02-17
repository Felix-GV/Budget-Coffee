import { NextRequest, NextResponse } from 'next/server';
import { browseStaticProducts } from '@/lib/staticData';

const HAS_TURSO = !!process.env.TURSO_DB_URL;

const categorySearchTerms: Record<string, string> = {
  beans: 'coffee beans', ground: 'ground coffee', instant: 'instant coffee',
  pods: 'coffee capsules pods', sachets: 'coffee sachets', coldbrew: 'cold brew coffee iced',
};

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') || 'all';

  if (HAS_TURSO) {
    const { browseCoffeeCategory } = await import('@/lib/scrapers/woolworths');
    const { searchAmazon } = await import('@/lib/scrapers/amazon');
    const { persistProducts } = await import('@/lib/store');

    const amazonSearches = category === 'all'
      ? Object.values(categorySearchTerms).map(t => searchAmazon(t))
      : [searchAmazon(categorySearchTerms[category] || 'coffee')];

    const results = await Promise.allSettled([browseCoffeeCategory(category), ...amazonSearches]);
    const seen = new Set<string>();
    const allProducts = results.flatMap(r => r.status === 'fulfilled' ? r.value : []).filter(p => {
      const key = `${p.retailer}-${p.name}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });

    const withSlugs = await persistProducts(allProducts);
    const sources = [...new Set(withSlugs.map(p => p.retailer))];
    return NextResponse.json({ products: withSlugs, category, sources });
  }

  // Fallback: static JSON
  const products = browseStaticProducts(category);
  const sources = [...new Set(products.map(p => p.retailer))];
  return NextResponse.json({ products, category, sources });
}
