import { render, screen } from '@testing-library/react';
import { FailureKind, SimulationResult } from '../types/simulation';
import RetirementResultPanel, {
  successColorClass,
} from './RetirementResultPanel';

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
  sampledPathsPence: [],
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

describe('RetirementResultPanel', () => {
  it('shows the headline success rate against the target', () => {
    render(
      <RetirementResultPanel result={result()} targetSuccessRatePct={90} />
    );
    expect(screen.getByTestId('success-rate')).toHaveTextContent('92.5%');
    expect(screen.getByText('Target 90%')).toBeInTheDocument();
  });

  it('shows the ending-wealth percentiles', () => {
    render(
      <RetirementResultPanel result={result()} targetSuccessRatePct={90} />
    );
    expect(screen.getByTestId('ending-wealth-p5')).toHaveTextContent('£0.00');
    expect(screen.getByTestId('ending-wealth-p50')).toHaveTextContent(
      '£500,000'
    );
    expect(screen.getByTestId('ending-wealth-p95')).toHaveTextContent(
      '£3,000,000'
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
