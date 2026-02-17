import { NextRequest, NextResponse } from 'next/server';
import { searchStaticProducts, getStaticProducts } from '@/lib/staticData';

const IS_STATIC = !!process.env.NETLIFY || process.env.NEXT_PUBLIC_STATIC_DATA === 'true';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ products: [], sources: [] });
  }

  // Always use static data on Netlify; fallback to it locally if JSON has data
  const staticProducts = getStaticProducts();
  if (IS_STATIC || staticProducts.length > 0) {
    const products = searchStaticProducts(q);
    const sources = [...new Set(products.map(p => p.retailer))];
    return NextResponse.json({ products, sources });
  }

  // Live scraping (local dev, no static data)
  const { searchWoolworths } = await import('@/lib/scrapers/woolworths');
  const { searchAmazon } = await import('@/lib/scrapers/amazon');
  const { persistProducts } = await import('@/lib/store');

  const results = await Promise.allSettled([searchWoolworths(q), searchAmazon(q)]);
  const allProducts = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const withSlugs = persistProducts(allProducts);
  const sources = [...new Set(withSlugs.map(p => p.retailer))];

  return NextResponse.json({ products: withSlugs, sources });
}
