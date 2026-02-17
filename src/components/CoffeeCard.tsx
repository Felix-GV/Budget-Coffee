import Link from 'next/link';

interface CoffeeCardProps {
  id: string;
  name: string;
  brand: string;
  price: number;
  wasPrice: number | null;
  savingsAmount: number;
  isOnSpecial: boolean;
  cupPrice: string;
  size: string;
  image: string;
  url: string;
  retailer: string;
  category: string;
  slug?: string;
}

export default function CoffeeCard({
  name, brand, price, wasPrice, savingsAmount, isOnSpecial,
  cupPrice, size, image, retailer, category, slug,
}: CoffeeCardProps) {
  const href = slug ? `/product/${slug}` : '#';

  return (
    <Link href={href}>
      <div className={`bg-stone-900 border rounded-xl p-4 hover:border-orange-600/60 transition-all cursor-pointer group ${
        isOnSpecial ? 'border-red-700/40' : 'border-stone-800'
      }`}>
        {isOnSpecial && (
          <div className="mb-2">
            <span className="text-xs font-bold px-2 py-0.5 bg-red-600 text-white rounded-full">
              SPECIAL — Save ${savingsAmount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-stone-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {image ? (
              <img
                src={image}
                alt={name}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'><rect fill='%231c1917' width='80' height='80' rx='8'/><text x='40' y='48' text-anchor='middle' font-size='32'>☕</text></svg>`)}`;
                }}
              />
            ) : (
              <span className="text-3xl">☕</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs text-orange-500 font-medium uppercase">{brand}</span>
              <span className="text-xs text-stone-600">·</span>
              <span className="text-xs text-stone-500">{category}</span>
              {size && (
                <>
                  <span className="text-xs text-stone-600">·</span>
                  <span className="text-xs text-stone-500">{size}</span>
                </>
              )}
            </div>
            <h3 className="text-white font-medium text-sm group-hover:text-orange-400 transition-colors line-clamp-2">
              {name}
            </h3>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className={`text-xl font-bold ${isOnSpecial ? 'text-red-400' : 'text-orange-400'}`}>
                ${price.toFixed(2)}
              </span>
              {wasPrice && (
                <span className="text-sm text-stone-500 line-through">${wasPrice.toFixed(2)}</span>
              )}
              {cupPrice && (
                <span className="text-xs text-stone-500">{cupPrice}</span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-xs text-stone-500">{retailer}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
