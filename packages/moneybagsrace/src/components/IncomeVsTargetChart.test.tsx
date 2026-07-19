import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { SimulationResult } from '../types/simulation';
import IncomeVsTargetChart from './IncomeVsTargetChart';

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

const paths: SimulationResult['incomePathsPence'] = [
  { year: 2040, p5: 900, p25: 950, p50: 1000, p75: 1050, p95: 1100 },
  { year: 2041, p5: 850, p25: 900, p50: 950, p75: 1000, p95: 1050 },
  { year: 2042, p5: 700, p25: 750, p50: 800, p75: 850, p95: 900 },
];

describe('IncomeVsTargetChart', () => {
  it('shows an empty state without paths', () => {
    render(<IncomeVsTargetChart paths={[]} targetPence={1000} />);
    expect(screen.getByTestId('income-vs-target-empty')).toBeInTheDocument();
    expect(
      screen.queryByTestId('income-vs-target-chart')
    ).not.toBeInTheDocument();
  });

  it('renders the income bands, median line and target line', () => {
    render(<IncomeVsTargetChart paths={paths} targetPence={1000} />);
    expect(screen.getByTestId('income-vs-target-chart')).toBeInTheDocument();
    expect(screen.getByText('5th–95th percentile')).toBeInTheDocument();
    expect(screen.getByText('25th–75th percentile')).toBeInTheDocument();
    expect(screen.getByText('Median income')).toBeInTheDocument();
    expect(screen.getByText('Target spend')).toBeInTheDocument();
  });

  it('flags the years whose median income falls below the target', () => {
    // Target 1000: 2040 median 1000 meets it, 2041 (950) and 2042 (800) fall
    // short => two shortfall years.
    render(<IncomeVsTargetChart paths={paths} targetPence={1000} />);
    expect(screen.getByTestId('income-vs-target-shortfall')).toHaveTextContent(
      '2 years'
    );
  });

  it('omits the shortfall note when every year meets the target', () => {
    render(<IncomeVsTargetChart paths={paths} targetPence={500} />);
    expect(
      screen.queryByTestId('income-vs-target-shortfall')
    ).not.toBeInTheDocument();
  });
});
