import Link from 'next/link';

interface Price {
  retailer: string;
  price: number;
}

interface ProductCardProps {
  name: string;
  slug: string;
  image: string;
  category: string;
  prices: Price[];
}

const categoryEmoji: Record<string, string> = {
  'Audio': '🎧', 'Phones': '📱', 'Laptops': '💻', 'Gaming': '🎮', 'TVs': '📺', 'Tablets': '📱',
  'Meat & Poultry': '🍗', 'Seafood': '🐟', 'Dairy & Eggs': '🥛', 'Pantry': '🥫',
  'Drinks': '🥤', 'Snacks': '🍪', 'Frozen': '🧊', 'Fresh Produce': '🥑', 'Bakery': '🍞',
};

function fallbackSvg(category: string): string {
  const emoji = categoryEmoji[category] || '📦';
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect fill='%2327272a' width='96' height='96' rx='12'/><text x='48' y='60' text-anchor='middle' font-size='40'>${emoji}</text></svg>`)}`;
}

export default function ProductCard({ name, slug, image, category, prices }: ProductCardProps) {
  const sortedPrices = [...prices].sort((a, b) => a.price - b.price);
  const bestPrice = sortedPrices[0];
  const worstPrice = sortedPrices[sortedPrices.length - 1];
  const savings = Math.round((worstPrice.price - bestPrice.price) * 100) / 100;

  return (
    <Link href={`/product/${slug}`}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-emerald-600 transition-all cursor-pointer group">
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={image || fallbackSvg(category)} alt={name} className="w-full h-full object-contain p-2" onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackSvg(category);
            }} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-zinc-500 uppercase tracking-wide">{category}</span>
            <h3 className="text-white font-semibold mt-1 group-hover:text-emerald-400 transition-colors truncate">{name}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">${bestPrice.price.toFixed(2)}</span>
              <span className="text-sm text-zinc-500">at {bestPrice.retailer}</span>
            </div>
            {savings > 0 && (
              <span className="text-xs text-emerald-600 mt-1 inline-block">
                Save up to ${savings.toFixed(2)} vs other retailers
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-zinc-800 flex gap-2 flex-wrap">
          {sortedPrices.map((p) => (
            <span
              key={p.retailer}
              className={`text-xs px-2 py-1 rounded ${
                p.retailer === bestPrice.retailer
                  ? 'bg-emerald-900/50 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {p.retailer}: ${p.price.toFixed(2)}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
