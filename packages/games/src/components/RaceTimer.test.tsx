import { render, screen } from '@testing-library/react';
import RaceTimer from './RaceTimer';

const formatSeconds = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${`${seconds}`.padStart(2, '0')}`;
};

describe('RaceTimer', () => {
  it('renders the formatted elapsed time', () => {
    render(<RaceTimer seconds={125} formatSeconds={formatSeconds} />);

    expect(screen.getByTestId('race-timer')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('shows 0:00 while counting down regardless of seconds', () => {
    render(
      <RaceTimer seconds={125} countdown={3} formatSeconds={formatSeconds} />
    );

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.queryByText('2:05')).not.toBeInTheDocument();
  });

  it('applies the dimmed styling while counting down', () => {
    render(
      <RaceTimer seconds={0} countdown={3} formatSeconds={formatSeconds} />
    );

    expect(screen.getByTestId('race-timer')).toHaveClass('text-stone-400');
  });

  it('applies the default styling when idle', () => {
    render(<RaceTimer seconds={0} formatSeconds={formatSeconds} />);

    expect(screen.getByTestId('race-timer')).toHaveClass('text-stone-700');
  });

  it('applies the complete styling and shows the flag icon when isComplete', () => {
    const { container } = render(
      <RaceTimer seconds={90} isComplete formatSeconds={formatSeconds} />
    );

    expect(screen.getByTestId('race-timer')).toHaveClass('text-theme-primary');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not show the flag icon when not complete', () => {
    const { container } = render(
      <RaceTimer seconds={90} formatSeconds={formatSeconds} />
    );

    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
