import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { HouseholdAssumptions } from '../types/assumptions';
import { HouseholdData, HouseholdMonth } from '../types/household';
import { MonthId } from '../types/monthId';
import { MonthlySnapshotData, SnapshotAccount } from '../types/snapshot';
import NetWorthChart, {
  NetWorthChartLayers,
  formatPenceCompact,
} from './NetWorthChart';

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

const account = (
  accountId: string,
  kind: AccountKind,
  name: string,
  balancePence: number
): SnapshotAccount => ({
  accountId,
  kind,
  ...(kind === AccountKind.INVESTMENT
    ? { wrapper: InvestmentWrapper.ISA }
    : {}),
  name,
  balancePence,
});

const snapshot = (
  month: MonthId,
  accounts: SnapshotAccount[]
): MonthlySnapshotData => ({
  schemaVersion: 1,
  month,
  accounts,
  complete: true,
});

const buildHousehold = (monthIds: MonthId[]): HouseholdData => {
  const months: { [month: MonthId]: HouseholdMonth } = {};
  monthIds.forEach((month, index) => {
    months[month] = {
      month,
      memberSnapshots: {
        'user-1': snapshot(month, [
          account(
            'isa-1',
            AccountKind.INVESTMENT,
            'Stocks ISA',
            1_000_000 + index * 100_000
          ),
          account('cc-1', AccountKind.CREDIT_CARD, 'Credit card', 50_000),
        ]),
        'user-2': snapshot(month, [
          account('cash-1', AccountKind.CASH, 'Savings', 500_000),
        ]),
      },
      effectiveShared: {
        houseValuePence: 30_000_000,
        mortgageBalancePence: 10_000_000,
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      complete: true,
    };
  });
  return {
    partyId: 'party-1',
    members: [
      { userId: 'user-1', nickname: 'James', isUser: true },
      { userId: 'user-2', nickname: 'Alex', isUser: false },
    ],
    months,
    orderedMonths: monthIds,
    effectiveAssumptions: ASSUMPTIONS,
  };
};

const ALL_OFF: NetWorthChartLayers = {
  household: false,
  perMember: false,
  categories: false,
  accounts: false,
};

describe('NetWorthChart', () => {
  it('shows an empty state with no months', () => {
    render(
      <NetWorthChart
        household={buildHousehold([])}
        mode="nominal"
        layers={{ ...ALL_OFF, household: true }}
      />
    );
    expect(screen.getByTestId('net-worth-chart-empty')).toBeInTheDocument();
  });

  it('shows an empty state with fewer than two months', () => {
    render(
      <NetWorthChart
        household={buildHousehold(['2026-06'])}
        mode="nominal"
        layers={{ ...ALL_OFF, household: true }}
      />
    );
    expect(screen.getByTestId('net-worth-chart-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('net-worth-chart')).not.toBeInTheDocument();
  });

  it('renders the household line legend when the household layer is on', () => {
    render(
      <NetWorthChart
        household={buildHousehold(['2026-05', '2026-06', '2026-07'])}
        mode="nominal"
        layers={{ ...ALL_OFF, household: true }}
      />
    );
    expect(screen.getByTestId('net-worth-chart')).toBeInTheDocument();
    expect(screen.getByText('Household')).toBeInTheDocument();
    expect(screen.queryByText('James')).not.toBeInTheDocument();
    expect(screen.queryByText('Investments')).not.toBeInTheDocument();
  });

  it('renders per-member lines when the perMember layer is on', () => {
    render(
      <NetWorthChart
        household={buildHousehold(['2026-05', '2026-06'])}
        mode="nominal"
        layers={{ ...ALL_OFF, perMember: true }}
      />
    );
    expect(screen.getByText('James')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.queryByText('Household')).not.toBeInTheDocument();
  });

  it('renders stacked category areas when the categories layer is on', () => {
    render(
      <NetWorthChart
        household={buildHousehold(['2026-05', '2026-06'])}
        mode="nominal"
        layers={{ ...ALL_OFF, categories: true }}
      />
    );
    expect(screen.getByText('Investments')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('Property equity')).toBeInTheDocument();
    expect(screen.getByText('Credit cards')).toBeInTheDocument();
  });

  it('renders per-account lines labelled with member nicknames', () => {
    render(
      <NetWorthChart
        household={buildHousehold(['2026-05', '2026-06'])}
        mode="nominal"
        layers={{ ...ALL_OFF, accounts: true }}
      />
    );
    expect(screen.getByText('James: Stocks ISA')).toBeInTheDocument();
    expect(screen.getByText('James: Credit card')).toBeInTheDocument();
    expect(screen.getByText('Alex: Savings')).toBeInTheDocument();
  });

  it('labels the active mode on the chart', () => {
    const household = buildHousehold(['2026-05', '2026-06']);
    const { rerender } = render(
      <NetWorthChart
        household={household}
        mode="nominal"
        layers={{ ...ALL_OFF, household: true }}
      />
    );
    expect(screen.getByTestId('net-worth-chart-mode')).toHaveTextContent(
      'Showing nominal values (as recorded)'
    );
    rerender(
      <NetWorthChart
        household={household}
        mode="real"
        layers={{ ...ALL_OFF, household: true }}
      />
    );
    expect(screen.getByTestId('net-worth-chart-mode')).toHaveTextContent(
      "Showing real values (today's money)"
    );
  });

  describe('formatPenceCompact', () => {
    it('formats thousands and millions of pounds compactly', () => {
      expect(formatPenceCompact(25_000_000)).toBe('£250k');
      expect(formatPenceCompact(120_000_000)).toBe('£1.2m');
      expect(formatPenceCompact(150_000)).toBe('£1.5k');
      expect(formatPenceCompact(100_000)).toBe('£1k');
      expect(formatPenceCompact(50_000)).toBe('£500');
      expect(formatPenceCompact(0)).toBe('£0');
      expect(formatPenceCompact(-25_000_000)).toBe('-£250k');
    });
  });
});
