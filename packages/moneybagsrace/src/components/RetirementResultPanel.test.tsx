import { render, screen } from '@testing-library/react';
import {
  FailureKind,
  MemberBreakdown,
  SimulationResult,
} from '../types/simulation';
import RetirementResultPanel, {
  successColorClass,
} from './RetirementResultPanel';

const zeroBand = { p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 };

const memberBreakdown = (
  overrides: Partial<MemberBreakdown> = {}
): MemberBreakdown => ({
  userId: 'member-1',
  successRatePct: 88.4,
  incomePathsPence: [],
  cumulativeIncomePathsPence: [],
  totalLifetimeWithdrawalsPence: zeroBand,
  combinedTotalPence: zeroBand,
  endingWealthPercentilesPence: {
    p5: 0,
    p25: 5_000_000,
    p50: 25_000_000,
    p75: 60_000_000,
    p95: 150_000_000,
  },
  failures: {
    count: 0,
    byKind: {
      [FailureKind.BRIDGE_EXHAUSTED]: 0,
      [FailureKind.WEALTH_EXHAUSTED]: 0,
      [FailureKind.INCOME_BELOW_FLOOR]: 0,
    },
  },
  ...overrides,
});

const result = (
  overrides: Partial<SimulationResult> = {}
): SimulationResult => ({
  successRatePct: 92.5,
  endingWealthPercentilesPence: {
    p5: 0,
    p25: 10_000_000,
    p50: 50_000_000,
    p75: 120_000_000,
    p95: 300_000_000,
  },
  percentilePathsPence: [],
  incomePathsPence: [],
  cumulativeIncomePathsPence: [],
  totalLifetimeWithdrawalsPence: zeroBand,
  combinedTotalPence: zeroBand,
  sampledPathsPence: [],
  failures: {
    count: 0,
    byKind: {
      [FailureKind.BRIDGE_EXHAUSTED]: 0,
      [FailureKind.WEALTH_EXHAUSTED]: 0,
      [FailureKind.INCOME_BELOW_FLOOR]: 0,
    },
  },
  memberBreakdowns: [],
  ...overrides,
});

describe('RetirementResultPanel', () => {
  it('shows the headline success rate against the target', () => {
    render(
      <RetirementResultPanel result={result()} targetSuccessRatePct={90} />
    );
    expect(screen.getByTestId('success-rate')).toHaveTextContent('92.5%');
    expect(screen.getByText('Target 90%')).toBeInTheDocument();
  });

  it('shows the lifetime value figures with the ending pot', () => {
    render(
      <RetirementResultPanel
        result={result({
          totalLifetimeWithdrawalsPence: {
            p5: 20_000_000,
            p25: 30_000_000,
            p50: 40_000_000,
            p75: 50_000_000,
            p95: 60_000_000,
          },
          combinedTotalPence: {
            p5: 20_000_000,
            p25: 40_000_000,
            p50: 90_000_000,
            p75: 170_000_000,
            p95: 360_000_000,
          },
        })}
        targetSuccessRatePct={90}
      />
    );
    // Total withdrawn (median) and the ending pot presented side by side.
    expect(screen.getByTestId('lifetime-withdrawn')).toHaveTextContent(
      '£400,000'
    );
    expect(screen.getByTestId('lifetime-ending')).toHaveTextContent('£500,000');
    expect(screen.getByTestId('lifetime-combined')).toHaveTextContent(
      '£900,000'
    );
  });

  it('shows a friendly line when no runs failed', () => {
    render(
      <RetirementResultPanel result={result()} targetSuccessRatePct={90} />
    );
    expect(screen.getByTestId('failure-none')).toBeInTheDocument();
    expect(screen.queryByTestId('failure-summary')).not.toBeInTheDocument();
  });

  it('breaks failures down by kind with explanations', () => {
    render(
      <RetirementResultPanel
        result={result({
          successRatePct: 74,
          failures: {
            count: 1_300,
            medianFailureYear: 2052,
            byKind: {
              [FailureKind.BRIDGE_EXHAUSTED]: 800,
              [FailureKind.WEALTH_EXHAUSTED]: 500,
              [FailureKind.INCOME_BELOW_FLOOR]: 0,
            },
          },
        })}
        targetSuccessRatePct={90}
      />
    );
    expect(screen.getByTestId('failure-summary')).toHaveTextContent(
      '1300 failing runs · median failure year 2052'
    );
    expect(screen.getByTestId('failure-bridge')).toHaveTextContent(
      '800 bridge exhausted — accessible savings (ISA/GIA) ran out before pension access age.'
    );
    expect(screen.getByTestId('failure-wealth')).toHaveTextContent(
      '500 wealth exhausted — total wealth ran out before the end of the plan.'
    );
  });

  it('does not render the per-member section when there are no breakdowns', () => {
    render(
      <RetirementResultPanel result={result()} targetSuccessRatePct={90} />
    );
    expect(screen.queryByTestId('member-breakdowns')).not.toBeInTheDocument();
  });

  it('renders a disclosure per member with nickname and per-member success', () => {
    render(
      <RetirementResultPanel
        result={result({
          memberBreakdowns: [
            memberBreakdown({ userId: 'A', successRatePct: 100 }),
            memberBreakdown({ userId: 'B', successRatePct: 61.2 }),
          ],
        })}
        targetSuccessRatePct={90}
        memberNicknames={{ A: 'Alex', B: 'Blair' }}
      />
    );
    expect(screen.getByTestId('member-breakdown-A')).toBeInTheDocument();
    expect(screen.getByTestId('member-breakdown-B')).toBeInTheDocument();
    expect(screen.getByTestId('member-breakdown-A')).toHaveTextContent('Alex');
    expect(screen.getByTestId('member-breakdown-B')).toHaveTextContent('Blair');
    expect(screen.getByTestId('member-success-A')).toHaveTextContent('100.0%');
    expect(screen.getByTestId('member-success-B')).toHaveTextContent('61.2%');
  });

  it('falls back to the userId when a nickname is missing', () => {
    render(
      <RetirementResultPanel
        result={result({
          memberBreakdowns: [memberBreakdown({ userId: 'user-xyz' })],
        })}
        targetSuccessRatePct={90}
      />
    );
    expect(screen.getByTestId('member-breakdown-user-xyz')).toHaveTextContent(
      'user-xyz'
    );
  });

  describe('successColorClass', () => {
    it('grades green at or above target, amber within 10, rose below', () => {
      expect(successColorClass(90, 90)).toContain('emerald');
      expect(successColorClass(95, 90)).toContain('emerald');
      expect(successColorClass(85, 90)).toContain('amber');
      expect(successColorClass(80, 90)).toContain('amber');
      expect(successColorClass(79.9, 90)).toContain('rose');
    });
  });

  it('colours the headline by grade', () => {
    const { rerender } = render(
      <RetirementResultPanel result={result()} targetSuccessRatePct={90} />
    );
    expect(screen.getByTestId('success-rate').className).toContain('emerald');
    rerender(
      <RetirementResultPanel
        result={result({ successRatePct: 84 })}
        targetSuccessRatePct={90}
      />
    );
    expect(screen.getByTestId('success-rate').className).toContain('amber');
    rerender(
      <RetirementResultPanel
        result={result({ successRatePct: 40 })}
        targetSuccessRatePct={90}
      />
    );
    expect(screen.getByTestId('success-rate').className).toContain('rose');
  });
});
