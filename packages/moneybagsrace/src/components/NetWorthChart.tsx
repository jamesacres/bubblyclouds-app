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
import { monthlyRateFromAnnualPct } from '../engine/projection';
import { formatPence } from '../helpers/money';
import { monthIdToLabel, monthsBetween } from '../helpers/monthId';
import {
  buildNetWorthSeries,
  categoryBreakdownPence,
} from '../helpers/networth';
import { useDarkMode } from '../hooks/useDarkMode';
import { AccountKind } from '../types/accounts';
import { HouseholdData } from '../types/household';
import { modeLabel, NetWorthMode } from './RealNominalToggle';

export interface NetWorthChartLayers {
  household: boolean;
  perMember: boolean;
  categories: boolean;
  accounts: boolean;
}

interface NetWorthChartProps {
  household: HouseholdData;
  mode: NetWorthMode;
  layers: NetWorthChartLayers;
}

const HOUSEHOLD_COLOR = '#38bdf8';
const MEMBER_COLORS = ['#a78bfa', '#f472b6', '#34d399', '#fbbf24'];
const ACCOUNT_COLORS = [
  '#60a5fa',
  '#c084fc',
  '#2dd4bf',
  '#fb923c',
  '#f472b6',
  '#a3e635',
];
const CATEGORY_COLORS: { [key in CategoryKey]: string } = {
  investments: '#818cf8',
  cash: '#34d399',
  propertyEquity: '#fbbf24',
  creditCards: '#f87171',
};
const CATEGORY_LABELS: { [key in CategoryKey]: string } = {
  investments: 'Investments',
  cash: 'Cash',
  propertyEquity: 'Property equity',
  creditCards: 'Credit cards',
};

type CategoryKey = 'investments' | 'cash' | 'propertyEquity' | 'creditCards';
const CATEGORY_KEYS: CategoryKey[] = [
  'investments',
  'cash',
  'propertyEquity',
  'creditCards',
];

// Compact currency for axis ticks, e.g. £250k / £1.2m
export const formatPenceCompact = (pence: number): string => {
  const pounds = pence / 100;
  const sign = pounds < 0 ? '-' : '';
  const abs = Math.abs(pounds);
  const trim = (value: number): string =>
    (value >= 100 ? Math.round(value).toString() : value.toFixed(1)).replace(
      /\.0$/,
      ''
    );
  if (abs >= 1_000_000) {
    return `${sign}£${trim(abs / 1_000_000)}m`;
  }
  if (abs >= 1_000) {
    return `${sign}£${trim(abs / 1_000)}k`;
  }
  return `${sign}£${Math.round(abs)}`;
};

interface AccountSeriesKey {
  dataKey: string;
  label: string;
}

// Credit cards are owed money: they plot negative so the layers visually sum
// towards the household line.
const signedBalancePence = (kind: AccountKind, balancePence: number): number =>
  kind === AccountKind.CREDIT_CARD ? -balancePence : balancePence;

const NetWorthChart = ({ household, mode, layers }: NetWorthChartProps) => {
  const dark = useDarkMode();
  const inflationRatePct = household.effectiveAssumptions.inflationRatePct;

  const series = useMemo(
    () => buildNetWorthSeries(household, mode, inflationRatePct),
    [household, inflationRatePct, mode]
  );

  const memberKeys = useMemo(
    () =>
      household.members.map((member) => ({
        dataKey: `member_${member.userId}`,
        label: member.nickname,
        userId: member.userId,
      })),
    [household.members]
  );

  // Per-account series derived from snapshots; keys discovered in first-seen
  // order across ordered months so lines keep a stable identity.
  const accountKeys = useMemo<AccountSeriesKey[]>(() => {
    const seen = new Map<string, AccountSeriesKey>();
    for (const month of household.orderedMonths) {
      const householdMonth = household.months[month];
      for (const member of household.members) {
        const snapshot = householdMonth?.memberSnapshots[member.userId];
        for (const account of snapshot?.accounts ?? []) {
          const dataKey = `account_${member.userId}_${account.accountId}`;
          if (!seen.has(dataKey)) {
            seen.set(dataKey, {
              dataKey,
              label:
                household.members.length > 1
                  ? `${member.nickname}: ${account.name}`
                  : account.name,
            });
          }
        }
      }
    }
    return [...seen.values()];
  }, [household]);

  const rows = useMemo(() => {
    const latestMonth =
      household.orderedMonths[household.orderedMonths.length - 1];
    const monthlyInflationFactor =
      1 + monthlyRateFromAnnualPct(inflationRatePct);
    return series.map((point) => {
      const factor =
        mode === 'real'
          ? monthlyInflationFactor ** monthsBetween(point.month, latestMonth)
          : 1;
      const row: { [key: string]: number | string } = {
        month: point.month,
        label: monthIdToLabel(point.month),
        household: point.householdPence,
      };
      for (const memberKey of memberKeys) {
        const value = point.perMemberPence[memberKey.userId];
        if (value !== undefined) {
          row[memberKey.dataKey] = value;
        }
      }
      const householdMonth = household.months[point.month];
      if (householdMonth) {
        const breakdown = categoryBreakdownPence(householdMonth);
        row.investments = Math.round(breakdown.investments * factor);
        row.cash = Math.round(breakdown.cash * factor);
        row.propertyEquity = Math.round(breakdown.propertyEquity * factor);
        row.creditCards = Math.round(-breakdown.creditCards * factor);
        for (const member of household.members) {
          const snapshot = householdMonth.memberSnapshots[member.userId];
          for (const account of snapshot?.accounts ?? []) {
            row[`account_${member.userId}_${account.accountId}`] = Math.round(
              signedBalancePence(account.kind, account.balancePence) * factor
            );
          }
        }
      }
      return row;
    });
  }, [household, inflationRatePct, memberKeys, mode, series]);

  if (series.length < 2) {
    return (
      <div
        data-testid="net-worth-chart-empty"
        className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60"
      >
        Add at least two months of balances to see your net-worth history.
      </div>
    );
  }

  return (
    <div data-testid="net-worth-chart">
      <p
        data-testid="net-worth-chart-mode"
        className="mb-2 text-xs font-semibold text-white/50"
      >
        {modeLabel(mode)}
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
            dataKey="label"
            tick={{ fontSize: 11, fill: 'currentColor' }}
            tickLine={false}
            axisLine={false}
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
                  {payload.map((entry) => (
                    <div key={entry.dataKey?.toString()}>
                      <span style={{ color: entry.color }}>{entry.name}</span>
                      {': '}
                      {typeof entry.value === 'number'
                        ? formatPence(entry.value)
                        : ''}
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {layers.categories &&
            CATEGORY_KEYS.map((key) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={CATEGORY_LABELS[key]}
                stackId="categories"
                stroke={CATEGORY_COLORS[key]}
                fill={CATEGORY_COLORS[key]}
                fillOpacity={0.25}
              />
            ))}
          {layers.accounts &&
            accountKeys.map((accountKey, index) => (
              <Line
                key={accountKey.dataKey}
                type="monotone"
                dataKey={accountKey.dataKey}
                name={accountKey.label}
                stroke={ACCOUNT_COLORS[index % ACCOUNT_COLORS.length]}
                strokeWidth={1}
                dot={false}
                connectNulls
              />
            ))}
          {layers.perMember &&
            memberKeys.map((memberKey, index) => (
              <Line
                key={memberKey.dataKey}
                type="monotone"
                dataKey={memberKey.dataKey}
                name={memberKey.label}
                stroke={MEMBER_COLORS[index % MEMBER_COLORS.length]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ))}
          {layers.household && (
            <Line
              type="monotone"
              dataKey="household"
              name="Household"
              stroke={HOUSEHOLD_COLOR}
              strokeWidth={3}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default NetWorthChart;
