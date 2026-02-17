'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import SearchBar from '@/components/SearchBar';
import CoffeeCard from '@/components/CoffeeCard';

interface CoffeeProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  wasPrice: number | null;
  savingsAmount: number;
  isOnSpecial: boolean;
  cupPrice: string;
  cupPriceValue: number;
  size: string;
  image: string;
  url: string;
  retailer: string;
  category: string;
  slug?: string;
}

type SortBy = 'price' | 'cupPrice' | 'savings' | 'name';

const categoryLabels: Record<string, string> = {
  all: 'All Coffee',
  beans: 'Beans',
  ground: 'Ground',
  instant: 'Instant',
  pods: 'Pods & Capsules',
  sachets: 'Sachets',
  coldbrew: 'Cold Brew',
};

function BrowseResults() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'all';
  const [products, setProducts] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>('price');
  const [showSpecialsOnly, setShowSpecialsOnly] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 30;

  const categoryMap: Record<string, string> = {
    beans: 'Beans', ground: 'Ground', instant: 'Instant',
    pods: 'Pods & Capsules', sachets: 'Sachets', coldbrew: 'Cold Brew',
  };

  useEffect(() => {
    setLoading(true);
    fetch('/data/products.json')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        const all = data.products || [];
        const filtered = category === 'all' ? all : all.filter((p: CoffeeProduct) => p.category === categoryMap[category]);
        setProducts(filtered);
        setLoading(false);
      })
      .catch(() => {
        fetch(`/api/browse?category=${encodeURIComponent(category)}`)
          .then(res => res.json())
          .then(data => { setProducts(data.products || []); setLoading(false); })
          .catch(() => setLoading(false));
      });
  }, [category]);

  const filtered = products
    .filter(p => !showSpecialsOnly || p.isOnSpecial)
    .sort((a, b) => {
      switch (sortBy) {
        case 'price': return a.price - b.price;
        case 'cupPrice': return (a.cupPriceValue || 999) - (b.cupPriceValue || 999);
        case 'savings': return b.savingsAmount - a.savingsAmount;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const specialCount = products.filter(p => p.isOnSpecial).length;
  const brands = [...new Set(products.map(p => p.brand))].filter(Boolean).sort();
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [showSpecialsOnly, sortBy, category]);

  return (
    <main className="min-h-screen bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <a href="/" className="text-orange-400 hover:text-orange-300 text-sm mb-6 inline-block">
          ☕ ← Back to home
        </a>
        <div className="mb-6">
          <SearchBar />
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {categoryLabels[category] || '☕ All Coffee'}
          </h1>
          <div className="flex gap-2 mt-3 flex-wrap overflow-x-auto pb-1">
            {Object.entries(categoryLabels).map(([slug, label]) => (
              <a
                key={slug}
                href={`/browse?category=${slug}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  slug === category
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-orange-800/50 hover:text-orange-400'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">☕</div>
            <div className="text-stone-500 text-lg">Loading coffee...</div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <p className="text-stone-500 text-sm">{filtered.length} products</p>
                {specialCount > 0 && (
                  <button
                    onClick={() => setShowSpecialsOnly(!showSpecialsOnly)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      showSpecialsOnly
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50'
                    }`}
                  >
                    🔥 {specialCount} on special
                  </button>
                )}
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="text-xs bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-300"
              >
                <option value="price">Sort: Cheapest</option>
                <option value="cupPrice">Sort: Best value (per unit)</option>
                <option value="savings">Sort: Biggest savings</option>
                <option value="name">Sort: Name</option>
              </select>
            </div>

            {brands.length > 0 && (
              <div className="mb-4 flex gap-1.5 flex-wrap">
                {brands.slice(0, 15).map(brand => (
                  <span key={brand} className="text-xs px-2 py-0.5 bg-stone-900 border border-stone-800 rounded text-stone-500">
                    {brand}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {paginated.map((product) => (
                <CoffeeCard key={product.id} {...product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm bg-stone-900 border border-stone-700 rounded-lg text-stone-300 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-stone-500 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm bg-stone-900 border border-stone-700 rounded-lg text-stone-300 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-500">☕ Loading...</div>}>
      <BrowseResults />
    </Suspense>
  );
}
