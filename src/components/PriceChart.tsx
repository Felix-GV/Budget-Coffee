'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const retailerColors: Record<string, string> = {
  'Woolworths': '#43aa47',
  'Amazon AU': '#FF9900',
  'Coles': '#e01a22',
  'IGA': '#d42d2d',
};

interface PriceHistory {
  retailer: string;
  history: { price: number; date: string }[];
}

export default function PriceChart({ priceData }: { priceData: PriceHistory[] }) {
  const dateMap = new Map<string, Record<string, number>>();

  for (const { retailer, history } of priceData) {
    for (const { date, price } of history) {
      const existing = dateMap.get(date) || {};
      existing[retailer] = price;
      dateMap.set(date, existing);
    }
  }

  const chartData = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, prices]) => ({
      date: new Date(date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
      ...prices,
    }));

  const allPrices = priceData.flatMap(p => p.history.map(h => h.price));
  const minPrice = Math.floor(Math.min(...allPrices) * 0.95);
  const maxPrice = Math.ceil(Math.max(...allPrices) * 1.05);

  return (
    <div className="w-full h-80 bg-stone-900 border border-stone-800 rounded-xl p-4">
      <h3 className="text-white font-semibold mb-4">📊 Price History</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
          <XAxis dataKey="date" stroke="#78716c" tick={{ fontSize: 11 }} interval={4} />
          <YAxis stroke="#78716c" tick={{ fontSize: 11 }} domain={[minPrice, maxPrice]} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px' }}
            labelStyle={{ color: '#fff' }}
            formatter={(value: number | undefined) => value != null ? [`$${value.toFixed(2)}`, ''] : ['', '']}
          />
          <Legend />
          {priceData.map(({ retailer }) => (
            <Line
              key={retailer}
              type="monotone"
              dataKey={retailer}
              stroke={retailerColors[retailer] || '#f97316'}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
