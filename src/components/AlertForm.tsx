'use client';

import { useState } from 'react';

interface AlertFormProps {
  productSlug: string;
  productName: string;
  currentBestPrice: number;
}

export default function AlertForm({ productSlug, productName, currentBestPrice }: AlertFormProps) {
  const [phone, setPhone] = useState('');
  const [targetPrice, setTargetPrice] = useState(Math.floor(currentBestPrice * 0.9).toString());
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, productName, phone, targetPrice: parseFloat(targetPrice) }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to set alert');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-orange-900/20 border border-orange-700/50 rounded-xl p-5">
        <p className="text-orange-400 font-medium">✅ {message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">🔔 Set Price Alert</h3>
      <p className="text-stone-400 text-sm mb-4">
        Get notified when this coffee drops below your target price.
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-sm text-stone-400 block mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+61 4XX XXX XXX"
            className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
        <div>
          <label className="text-sm text-stone-400 block mb-1">Target Price (AUD)</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-stone-500">$</span>
            <input
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg pl-8 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <p className="text-xs text-stone-500 mt-1">Current best: ${currentBestPrice.toFixed(2)}</p>
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-stone-700 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {status === 'loading' ? 'Setting alert...' : '🔔 Set Alert'}
        </button>
        {status === 'error' && <p className="text-red-400 text-sm">{message}</p>}
      </div>
    </form>
  );
}
