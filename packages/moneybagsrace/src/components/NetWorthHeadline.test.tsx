import { render, screen } from '@testing-library/react';
import NetWorthHeadline from './NetWorthHeadline';

describe('NetWorthHeadline', () => {
  it('announces the formatted household figure', () => {
    render(<NetWorthHeadline valuePence={25_000_000} />);
    // CountUp renders the final formatted value in its sr-only live region
    expect(screen.getByText('£250,000')).toBeInTheDocument();
    expect(screen.getByText('Household net worth')).toBeInTheDocument();
  });

  it('shows the change versus last month when provided', () => {
    render(
      <NetWorthHeadline
        valuePence={25_000_000}
        change={{ absolutePence: 150_000, percent: 0.6 }}
      />
    );
    const change = screen.getByTestId('net-worth-headline-change');
    expect(change).toHaveTextContent('+£1,500.00 (+0.6%) vs last month');
    expect(change).toHaveClass('text-emerald-400');
  });

  it('colors a fall versus last month red', () => {
    render(
      <NetWorthHeadline
        valuePence={25_000_000}
        change={{ absolutePence: -150_000, percent: -0.6 }}
      />
    );
    expect(screen.getByTestId('net-worth-headline-change')).toHaveClass(
      'text-rose-400'
    );
  });

  it('omits the change row when there is no previous month', () => {
    render(<NetWorthHeadline valuePence={0} />);
    expect(
      screen.queryByTestId('net-worth-headline-change')
    ).not.toBeInTheDocument();
  });
});
