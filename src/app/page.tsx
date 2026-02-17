import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

const categories = [
  { name: 'All Coffee', slug: 'all' },
  { name: 'Beans', slug: 'beans' },
  { name: 'Ground', slug: 'ground' },
  { name: 'Instant', slug: 'instant' },
  { name: 'Pods & Capsules', slug: 'pods' },
  { name: 'Sachets', slug: 'sachets' },
  { name: 'Cold Brew', slug: 'coldbrew' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <div className="text-center mb-8">
          <div className="text-5xl sm:text-6xl mb-4">☕</div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3">
            Coffee <span className="text-orange-400">Tracker</span>
          </h1>
          <p className="text-stone-400 text-base sm:text-lg max-w-lg mx-auto">
            Compare coffee prices across Australian supermarkets. Find the best deals. Never overpay for your brew.
          </p>
        </div>
        <SearchBar large />
        <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/browse?category=${cat.slug}`}
              className="px-5 py-2.5 bg-stone-900 border border-stone-800 rounded-full text-sm text-stone-400 hover:text-orange-400 hover:border-orange-800/50 transition-all font-medium"
            >
              {cat.name}
            </Link>
          ))}
        </div>
        <div className="mt-8 flex gap-4 flex-wrap justify-center text-stone-500 text-sm">
          <span>🟢 Woolworths</span>
          <span>🟠 Amazon AU</span>
          <span className="text-stone-700">· Coles, IGA & Supabarn coming soon</span>
        </div>
      </div>
      <footer className="text-center text-stone-700 text-sm py-6">
        ☕ Real-time prices from Australian supermarkets
      </footer>
    </main>
  );
}
