import { render, screen } from '@testing-library/react';
import StatCard, { changeColorClass, changeText } from './StatCard';

describe('StatCard', () => {
  it('renders the label and formatted value', () => {
    render(<StatCard label="Month on month" valuePence={123_456} />);
    expect(screen.getByText('Month on month')).toBeInTheDocument();
    expect(screen.getByText('£1,234.56')).toBeInTheDocument();
  });

  it('omits the change row when change is undefined', () => {
    render(<StatCard label="All time" valuePence={0} />);
    expect(screen.queryByTestId('stat-card-change')).not.toBeInTheDocument();
  });

  it('shows a positive change in green with a leading plus', () => {
    render(
      <StatCard
        label="12 months"
        valuePence={500_000}
        change={{ absolutePence: 10_000, percent: 2.14 }}
      />
    );
    const change = screen.getByTestId('stat-card-change');
    expect(change).toHaveTextContent('+£100.00 (+2.1%)');
    expect(change).toHaveClass('text-emerald-400');
  });

  it('shows a negative change in red', () => {
    render(
      <StatCard
        label="12 months"
        valuePence={500_000}
        change={{ absolutePence: -25_000, percent: -4.76 }}
      />
    );
    const change = screen.getByTestId('stat-card-change');
    expect(change).toHaveTextContent('-£250.00 (-4.8%)');
    expect(change).toHaveClass('text-rose-400');
  });

  describe('changeText / changeColorClass', () => {
    it('treats a zero change as positive', () => {
      expect(changeText({ absolutePence: 0, percent: 0 })).toBe(
        '+£0.00 (+0.0%)'
      );
      expect(changeColorClass({ absolutePence: 0, percent: 0 })).toBe(
        'text-emerald-400'
      );
    });
  });
});
