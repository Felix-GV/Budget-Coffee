import { NextRequest, NextResponse } from 'next/server';
import { getStaticProductBySlug, getStaticProducts } from '@/lib/staticData';

const IS_STATIC = process.env.NEXT_PUBLIC_STATIC_DATA === 'true' || process.env.NETLIFY === 'true';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (IS_STATIC) {
    const product = getStaticProductBySlug(slug);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Find cheapest from each other retailer in same category
    const allProducts = getStaticProducts();
    const others = allProducts.filter(p => p.category === product.category && p.retailer !== product.retailer);
    const retailerMap = new Map<string, typeof product>();
    for (const p of others) {
      const existing = retailerMap.get(p.retailer);
      if (!existing || p.price < existing.price) retailerMap.set(p.retailer, p);
    }

    return NextResponse.json({
      product: {
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        image: product.image,
        category: product.category,
        size: product.size,
        prices: [
          { retailer: product.retailer, price: product.price, url: product.url, slug: product.slug, size: product.size, history: [] },
          ...Array.from(retailerMap.values()).map(p => ({
            retailer: p.retailer, price: p.price, url: p.url, slug: p.slug, size: p.size, history: [],
          })),
        ].sort((a, b) => a.price - b.price),
      },
    });
  }

  // Local dev: use SQLite
  const { getProductWithAlternatives } = await import('@/lib/store');
  const product = getProductWithAlternatives(slug);
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ product });
}
