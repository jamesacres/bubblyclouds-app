'use client';
import { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
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

const BAND_COLOR = '#60a5fa';
const MEDIAN_COLOR = '#2563eb';
const TARGET_COLOR = '#f59e0b';
const SHORTFALL_COLOR = '#ef4444';

interface IncomeVsTargetChartProps {
  // Per-year net income delivered each withdrawal year
  // (SimulationResult.incomePathsPence for the household, or a member's own).
  paths: SimulationResult['incomePathsPence'];
  // The desired real annual withdrawal this run targeted (today's money).
  targetPence: number;
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

interface IncomeRow {
  year: number;
  target: number;
  p5: number;
  p25: number;
  p50: number;
  p75: number;
  p95: number;
  outerBase: number;
  outerBand: number;
  innerBase: number;
  innerBand: number;
  belowTarget: boolean;
}

// Contiguous [startYear, endYear] spans where the median income fell below the
// target; each becomes a shaded reference area on the chart.
interface ShortfallSpan {
  startYear: number;
  endYear: number;
}

const INCOME_TOOLTIP_ROWS: {
  key: 'p95' | 'p75' | 'p50' | 'p25' | 'p5';
  label: string;
}[] = [
  { key: 'p95', label: '95th' },
  { key: 'p75', label: '75th' },
  { key: 'p50', label: 'Median' },
  { key: 'p25', label: '25th' },
  { key: 'p5', label: '5th' },
];

// Per-year net income delivered against the desired spend (real terms): the
// p5–p95 and p25–p75 bands with the median income line, a dashed target line,
// and shaded years where the median income fell short of the target.
const IncomeVsTargetChart = ({
  paths,
  targetPence,
  mode = 'real',
  inflationRatePct = 0,
  birthYear,
}: IncomeVsTargetChartProps) => {
  const dark = useDarkMode();

  const rows = useMemo<IncomeRow[]>(() => {
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
      const target = scale(targetPence);
      return {
        year: point.year,
        target,
        p5,
        p25,
        p50,
        p75,
        p95,
        outerBase: p5,
        outerBand: p95 - p5,
        innerBase: p25,
        innerBand: p75 - p25,
        belowTarget: p50 < target,
      };
    });
  }, [paths, targetPence, mode, inflationRatePct]);

  const shortfallSpans = useMemo<ShortfallSpan[]>(() => {
    const spans: ShortfallSpan[] = [];
    let open: ShortfallSpan | undefined;
    for (const row of rows) {
      if (row.belowTarget) {
        if (open) {
          open.endYear = row.year;
        } else {
          open = { startYear: row.year, endYear: row.year };
        }
      } else if (open) {
        spans.push(open);
        open = undefined;
      }
    }
    if (open) {
      spans.push(open);
    }
    return spans;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div
        data-testid="income-vs-target-empty"
        className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
      >
        Run a simulation to see each year&apos;s income against the target.
      </div>
    );
  }

  const shortfallYearCount = rows.filter((row) => row.belowTarget).length;

  return (
    <div data-testid="income-vs-target-chart">
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
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={<YearAgeAxisTick birthYear={birthYear} />}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            height={birthYear !== undefined ? 34 : 20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={formatPenceCompact}
          />
          {shortfallSpans.map((span) => (
            <ReferenceArea
              key={`${span.startYear}-${span.endYear}`}
              x1={span.startYear}
              x2={span.endYear}
              fill={SHORTFALL_COLOR}
              fillOpacity={0.12}
              ifOverflow="extendDomain"
            />
          ))}
          <Tooltip
            cursor={{ stroke: 'rgba(37,99,235,0.3)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row: IncomeRow = payload[0].payload;
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
                  <div style={{ color: TARGET_COLOR }}>
                    Target: {formatPence(row.target)}
                  </div>
                  {INCOME_TOOLTIP_ROWS.map(({ key, label: rowLabel }) => (
                    <div key={key}>
                      {rowLabel}
                      {': '}
                      {formatPence(row[key])}
                    </div>
                  ))}
                  {row.belowTarget && (
                    <div style={{ color: SHORTFALL_COLOR, fontWeight: 600 }}>
                      Median below target
                    </div>
                  )}
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
            name="Median income"
            stroke={MEDIAN_COLOR}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target spend"
            stroke={TARGET_COLOR}
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      {shortfallYearCount > 0 && (
        <p
          data-testid="income-vs-target-shortfall"
          className="mt-1 text-[10px] text-zinc-400 dark:text-white/35"
        >
          Shaded years: median income below the {formatPence(targetPence)}{' '}
          target ({shortfallYearCount}{' '}
          {shortfallYearCount === 1 ? 'year' : 'years'}).
        </p>
      )}
    </div>
  );
};

export default IncomeVsTargetChart;
