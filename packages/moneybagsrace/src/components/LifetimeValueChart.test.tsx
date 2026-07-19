import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { SimulationResult } from '../types/simulation';
import LifetimeValueChart from './LifetimeValueChart';

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

const paths: SimulationResult['cumulativeIncomePathsPence'] = [
  { year: 2040, p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
  { year: 2041, p5: 100, p25: 200, p50: 300, p75: 400, p95: 500 },
  { year: 2042, p5: 200, p25: 400, p50: 600, p75: 800, p95: 1000 },
];

describe('LifetimeValueChart', () => {
  it('shows an empty state without paths', () => {
    render(<LifetimeValueChart paths={[]} />);
    expect(screen.getByTestId('lifetime-value-empty')).toBeInTheDocument();
    expect(
      screen.queryByTestId('lifetime-value-chart')
    ).not.toBeInTheDocument();
  });

  it('renders both percentile bands and the median line', () => {
    render(<LifetimeValueChart paths={paths} />);
    expect(screen.getByTestId('lifetime-value-chart')).toBeInTheDocument();
    expect(screen.getByText('5th–95th percentile')).toBeInTheDocument();
    expect(screen.getByText('25th–75th percentile')).toBeInTheDocument();
    expect(screen.getByText('Median total withdrawn')).toBeInTheDocument();
  });
});
