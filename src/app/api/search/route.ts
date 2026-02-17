import { NextRequest, NextResponse } from 'next/server';
import { searchStaticProducts } from '@/lib/staticData';

const HAS_TURSO = !!process.env.TURSO_DB_URL;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ products: [], sources: [] });
  }

  if (HAS_TURSO) {
    // Live scrape + persist to Turso
    const { searchWoolworths } = await import('@/lib/scrapers/woolworths');
    const { searchAmazon } = await import('@/lib/scrapers/amazon');
    const { persistProducts } = await import('@/lib/store');

    const results = await Promise.allSettled([searchWoolworths(q), searchAmazon(q)]);
    const allProducts = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    const withSlugs = await persistProducts(allProducts);
    const sources = [...new Set(withSlugs.map(p => p.retailer))];
    return NextResponse.json({ products: withSlugs, sources });
  }

  // Fallback: static JSON
  const products = searchStaticProducts(q);
  const sources = [...new Set(products.map(p => p.retailer))];
  return NextResponse.json({ products, sources });
}
