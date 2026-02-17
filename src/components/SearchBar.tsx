'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar({ initialQuery = '', large = false }: { initialQuery?: string; large?: boolean }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search coffee..."
          className={`w-full bg-stone-900 border border-stone-700 rounded-xl text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
            large ? 'px-6 py-5 text-lg' : 'px-4 py-3 text-base'
          }`}
        />
        <button
          type="submit"
          className={`absolute right-2 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg transition-colors ${
            large ? 'top-2 px-6 py-3' : 'top-1.5 px-4 py-2'
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}
