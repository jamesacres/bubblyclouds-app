import { render, screen, fireEvent } from '@testing-library/react';
import {
  currentMonthId,
  previousMonthId,
} from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import { NetWorthChartLayers } from '@bubblyclouds-app/moneybagsrace/components/NetWorthChart';
import { HouseholdData } from '@bubblyclouds-app/moneybagsrace/types/household';
import { MonthlySnapshotData } from '@bubblyclouds-app/moneybagsrace/types/snapshot';
import { AccountKind } from '@bubblyclouds-app/moneybagsrace/types/accounts';
import HistoryPage from './page';

jest.mock('@bubblyclouds-app/moneybagsrace/hooks/useHousehold', () => ({
  useHousehold: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/components/NetWorthChart', () => ({
  __esModule: true,
  default: function MockNetWorthChart({
    mode,
    layers,
  }: {
    mode: string;
    layers: NetWorthChartLayers;
  }) {
    return (
      <div
        data-testid="net-worth-chart-stub"
        data-mode={mode}
        data-layers={JSON.stringify(layers)}
      />
    );
  },
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
}));

const ASSUMPTIONS = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: [],
  statePensionAnnualPence: 0,
  targetSuccessRatePct: 90,
};

const snapshot = (
  month: string,
  balancePence: number
): MonthlySnapshotData => ({
  schemaVersion: 1,
  month,
  accounts: [
    {
      accountId: 'isa-1',
      kind: AccountKind.INVESTMENT,
      name: 'Stocks ISA',
      balancePence,
    },
  ],
  complete: true,
});

const emptyHousehold = (): HouseholdData => ({
  partyId: undefined,
  members: [{ userId: 'user-1', nickname: 'James', isUser: true }],
  months: {},
  orderedMonths: [],
  effectiveAssumptions: ASSUMPTIONS,
});

const householdWithTwoMonths = (): HouseholdData => {
  const month = currentMonthId();
  const previous = previousMonthId(month);
  return {
    partyId: 'party-1',
    members: [{ userId: 'user-1', nickname: 'James', isUser: true }],
    months: {
      [previous]: {
        month: previous,
        memberSnapshots: { 'user-1': snapshot(previous, 1_000_000) },
        effectiveShared: undefined,
        complete: true,
      },
      [month]: {
        month,
        memberSnapshots: { 'user-1': snapshot(month, 1_100_000) },
        effectiveShared: undefined,
        complete: true,
      },
    },
    orderedMonths: [previous, month],
    effectiveAssumptions: ASSUMPTIONS,
  };
};

const mockUseHousehold = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/hooks/useHousehold'
).useHousehold as jest.Mock;

const chartLayers = (): NetWorthChartLayers =>
  JSON.parse(
    screen.getByTestId('net-worth-chart-stub').getAttribute('data-layers') ??
      '{}'
  );

describe('History Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHousehold.mockReturnValue({ household: householdWithTwoMonths() });
  });

  it('shows an empty state with a CTA to enter the first month', () => {
    mockUseHousehold.mockReturnValue({ household: emptyHousehold() });
    render(<HistoryPage />);
    expect(screen.getByTestId('history-empty')).toBeInTheDocument();
    expect(
      screen.getByText('Enter your first month').closest('a')
    ).toHaveAttribute('href', `/state?month=${currentMonthId()}`);
    expect(
      screen.queryByTestId('net-worth-chart-stub')
    ).not.toBeInTheDocument();
  });

  it('renders the chart with only the household layer by default', () => {
    render(<HistoryPage />);
    expect(chartLayers()).toEqual({
      household: true,
      perMember: false,
      categories: false,
      accounts: false,
    });
    expect(screen.getByTestId('net-worth-chart-stub')).toHaveAttribute(
      'data-mode',
      'nominal'
    );
  });

  it('toggles chart layers with the chips', () => {
    render(<HistoryPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Per member' }));
    fireEvent.click(screen.getByRole('button', { name: 'Categories' }));
    expect(chartLayers()).toEqual({
      household: true,
      perMember: true,
      categories: true,
      accounts: false,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Household' }));
    expect(chartLayers().household).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Accounts' }));
    expect(chartLayers().accounts).toBe(true);
  });

  it('switches between real and nominal modes with a visible label', () => {
    render(<HistoryPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Real' }));
    expect(screen.getByTestId('net-worth-chart-stub')).toHaveAttribute(
      'data-mode',
      'real'
    );
    expect(screen.getByTestId('real-nominal-label')).toHaveTextContent(
      "Showing real values (today's money)"
    );
    fireEvent.click(screen.getByRole('button', { name: 'Nominal' }));
    expect(screen.getByTestId('net-worth-chart-stub')).toHaveAttribute(
      'data-mode',
      'nominal'
    );
  });

  it('shows month-on-month, 12-month and all-time stat cards', () => {
    render(<HistoryPage />);
    expect(screen.getByText('Month on month')).toBeInTheDocument();
    expect(screen.getByText('12 months')).toBeInTheDocument();
    expect(screen.getByText('All time')).toBeInTheDocument();
    // Only two months of history: MoM has a change, 12-month does not
    const changes = screen.getAllByTestId('stat-card-change');
    expect(changes).toHaveLength(2); // month-on-month + all-time
    expect(changes[0]).toHaveTextContent('+£1,000.00 (+10.0%)');
  });

  it('links back to the dashboard', () => {
    render(<HistoryPage />);
    expect(screen.getByLabelText('Back to dashboard')).toHaveAttribute(
      'href',
      '/'
    );
  });
});
