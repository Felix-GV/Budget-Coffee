import { NextRequest, NextResponse } from 'next/server';
import { searchWoolworths } from '@/lib/scrapers/woolworths';
import { searchAmazon } from '@/lib/scrapers/amazon';
import { persistProducts } from '@/lib/store';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q');
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ products: [], sources: [] });
  }

  const results = await Promise.allSettled([searchWoolworths(q), searchAmazon(q)]);
  const allProducts = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
  const withSlugs = await persistProducts(allProducts);
  const sources = [...new Set(withSlugs.map(p => p.retailer))];

  return NextResponse.json({ products: withSlugs, sources });
}
