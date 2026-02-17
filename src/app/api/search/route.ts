import { NextRequest, NextResponse } from 'next/server';
import { searchWoolworths } from '@/lib/scrapers/woolworths';
import { searchAmazon } from '@/lib/scrapers/amazon';
import { persistProducts } from '@/lib/store';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ products: [], sources: [] });
  }

  // Scrape live from all sources in parallel
  const results = await Promise.allSettled([
    searchWoolworths(q),
    searchAmazon(q),
  ]);

  const allProducts = results.flatMap((r) =>
    r.status === 'fulfilled' ? r.value : []
  );

  // Persist to DB for price history tracking
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
    sources,
  });
}
