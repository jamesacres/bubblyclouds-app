import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { SimulationResult } from '../types/simulation';
import PercentilePathsChart from './PercentilePathsChart';

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

const paths: SimulationResult['percentilePathsPence'] = [
  { year: 2041, p5: 100, p25: 200, p50: 300, p75: 400, p95: 500 },
  { year: 2042, p5: 90, p25: 210, p50: 320, p75: 430, p95: 540 },
  { year: 2043, p5: 80, p25: 220, p50: 340, p75: 460, p95: 580 },
];

describe('PercentilePathsChart', () => {
  it('shows an empty state without paths', () => {
    render(<PercentilePathsChart paths={[]} />);
    expect(screen.getByTestId('percentile-paths-empty')).toBeInTheDocument();
    expect(
      screen.queryByTestId('percentile-paths-chart')
    ).not.toBeInTheDocument();
  });

  it('renders both percentile bands and the median line', () => {
    render(<PercentilePathsChart paths={paths} />);
    expect(screen.getByTestId('percentile-paths-chart')).toBeInTheDocument();
    expect(screen.getByText('5th–95th percentile')).toBeInTheDocument();
    expect(screen.getByText('25th–75th percentile')).toBeInTheDocument();
    expect(screen.getByText('Median')).toBeInTheDocument();
  });

  it('hides the transparent stacking bases from the legend', () => {
    render(<PercentilePathsChart paths={paths} />);
    expect(screen.queryByText('outerBase')).not.toBeInTheDocument();
    expect(screen.queryByText('innerBase')).not.toBeInTheDocument();
  });
});
