import { NextRequest, NextResponse } from 'next/server';
import { browseCoffeeCategory } from '@/lib/scrapers/woolworths';
import { searchAmazon } from '@/lib/scrapers/amazon';
import { persistProducts } from '@/lib/store';

const categorySearchTerms: Record<string, string> = {
  beans: 'coffee beans', ground: 'ground coffee', instant: 'instant coffee',
  pods: 'coffee capsules pods', sachets: 'coffee sachets', coldbrew: 'cold brew coffee iced',
};

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') || 'all';

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
