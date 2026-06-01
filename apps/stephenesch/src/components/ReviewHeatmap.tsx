'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { HeatmapDay } from '@/lib/ratingsData';

const CELL = 11;
const GAP = 2;
const STEP = CELL + GAP;
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function getColor(count: number, max: number): string {
  if (count === 0) return 'var(--heatmap-empty, #e5e7eb)';
  const intensity = Math.ceil((count / max) * 4);
  const levels: Record<number, string> = {
    1: '#bae6fd',
    2: '#38bdf8',
    3: '#0ea5e9',
    4: '#0369a1',
  };
  return levels[intensity] ?? levels[4];
}

interface Week {
  days: (HeatmapDay | null)[];
  yearLabel?: string;
}

function buildWeeks(days: HeatmapDay[]): {
  weeks: Week[];
  months: { label: string; weekIndex: number }[];
} {
  if (days.length === 0) return { weeks: [], months: [] };

  const byDate: Record<string, number> = {};
  for (const d of days) byDate[d.date] = d.count;

  const first = new Date(days[0].date);
  const last = new Date(days[days.length - 1].date);

  // Align to Sunday at start
  const startDate = new Date(first);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Align to Saturday at end
  const endDate = new Date(last);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const weeks: Week[] = [];
  const months: { label: string; weekIndex: number }[] = [];
  let currentMonth = -1;
  let cursor = new Date(startDate);

  while (cursor <= endDate) {
    const weekDays: (HeatmapDay | null)[] = [];
    let yearLabel: string | undefined;

    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const inRange = cursor >= first && cursor <= last;

      if (cursor.getDay() === 0 && cursor.getMonth() !== currentMonth) {
        currentMonth = cursor.getMonth();
        const monthLabel = cursor.toLocaleString('default', { month: 'short' });
        months.push({ label: monthLabel, weekIndex: weeks.length });
        if (cursor.getMonth() === 0) {
          yearLabel = String(cursor.getFullYear());
        }
      }

      weekDays.push(
        inRange ? { date: dateStr, count: byDate[dateStr] ?? 0 } : null
      );
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push({ days: weekDays, yearLabel });
  }

  return { weeks, months };
}

export function ReviewHeatmap({ data }: { data: HeatmapDay[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const [tooltip, setTooltip] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
    clampedX: number;
  } | null>(null);

  useEffect(() => {
    if (!tooltip || !tooltipRef.current) return;
    const tw = tooltipRef.current.offsetWidth;
    const vw = window.innerWidth;
    const clampedX = Math.min(Math.max(tooltip.x - tw / 2, 8), vw - tw - 8);
    if (clampedX !== tooltip.clampedX) {
      setTooltip((prev) => prev && { ...prev, clampedX });
    }
  }, [tooltip]);

  const max = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data]);
  const { weeks, months } = useMemo(() => buildWeeks(data), [data]);

  if (weeks.length === 0) {
    return (
      <p className="text-sm text-gray-400">No review activity to display.</p>
    );
  }

  const svgWidth = weeks.length * STEP;
  const svgHeight = 7 * STEP + 20; // 20px for day labels
  const MONTH_ROW_H = 14;
  const totalHeight = MONTH_ROW_H + svgHeight;

  return (
    <div ref={scrollRef} className="relative overflow-x-auto">
      <svg
        width={svgWidth + 28}
        height={totalHeight}
        style={{ display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Month labels */}
        {months.map((m) => (
          <text
            key={`${m.label}-${m.weekIndex}`}
            x={28 + m.weekIndex * STEP}
            y={10}
            fontSize={10}
            fill="currentColor"
            opacity={0.6}
          >
            {m.label}
          </text>
        ))}

        {/* Day labels */}
        {DAYS.map((label, i) => (
          <text
            key={i}
            x={20}
            y={MONTH_ROW_H + i * STEP + CELL - 1}
            fontSize={9}
            textAnchor="end"
            fill="currentColor"
            opacity={0.5}
          >
            {label}
          </text>
        ))}

        {/* Cells */}
        {weeks.map((week, wi) =>
          week.days.map((day, di) => {
            const x = 28 + wi * STEP;
            const y = MONTH_ROW_H + di * STEP;
            if (day === null) return null;
            return (
              <rect
                key={`${wi}-${di}`}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2}
                fill={getColor(day.count, max)}
                onMouseEnter={(e) => {
                  const rect = (
                    e.currentTarget as SVGRectElement
                  ).getBoundingClientRect();
                  const rawX = rect.left + CELL / 2;
                  setTooltip({
                    date: day.date,
                    count: day.count,
                    x: rawX,
                    y: rect.top,
                    clampedX: rawX,
                  });
                }}
              />
            );
          })
        )}
      </svg>

      {tooltip && (
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed z-50 rounded border border-gray-200 bg-white px-2 py-1 text-xs shadow dark:border-gray-700 dark:bg-gray-800"
          style={{
            left: tooltip.clampedX,
            top: tooltip.y - 36,
            whiteSpace: 'nowrap',
          }}
        >
          {tooltip.count === 0
            ? 'No reviews'
            : `${tooltip.count} review${tooltip.count > 1 ? 's' : ''}`}{' '}
          on{' '}
          {new Date(tooltip.date + 'T00:00:00').toLocaleDateString('default', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      )}
    </div>
  );
}
