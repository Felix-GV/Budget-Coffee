'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import PriceChart from '@/components/PriceChart';
import AlertForm from '@/components/AlertForm';

function retailerSearchUrl(retailer: string, productName: string): string {
  const q = encodeURIComponent(productName);
  if (retailer === 'Woolworths') return `https://www.woolworths.com.au/shop/search/products?searchTerm=${q}`;
  if (retailer === 'Amazon AU') return `https://www.amazon.com.au/s?k=${q}&i=grocery`;
  if (retailer === 'Coles') return `https://www.coles.com.au/search?q=${q}`;
  return '#';
}

interface Product {
  name: string;
  slug: string;
  brand: string;
  image: string;
  category: string;
  size: string;
  prices: {
    retailer: string;
    price: number;
    url: string;
    history: { price: number; date: string }[];
  }[];
}

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/products.json')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        const products: Product[] = data.products || [];
        const found = products.find((p: Product & { slug?: string }) => (p as Product & { slug: string }).slug === slug);
        if (!found) { setLoading(false); return; }

        const p = found as Product & { slug: string; category: string; retailer: string; price: number; url: string; brand: string };

        // Strict matching: same product AND same size across retailers
        function extractCount(name: string): number | null {
          const m = name.toLowerCase().match(/\bpack\s+of\s+(\d+)\b/)
            || name.toLowerCase().match(/(?:x\s*)(\d+)\s*(?:pack|pk|capsule|pod|sachet|serve|ct|count|stick)s?\b/)
            || name.toLowerCase().match(/\b(\d+)\s*(?:pack|pk|capsule|pod|sachet|serve|ct|count|stick)s?\b/);
          return m ? parseInt(m[1]) : null;
        }
        function extractWeight(name: string): number | null {
          const kg = name.toLowerCase().match(/(\d+(?:\.\d+)?)\s*kg/);
          const g = name.toLowerCase().match(/(\d+(?:\.\d+)?)\s*g(?:ram)?s?\b/);
          if (kg) return Math.round(parseFloat(kg[1]) * 1000);
          if (g) return Math.round(parseFloat(g[1]));
          return null;
        }

        const pWeight = extractWeight(p.name);
        const pCount = extractCount(p.name);
        const pBrand = p.brand?.toLowerCase() || '';
        const STOP = new Set(['coffee','pack','the','and','with','for','from','each','per','roast','blend','dark','medium','light','organic','fair','trade','ground','beans','instant','capsules','pods','espresso','premium']);
        const pWords = new Set(p.name.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));

        const retailerMap = new Map<string, { product: typeof p; score: number }>();
        for (const other of products as Array<typeof p>) {
          if (other.retailer === p.retailer) continue;
          const oBrand = other.brand?.toLowerCase() || '';
          let score = 0;

          // Brand must match
          if (pBrand && oBrand) {
            if (pBrand === oBrand) score += 8;
            else if (pBrand.split(' ')[0] === oBrand.split(' ')[0]) score += 4;
            else score -= 10; // different brand = reject
          }

          // Name word overlap
          const oWords = other.name.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
          score += oWords.filter(w => pWords.has(w)).length * 2;

          // Size match — weight
          const oWeight = extractWeight(other.name);
          if (pWeight && oWeight) {
            if (Math.abs(pWeight - oWeight) / Math.max(pWeight, oWeight) < 0.05) score += 10;
            else score -= 15; // different weight = reject
          }

          // Size match — count (10pk vs 20pk = different product)
          const oCount = extractCount(other.name);
          if (pCount && oCount) {
            if (pCount === oCount) score += 10;
            else score -= 15; // different count = reject
          }

          if (score < 10) continue; // Minimum confidence threshold

          const existing = retailerMap.get(other.retailer);
          if (!existing || score > existing.score) {
            retailerMap.set(other.retailer, { product: other, score });
          }
        }

        const today = new Date().toISOString().split('T')[0];
        setProduct({
          ...p,
          prices: [
            { retailer: p.retailer, price: p.price, url: p.url, history: [{ date: today, price: p.price }] },
            ...Array.from(retailerMap.values()).map(({ product: o }) => ({
              retailer: o.retailer, price: o.price, url: o.url,
              history: [{ date: today, price: o.price }],
            })),
          ].sort((a, b) => a.price - b.price),
        });
        setLoading(false);
      })
      .catch(() => {
        fetch(`/api/product/${slug}`)
          .then(res => res.json())
          .then(data => { setProduct(data.product); setLoading(false); })
          .catch(() => setLoading(false));
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">☕</div>
          <div className="text-stone-500">Loading product...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">😕</div>
          <div className="text-stone-500">Product not found</div>
          <Link href="/" className="text-orange-400 hover:text-orange-300 text-sm mt-4 inline-block">
            ☕ Back to home
          </Link>
        </div>
      </div>
    );
  }

  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const bestPrice = sortedPrices[0];
  const hasHistory = product.prices.some((p) => p.history && p.history.length > 0);

  return (
    <main className="min-h-screen bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="text-orange-400 hover:text-orange-300 text-sm mb-6 inline-block">
          ☕ ← Back to home
        </Link>
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Product Header */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain p-3"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect fill='%231c1917' width='128' height='128' rx='16'/><text x='64' y='76' text-anchor='middle' font-size='56'>☕</text></svg>`)}`;
                }}
              />
            ) : (
              <span className="text-5xl">☕</span>
            )}
          </div>
          <div>
            {product.brand && (
              <span className="text-xs text-orange-500 font-medium uppercase tracking-wide">{product.brand}</span>
            )}
            <span className="text-xs text-stone-600 ml-2">{product.category}</span>
            {product.size && <span className="text-xs text-stone-600 ml-2">· {product.size}</span>}
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">{product.name}</h1>
            {bestPrice && (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-400">${bestPrice.price.toFixed(2)}</span>
                <span className="text-stone-500">best price at {bestPrice.retailer}</span>
              </div>
            )}
          </div>
        </div>

        {/* Price Chart */}
        <div className="mb-8">
          <PriceChart
            priceData={product.prices
              .filter((p) => p.history && p.history.length > 0)
              .map((p) => ({
                retailer: p.retailer,
                history: p.history,
              }))}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* All Prices by retailer */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">🏪 Compare Prices</h3>
            <div className="space-y-3">
              {sortedPrices.map((p, i) => (
                <a
                  key={p.retailer}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {i === 0 && (
                      <span className="text-orange-400 text-xs font-bold bg-orange-900/50 px-2 py-0.5 rounded">BEST</span>
                    )}
                    <span className="text-white group-hover:text-orange-400 transition-colors">{p.retailer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${i === 0 ? 'text-orange-400' : 'text-white'}`}>
                      ${p.price.toFixed(2)}
                    </span>
                    <span className="text-stone-600 text-sm">→</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Alert Form */}
          {bestPrice && (
            <AlertForm
              productSlug={product.slug}
              productName={product.name}
              currentBestPrice={bestPrice.price}
            />
          )}
        </div>
      </div>
    </main>
  );
}
