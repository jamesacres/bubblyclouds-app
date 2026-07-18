import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ProjectionPoint } from '../engine/projection';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { HouseholdAssumptions } from '../types/assumptions';
import { HouseholdData, HouseholdMonth } from '../types/household';
import { MonthId } from '../types/monthId';
import { ContributionPlan } from '../types/profile';
import { MonthlySnapshotData } from '../types/snapshot';
import FanChart, { firstCrossing } from './FanChart';

// recharts' ResponsiveContainer measures 0x0 in jsdom, which stops the chart
// (axes, legend, series) from rendering. Replace it with a fixed-size pass-
// through so chart internals mount — the pattern for recharts tests.
jest.mock('recharts', () => {
  const actual = jest.requireActual<typeof import('recharts')>('recharts');
  const { cloneElement } = jest.requireActual<typeof import('react')>('react');
  return {
    ...actual,
    ResponsiveContainer: ({
      children,
    }: {
      children: ReactElement<{ width?: number; height?: number }>;
    }) => cloneElement(children, { width: 800, height: 400 }),
  };
});

const ASSUMPTIONS: HouseholdAssumptions = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: [],
  statePensionAnnualPence: 0,
  targetSuccessRatePct: 90,
};

const EMPTY_PLAN: ContributionPlan = {
  monthlyPencePerWrapper: {},
  stepChanges: [],
};

const snapshot = (
  month: MonthId,
  balancePence: number
): MonthlySnapshotData => ({
  schemaVersion: 1,
  month,
  accounts: [
    {
      accountId: 'isa-1',
      kind: AccountKind.INVESTMENT,
      wrapper: InvestmentWrapper.ISA,
      name: 'Stocks ISA',
      balancePence,
    },
    {
      accountId: 'cash-1',
      kind: AccountKind.CASH,
      name: 'Savings',
      balancePence: 500_000,
    },
  ],
  complete: true,
});

const buildHousehold = (monthIds: MonthId[]): HouseholdData => {
  const months: { [month: MonthId]: HouseholdMonth } = {};
  monthIds.forEach((month, index) => {
    months[month] = {
      month,
      memberSnapshots: {
        'user-1': snapshot(month, 1_000_000 + index * 100_000),
      },
      effectiveShared: undefined,
      complete: true,
    };
  });
  return {
    partyId: 'party-1',
    members: [
      {
        userId: 'user-1',
        nickname: 'James',
        isUser: true,
        profile: {
          schemaVersion: 1,
          accounts: [],
          contributions: {
            monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 50_000 },
            stepChanges: [],
          },
          overrides: {},
        },
      },
    ],
    months,
    orderedMonths: monthIds,
    effectiveAssumptions: ASSUMPTIONS,
  };
};

describe('FanChart', () => {
  it('shows an empty state when there are no snapshots', () => {
    render(
      <FanChart
        household={buildHousehold([])}
        mode="nominal"
        horizonMonths={12}
      />
    );
    expect(screen.getByTestId('fan-chart-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('fan-chart')).not.toBeInTheDocument();
  });

  it('renders the actuals line and the three scenario lines', () => {
    render(
      <FanChart
        household={buildHousehold(['2026-05', '2026-06', '2026-07'])}
        mode="nominal"
        horizonMonths={24}
      />
    );
    expect(screen.getByTestId('fan-chart')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('Lower')).toBeInTheDocument();
    expect(screen.getByText('Central')).toBeInTheDocument();
    expect(screen.getByText('Upper')).toBeInTheDocument();
  });

  it('labels the active mode on the chart', () => {
    const household = buildHousehold(['2026-06', '2026-07']);
    const { rerender } = render(
      <FanChart household={household} mode="real" horizonMonths={12} />
    );
    expect(screen.getByTestId('fan-chart-mode')).toHaveTextContent(
      "Showing real values (today's money)"
    );
    rerender(
      <FanChart household={household} mode="nominal" horizonMonths={12} />
    );
    expect(screen.getByTestId('fan-chart-mode')).toHaveTextContent(
      'Showing nominal values (as recorded)'
    );
  });

  it('marks the FIRE milestone when one is set', () => {
    render(
      <FanChart
        household={buildHousehold(['2026-06', '2026-07'])}
        mode="nominal"
        horizonMonths={12}
        milestonePence={1_200_000}
      />
    );
    expect(screen.getByText('FIRE £12k')).toBeInTheDocument();
  });

  it('renders with contribution overrides replacing a member plan', () => {
    render(
      <FanChart
        household={buildHousehold(['2026-06', '2026-07'])}
        mode="nominal"
        horizonMonths={12}
        contributionOverrides={{ 'user-1': EMPTY_PLAN }}
      />
    );
    expect(screen.getByTestId('fan-chart')).toBeInTheDocument();
  });

  describe('firstCrossing', () => {
    const point = (
      monthIndex: number,
      centralPence: number
    ): ProjectionPoint => ({
      monthIndex,
      month: `2026-${String(monthIndex + 1).padStart(2, '0')}`,
      lowerPence: centralPence - 100,
      centralPence,
      upperPence: centralPence + 100,
    });

    it('finds the first point at or above the milestone per scenario', () => {
      const points = [point(0, 900), point(1, 1_000), point(2, 1_100)];
      expect(firstCrossing(points, 'centralPence', 1_000)?.monthIndex).toBe(1);
      expect(firstCrossing(points, 'upperPence', 1_000)?.monthIndex).toBe(0);
      expect(firstCrossing(points, 'lowerPence', 1_000)?.monthIndex).toBe(2);
    });

    it('is undefined when the milestone is never reached', () => {
      expect(
        firstCrossing([point(0, 900)], 'upperPence', 10_000)
      ).toBeUndefined();
    });
  });
});
