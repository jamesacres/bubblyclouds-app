'use client';
import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatPence } from '../helpers/money';
import { useDarkMode } from '../hooks/useDarkMode';
import { SimulationResult } from '../types/simulation';
import { formatPenceCompact } from './NetWorthChart';
import { NetWorthMode } from './RealNominalToggle';
import { YearAgeAxisTick } from './YearAgeAxisTick';

const BAND_COLOR = '#38bdf8';
const MEDIAN_COLOR = '#38bdf8';

interface PercentilePathsChartProps {
  paths: SimulationResult['percentilePathsPence'];
  // Defaults to real (today's money); nominal restates each year with
  // (1 + infl)^yearOffset from the first path year.
  mode?: NetWorthMode;
  inflationRatePct?: number;
  // When set, each x-axis tick shows the owner's age at that year underneath.
  birthYear?: number;
}

const toDisplayPence = (
  realPence: number,
  mode: NetWorthMode,
  inflationRatePct: number,
  yearOffset: number
): number =>
  mode === 'nominal'
    ? Math.round(realPence * (1 + inflationRatePct / 100) ** yearOffset)
    : realPence;

interface PercentileRow {
  year: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  outerBase: number;
  outerBand: number;
  innerBase: number;
  innerBand: number;
}

const PERCENTILE_TOOLTIP_ROWS: {
  key: 'p95' | 'p75' | 'p50' | 'p25' | 'p5';
  label: string;
}[] = [
  { key: 'p95', label: '95th' },
  { key: 'p75', label: '75th' },
  { key: 'p50', label: 'Median' },
  { key: 'p25', label: '25th' },
  { key: 'p5', label: '5th' },
];

// Percentile paths of simulated wealth (spec §6.2): p5–p95 and p25–p75 bands
// via stacked areas (transparent base + band height), median line on top
const PercentilePathsChart = ({
  paths,
  mode = 'real',
  inflationRatePct = 0,
  birthYear,
}: PercentilePathsChartProps) => {
  const dark = useDarkMode();

  const rows = useMemo<PercentileRow[]>(() => {
    const baseYear = paths[0]?.year ?? 0;
    return paths.map((point) => {
      const offset = point.year - baseYear;
      const scale = (value: number): number =>
        toDisplayPence(value, mode, inflationRatePct, offset);
      const p5 = scale(point.p5);
      const p25 = scale(point.p25);
      const p50 = scale(point.p50);
      const p75 = scale(point.p75);
      const p95 = scale(point.p95);
      return {
        year: point.year,
        p5,
        p25,
        p50,
        p75,
        p95,
        outerBase: p5,
        outerBand: p95 - p5,
        innerBase: p25,
        innerBand: p75 - p25,
      };
    });
  }, [paths, mode, inflationRatePct]);

  if (rows.length === 0) {
    return (
      <div
        data-testid="percentile-paths-empty"
        className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
      >
        Run a simulation to see the range of outcomes year by year.
      </div>
    );
  }

  return (
    <div data-testid="percentile-paths-chart">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={rows}
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
            vertical={false}
          />
          <XAxis
            dataKey="year"
            tick={<YearAgeAxisTick birthYear={birthYear} />}
            tickLine={false}
            axisLine={false}
            height={birthYear !== undefined ? 34 : 20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={formatPenceCompact}
          />
          <Tooltip
            cursor={{ stroke: 'rgba(56,189,248,0.3)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row: PercentileRow = payload[0].payload;
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
                  <div style={{ fontWeight: 700 }}>{label}</div>
                  {PERCENTILE_TOOLTIP_ROWS.map(({ key, label: rowLabel }) => (
                    <div key={key}>
                      {rowLabel}
                      {': '}
                      {formatPence(row[key])}
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            dataKey="outerBase"
            stackId="outer"
            stroke="none"
            fill="none"
            legendType="none"
            tooltipType="none"
          />
          <Area
            dataKey="outerBand"
            name="5th–95th percentile"
            stackId="outer"
            stroke="none"
            fill={BAND_COLOR}
            fillOpacity={0.15}
          />
          <Area
            dataKey="innerBase"
            stackId="inner"
            stroke="none"
            fill="none"
            legendType="none"
            tooltipType="none"
          />
          <Area
            dataKey="innerBand"
            name="25th–75th percentile"
            stackId="inner"
            stroke="none"
            fill={BAND_COLOR}
            fillOpacity={0.3}
          />
          <Line
            type="monotone"
            dataKey="p50"
            name="Median"
            stroke={MEDIAN_COLOR}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PercentilePathsChart;
