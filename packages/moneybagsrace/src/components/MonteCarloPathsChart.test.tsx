import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { SimulationResult } from '../types/simulation';
import MonteCarloPathsChart from './MonteCarloPathsChart';

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
  { year: 2040, p5: 100, p25: 200, p50: 300, p75: 400, p95: 500 },
  { year: 2041, p5: 90, p25: 210, p50: 320, p75: 430, p95: 540 },
];

const sampledPaths: SimulationResult['sampledPathsPence'] = [
  { runIndex: 0, totalsPence: [300, 280] },
  { runIndex: 3, totalsPence: [300, 360] },
];

describe('MonteCarloPathsChart', () => {
  it('shows an empty state without paths', () => {
    render(
      <MonteCarloPathsChart
        paths={[]}
        sampledPaths={[]}
        mode="real"
        inflationRatePct={2.5}
      />
    );
    expect(screen.getByTestId('monte-carlo-paths-empty')).toBeInTheDocument();
    expect(
      screen.queryByTestId('monte-carlo-paths-chart')
    ).not.toBeInTheDocument();
  });

  it('renders the sampled-path count, band and median legend', () => {
    render(
      <MonteCarloPathsChart
        paths={paths}
        sampledPaths={sampledPaths}
        mode="real"
        inflationRatePct={2.5}
      />
    );
    expect(screen.getByTestId('monte-carlo-paths-chart')).toBeInTheDocument();
    expect(screen.getByText('2 simulated paths')).toBeInTheDocument();
    expect(screen.getByText('5th–95th percentile')).toBeInTheDocument();
    expect(screen.getByText('Median')).toBeInTheDocument();
  });

  it('shows the real-terms mode label', () => {
    render(
      <MonteCarloPathsChart
        paths={paths}
        sampledPaths={sampledPaths}
        mode="real"
        inflationRatePct={2.5}
      />
    );
    expect(screen.getByTestId('monte-carlo-paths-mode')).toHaveTextContent(
      "Showing real values (today's money)"
    );
  });

  it('switches the mode label for the nominal view', () => {
    render(
      <MonteCarloPathsChart
        paths={paths}
        sampledPaths={sampledPaths}
        mode="nominal"
        inflationRatePct={2.5}
      />
    );
    expect(screen.getByTestId('monte-carlo-paths-mode')).toHaveTextContent(
      'Showing nominal values'
    );
  });
});
