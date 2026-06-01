'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useEffect, useState } from 'react';
import { HistogramBucket } from '@/lib/ratingsData';

const BAR_COLOR = '#0ea5e9';

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export function RatingHistogram({ data }: { data: HistogramBucket[] }) {
  const dark = useDarkMode();

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'currentColor' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(14,165,233,0.1)' }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div
                style={{
                  background: dark ? '#1f2937' : '#ffffff',
                  border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: dark ? '#f9fafb' : '#111827',
                  padding: '4px 8px',
                }}
              >
                <div>Rating: {label}</div>
                <div>{payload[0].value} albums</div>
              </div>
            );
          }}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.rating} fill={BAR_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
