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

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [products, setProducts] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('price');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterRetailer, setFilterRetailer] = useState<string>('all');
  const [sources, setSources] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const perPage = 30;

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        setSources(data.sources || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [q]);

  const categories = ['all', ...new Set(products.map(p => p.category))];
  const retailers = ['all', ...new Set(products.map(p => p.retailer))];

  const filtered = products
    .filter(p => filterCategory === 'all' || p.category === filterCategory)
    .filter(p => filterRetailer === 'all' || p.retailer === filterRetailer)
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
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filterCategory, filterRetailer, sortBy]);

  return (
    <main className="min-h-screen bg-stone-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <a href="/" className="text-orange-400 hover:text-orange-300 text-sm mb-6 inline-block">
          ☕ ← Back to home
        </a>
        <div className="mb-6">
          <SearchBar initialQuery={q} />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">☕</div>
            <div className="text-stone-500 text-lg">Brewing results...</div>
          </div>
        ) : products.length === 0 && q ? (
          <div className="text-center py-20">
            <div className="text-stone-500 text-lg">No coffee found for &quot;{q}&quot;</div>
            <p className="text-stone-600 mt-2">Try: lavazza, nespresso, beans, instant, cold brew</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <p className="text-stone-500 text-sm">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </p>
                {sources.length > 0 && (
                  <span className="text-xs text-stone-600">
                    from {sources.join(' + ')}
                  </span>
                )}
                {specialCount > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-red-900/50 text-red-400 rounded-full">
                    🔥 {specialCount} on special
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="text-xs bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-300 min-w-0"
                >
                  <option value="price">Sort: Cheapest</option>
                  <option value="cupPrice">Sort: Best value</option>
                  <option value="savings">Sort: Biggest savings</option>
                  <option value="name">Sort: Name</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-xs bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-300 min-w-0"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c === 'all' ? 'All types' : c}</option>
                  ))}
                </select>
                <select
                  value={filterRetailer}
                  onChange={(e) => setFilterRetailer(e.target.value)}
                  className="text-xs bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-stone-300 min-w-0"
                >
                  {retailers.map(r => (
                    <option key={r} value={r}>{r === 'all' ? 'All stores' : r}</option>
                  ))}
                </select>
              </div>
            </div>

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

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-500">☕ Loading...</div>}>
      <SearchResults />
    </Suspense>
  );
}
