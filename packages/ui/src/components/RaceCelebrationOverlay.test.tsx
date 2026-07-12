import { render, screen } from '@testing-library/react';
import RaceCelebrationOverlay, {
  CELEBRATION_MS,
} from './RaceCelebrationOverlay';

describe('RaceCelebrationOverlay', () => {
  it('renders nothing when not visible', () => {
    render(<RaceCelebrationOverlay isVisible={false} title="Solved!" />);
    expect(
      screen.queryByTestId('race-celebration-overlay')
    ).not.toBeInTheDocument();
  });

  it('renders the title banner and confetti when visible', () => {
    const { container } = render(
      <RaceCelebrationOverlay isVisible title="Solved!" />
    );
    const overlay = screen.getByTestId('race-celebration-overlay');
    expect(overlay).toBeInTheDocument();
    expect(screen.getByText('Solved!')).toBeInTheDocument();

    const confetti = container.querySelectorAll('.celebration-motion');
    // one flash layer + 32 confetti pieces
    expect(confetti.length).toBeGreaterThanOrEqual(33);
  });

  it('is aria-hidden and pointer-events-none so it never affects a11y', () => {
    render(<RaceCelebrationOverlay isVisible title="Solved!" />);
    const overlay = screen.getByTestId('race-celebration-overlay');
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
    expect(overlay.className).toContain('pointer-events-none');
  });

  it('renders the optional badge and belowBadge slots', () => {
    render(
      <RaceCelebrationOverlay
        isVisible
        title="Finish!"
        badge={<span>Run complete</span>}
        belowBadge={<span>extra content</span>}
      />
    );
    expect(screen.getByText('Run complete')).toBeInTheDocument();
    expect(screen.getByText('extra content')).toBeInTheDocument();
  });

  it('renders children after the banner column', () => {
    render(
      <RaceCelebrationOverlay isVisible title="Finish!">
        <span data-testid="lap-car">car</span>
      </RaceCelebrationOverlay>
    );
    expect(screen.getByTestId('lap-car')).toBeInTheDocument();
  });

  it('includes a reduced-motion guard in the overlay styles', () => {
    const { container } = render(
      <RaceCelebrationOverlay isVisible title="Solved!" />
    );
    const style = container.querySelector('style');
    expect(style?.textContent).toContain('prefers-reduced-motion: reduce');
  });

  it('uses the default palette when no confetti colors are provided', () => {
    const { container } = render(
      <RaceCelebrationOverlay isVisible title="Solved!" />
    );
    const pieces = Array.from(
      container.querySelectorAll<HTMLElement>('.celebration-motion')
    ).filter((el) => el.classList.contains('top-0'));
    expect(pieces.length).toBe(32);
    // With checkered off, no piece should wear the checkered-flag background.
    const checkered = pieces.filter((el) =>
      el.style.backgroundImage.includes('linear-gradient(45deg, black')
    );
    expect(checkered.length).toBe(0);
  });

  it('exports a shared timing constant', () => {
    expect(CELEBRATION_MS).toBe(5500);
  });
});
