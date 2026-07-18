'use client';
import { useMemo } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  monthlyRateFromAnnualPct,
  ProjectionMember,
  ProjectionPoint,
  projectInvestments,
} from '../engine/projection';
import { formatPence } from '../helpers/money';
import { monthIdToLabel, monthsBetween } from '../helpers/monthId';
import { categoryBreakdownPence } from '../helpers/networth';
import { useDarkMode } from '../hooks/useDarkMode';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { HouseholdData } from '../types/household';
import { MonthId } from '../types/monthId';
import { ContributionPlan } from '../types/profile';
import { formatPenceCompact } from './NetWorthChart';
import { modeLabel, NetWorthMode } from './RealNominalToggle';

const ACTUAL_COLOR = '#818cf8';
const MILESTONE_COLOR = '#f472b6';

type ScenarioKey = 'lower' | 'central' | 'upper';
const SCENARIO_KEYS: ScenarioKey[] = ['lower', 'central', 'upper'];
const SCENARIO_COLORS: { [key in ScenarioKey]: string } = {
  lower: '#fbbf24',
  central: '#38bdf8',
  upper: '#34d399',
};
const SCENARIO_LABELS: { [key in ScenarioKey]: string } = {
  lower: 'Lower',
  central: 'Central',
  upper: 'Upper',
};
const SCENARIO_POINT_KEYS: {
  [key in ScenarioKey]: 'lowerPence' | 'centralPence' | 'upperPence';
} = {
  lower: 'lowerPence',
  central: 'centralPence',
  upper: 'upperPence',
};

// First projection point at which the scenario reaches the milestone
export const firstCrossing = (
  points: ProjectionPoint[],
  key: 'lowerPence' | 'centralPence' | 'upperPence',
  milestonePence: number
): ProjectionPoint | undefined =>
  points.find((point) => point[key] >= milestonePence);

interface FanChartProps {
  household: HouseholdData;
  mode: NetWorthMode;
  horizonMonths: number;
  // Per-user replacement for that member's profile contribution plan, e.g.
  // unsaved edits on the projection screen
  contributionOverrides?: { [userId: string]: ContributionPlan };
  // FIRE-number milestone: horizontal reference plus a first-crossing marker
  // per scenario
  milestonePence?: number;
}

// Historical household-investments actuals followed by the three deterministic
// projection scenarios (spec §5.3), combining every member's contributions
const FanChart = ({
  household,
  mode,
  horizonMonths,
  contributionOverrides,
  milestonePence,
}: FanChartProps) => {
  const dark = useDarkMode();
  const assumptions = household.effectiveAssumptions;

  // Months with at least one member snapshot; the projection starts from the
  // latest of them
  const snapshotMonths = useMemo(
    () =>
      household.orderedMonths.filter((month) =>
        Object.values(household.months[month]?.memberSnapshots ?? {}).some(
          (snapshot) => snapshot !== undefined
        )
      ),
    [household]
  );
  const startMonth: MonthId | undefined =
    snapshotMonths[snapshotMonths.length - 1];

  const projection = useMemo(() => {
    if (startMonth === undefined) {
      return [];
    }
    const monthsNewestFirst = [...snapshotMonths].reverse();
    const members: ProjectionMember[] = household.members.map((member) => {
      const latestSnapshot = monthsNewestFirst
        .map((month) => household.months[month]?.memberSnapshots[member.userId])
        .find((snapshot) => snapshot !== undefined);
      const balancesPencePerWrapper: Partial<
        Record<InvestmentWrapper, number>
      > = {};
      for (const account of latestSnapshot?.accounts ?? []) {
        if (account.kind !== AccountKind.INVESTMENT) {
          continue;
        }
        const wrapper = account.wrapper ?? InvestmentWrapper.OTHER;
        balancesPencePerWrapper[wrapper] =
          (balancesPencePerWrapper[wrapper] ?? 0) + account.balancePence;
      }
      return {
        balancesPencePerWrapper,
        contributions: contributionOverrides?.[member.userId] ??
          member.profile?.contributions ?? {
            monthlyPencePerWrapper: {},
            stepChanges: [],
          },
      };
    });
    return projectInvestments({
      members,
      startMonth,
      horizonMonths,
      scenarios: assumptions.returnScenarios,
      mode,
      inflationRatePct: assumptions.inflationRatePct,
    });
  }, [
    assumptions,
    contributionOverrides,
    horizonMonths,
    household,
    mode,
    snapshotMonths,
    startMonth,
  ]);

  const rows = useMemo(() => {
    if (startMonth === undefined) {
      return [];
    }
    // Historical actuals restate to start-month money in real mode, matching
    // the projection's real-rate values
    const monthlyInflationFactor =
      1 + monthlyRateFromAnnualPct(assumptions.inflationRatePct);
    const historyRows = snapshotMonths
      .filter((month) => month !== startMonth)
      .flatMap((month) => {
        const householdMonth = household.months[month];
        if (!householdMonth) {
          return [];
        }
        const factor =
          mode === 'real'
            ? monthlyInflationFactor ** monthsBetween(month, startMonth)
            : 1;
        return [
          {
            month,
            label: monthIdToLabel(month),
            actual: Math.round(
              categoryBreakdownPence(householdMonth).investments * factor
            ),
          },
        ];
      });
    const projectionRows = projection.map((point) => ({
      month: point.month,
      label: monthIdToLabel(point.month),
      // The projection's first point is the latest actual balance, so the
      // actuals line connects to the fan
      ...(point.monthIndex === 0 ? { actual: point.centralPence } : {}),
      lower: point.lowerPence,
      central: point.centralPence,
      upper: point.upperPence,
    }));
    return [...historyRows, ...projectionRows];
  }, [assumptions, household, mode, projection, snapshotMonths, startMonth]);

  const crossings = useMemo(() => {
    if (milestonePence === undefined || milestonePence <= 0) {
      return [];
    }
    return SCENARIO_KEYS.flatMap((scenario) => {
      const point = firstCrossing(
        projection,
        SCENARIO_POINT_KEYS[scenario],
        milestonePence
      );
      return point
        ? [
            {
              scenario,
              label: monthIdToLabel(point.month),
              value: point[SCENARIO_POINT_KEYS[scenario]],
            },
          ]
        : [];
    });
  }, [milestonePence, projection]);

  if (startMonth === undefined) {
    return (
      <div
        data-testid="fan-chart-empty"
        className="rounded-2xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
      >
        Enter at least one month of balances to project your investments.
      </div>
    );
  }

  return (
    <div data-testid="fan-chart">
      <p
        data-testid="fan-chart-mode"
        className="mb-2 text-xs font-semibold text-zinc-500 dark:text-white/50"
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
            minTickGap={32}
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
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke={ACTUAL_COLOR}
            strokeWidth={2}
            dot={false}
          />
          {SCENARIO_KEYS.map((scenario) => (
            <Line
              key={scenario}
              type="monotone"
              dataKey={scenario}
              name={SCENARIO_LABELS[scenario]}
              stroke={SCENARIO_COLORS[scenario]}
              strokeWidth={scenario === 'central' ? 2 : 1}
              strokeDasharray={scenario === 'central' ? undefined : '4 3'}
              dot={false}
            />
          ))}
          {milestonePence !== undefined && milestonePence > 0 && (
            <ReferenceLine
              y={milestonePence}
              stroke={MILESTONE_COLOR}
              strokeDasharray="6 4"
              label={{
                value: `FIRE ${formatPenceCompact(milestonePence)}`,
                fill: MILESTONE_COLOR,
                fontSize: 11,
                position: 'insideTopRight',
              }}
            />
          )}
          {crossings.map((crossing) => (
            <ReferenceDot
              key={crossing.scenario}
              x={crossing.label}
              y={crossing.value}
              r={4}
              fill={SCENARIO_COLORS[crossing.scenario]}
              stroke={dark ? '#0f172a' : '#ffffff'}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FanChart;
