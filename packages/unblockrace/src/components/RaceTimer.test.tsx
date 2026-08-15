import { render, screen } from '@testing-library/react';
import RaceTimer from './RaceTimer';

describe('RaceTimer', () => {
  it('renders the formatted elapsed time', () => {
    render(<RaceTimer seconds={125} />);

    expect(screen.getByTestId('race-timer')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('shows 0:00 while counting down regardless of seconds', () => {
    render(<RaceTimer seconds={125} countdown={3} />);

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.queryByText('2:05')).not.toBeInTheDocument();
  });

  it('applies the dimmed styling while counting down', () => {
    render(<RaceTimer seconds={0} countdown={3} />);

    expect(screen.getByTestId('race-timer')).toHaveClass('text-stone-400');
  });

  it('applies the default styling when idle', () => {
    render(<RaceTimer seconds={0} />);

    expect(screen.getByTestId('race-timer')).toHaveClass('text-stone-700');
  });

  it('applies the complete styling and shows the flag icon when isComplete', () => {
    const { container } = render(<RaceTimer seconds={90} isComplete />);

    expect(screen.getByTestId('race-timer')).toHaveClass('text-theme-primary');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show the flag icon when not complete', () => {
    const { container } = render(<RaceTimer seconds={90} />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
