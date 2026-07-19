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
import { modeLabel, NetWorthMode } from './RealNominalToggle';
import { YearAgeAxisTick } from './YearAgeAxisTick';

const PATH_COLOR = '#38bdf8';
const MEDIAN_COLOR = '#0ea5e9';
const BAND_COLOR = '#38bdf8';

interface MonteCarloPathsChartProps {
  paths: SimulationResult['percentilePathsPence'];
  sampledPaths: SimulationResult['sampledPathsPence'];
  mode: NetWorthMode;
  // Real values restate to nominal (future pounds) with (1 + infl)^yearOffset,
  // where the offset counts calendar years from the retirement year.
  inflationRatePct: number;
  // When set, each x-axis tick shows the owner's age at that year underneath.
  birthYear?: number;
}

interface ChartRow {
  year: number;
  outerBase: number;
  outerBand: number;
  median: number;
  [runKey: `run${number}`]: number;
}

// Restate a real (today's-money) value into nominal future pounds for a given
// number of years after retirement.
const toDisplayPence = (
  realPence: number,
  mode: NetWorthMode,
  inflationRatePct: number,
  yearOffset: number
): number =>
  mode === 'nominal'
    ? Math.round(realPence * (1 + inflationRatePct / 100) ** yearOffset)
    : realPence;

const MonteCarloPathsChart = ({
  paths,
  sampledPaths,
  mode,
  inflationRatePct,
  birthYear,
}: MonteCarloPathsChartProps) => {
  const dark = useDarkMode();

  const rows = useMemo<ChartRow[]>(() => {
    const baseYear = paths[0]?.year ?? 0;
    return paths.map((point, yearIndex) => {
      const offset = point.year - baseYear;
      const row: ChartRow = {
        year: point.year,
        outerBase: toDisplayPence(point.p5, mode, inflationRatePct, offset),
        outerBand: toDisplayPence(
          point.p95 - point.p5,
          mode,
          inflationRatePct,
          offset
        ),
        median: toDisplayPence(point.p50, mode, inflationRatePct, offset),
      };
      for (const sampled of sampledPaths) {
        const runValue = sampled.totalsPence[yearIndex];
        if (runValue !== undefined) {
          row[`run${sampled.runIndex}`] = toDisplayPence(
            runValue,
            mode,
            inflationRatePct,
            offset
          );
        }
      }
      return row;
    });
  }, [paths, sampledPaths, mode, inflationRatePct]);

  if (rows.length === 0) {
    return (
      <div
        data-testid="monte-carlo-paths-empty"
        className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
      >
        Run a simulation to see individual outcome paths.
      </div>
    );
  }

  return (
    <div data-testid="monte-carlo-paths-chart">
      <p
        data-testid="monte-carlo-paths-mode"
        className="mb-1 text-xs font-semibold text-zinc-500 dark:text-white/50"
      >
        {modeLabel(mode)}
      </p>
      <p
        data-testid="monte-carlo-paths-count"
        className="mb-2 text-xs text-zinc-400 dark:text-white/40"
      >
        {sampledPaths.length} simulated paths
      </p>
      <ResponsiveContainer width="100%" height={320}>
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
              const row = payload[0].payload as ChartRow;
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
                  <div>Median: {formatPence(row.median)}</div>
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
            isAnimationActive={false}
          />
          <Area
            dataKey="outerBand"
            name="5th–95th percentile"
            stackId="outer"
            stroke="none"
            fill={BAND_COLOR}
            fillOpacity={0.12}
            tooltipType="none"
            isAnimationActive={false}
          />
          {sampledPaths.map((sampled) => (
            <Line
              key={sampled.runIndex}
              type="monotone"
              dataKey={`run${sampled.runIndex}`}
              stroke={PATH_COLOR}
              strokeWidth={1}
              strokeOpacity={0.12}
              dot={false}
              legendType="none"
              tooltipType="none"
              isAnimationActive={false}
            />
          ))}
          <Line
            type="monotone"
            dataKey="median"
            name="Median"
            stroke={MEDIAN_COLOR}
            strokeWidth={2.5}
            dot={false}
            tooltipType="none"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonteCarloPathsChart;
