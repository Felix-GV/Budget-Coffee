import { NextRequest, NextResponse } from 'next/server';
import { browseCoffeeCategory } from '@/lib/scrapers/woolworths';
import { searchAmazon } from '@/lib/scrapers/amazon';
import { persistProducts } from '@/lib/store';

const categorySearchTerms: Record<string, string> = {
  beans: 'coffee beans',
  ground: 'ground coffee',
  instant: 'instant coffee',
  pods: 'coffee capsules pods',
  sachets: 'coffee sachets',
  coldbrew: 'cold brew coffee iced',
  all: 'coffee',
};

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') || 'all';

  const amazonSearches = category === 'all'
    ? Object.values(categorySearchTerms).filter(t => t !== 'coffee').map(t => searchAmazon(t))
    : [searchAmazon(categorySearchTerms[category] || categorySearchTerms.all)];

  const results = await Promise.allSettled([
    browseCoffeeCategory(category),
    ...amazonSearches,
  ]);

  const seen = new Set<string>();
  const allProducts = results.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : []
  ).filter((p) => {
    const key = `${p.retailer}-${p.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const withSlugs = persistProducts(allProducts);
  const sources = [...new Set(withSlugs.map((p) => p.retailer))];

  return NextResponse.json({
    products: withSlugs.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      price: p.price,
      wasPrice: p.wasPrice,
      savingsAmount: p.savingsAmount,
      isOnSpecial: p.isOnSpecial,
      cupPrice: p.cupPrice,
      cupPriceValue: p.cupPriceValue,
      size: p.size,
      image: p.image,
      url: p.url,
      retailer: p.retailer,
      category: p.category,
      slug: p.slug,
    })),
    category,
    sources,
  });
}
