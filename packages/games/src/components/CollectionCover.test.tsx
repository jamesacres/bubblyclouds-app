import { render, screen } from '@testing-library/react';
import CollectionCover from './CollectionCover';

const baseProps = {
  gameLabel: 'Unblock Race',
  background: 'linear-gradient(160deg, #061231 0%, #0b3a8f 55%, #0e7490 100%)',
  shadow:
    '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(56,189,248,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
  titleGlow: 'rgba(103,232,249,0.8)',
  children: <div data-testid="cover-board" />,
};

describe('CollectionCover', () => {
  it('renders the title label in portrait variant by default', () => {
    render(<CollectionCover {...baseProps} title="July 2026" />);
    expect(screen.getByText('July 2026')).toBeInTheDocument();
    expect(screen.getByText('Monthly collection')).toBeInTheDocument();
    expect(screen.getByText('Unblock Race')).toBeInTheDocument();
  });

  it('applies medium size dimensions by default', () => {
    const { container } = render(
      <CollectionCover {...baseProps} title="July 2026" />
    );
    const cover = container.firstElementChild as HTMLElement;
    expect(cover.style.width).toBe('160px');
    expect(cover.style.height).toBe('240px');
  });

  it.each([
    ['small', 120, 180],
    ['medium', 160, 240],
    ['large', 240, 360],
  ] as const)('applies %s size dimensions', (size, width, height) => {
    const { container } = render(
      <CollectionCover {...baseProps} title="July 2026" size={size} />
    );
    const cover = container.firstElementChild as HTMLElement;
    expect(cover.style.width).toBe(`${width}px`);
    expect(cover.style.height).toBe(`${height}px`);
  });

  it('renders the tile variant without the portrait-only copy', () => {
    render(<CollectionCover {...baseProps} title="July 2026" variant="tile" />);
    expect(screen.getByText('July 2026')).toBeInTheDocument();
    expect(screen.queryByText('Monthly collection')).not.toBeInTheDocument();
    expect(screen.queryByText('Unblock Race')).not.toBeInTheDocument();
  });

  it('renders a custom kicker when supplied', () => {
    render(
      <CollectionCover {...baseProps} title="July 2026" kicker="Weekly set" />
    );
    expect(screen.getByText('Weekly set')).toBeInTheDocument();
  });

  it('renders an icon badge with its animation class when supplied', () => {
    render(
      <CollectionCover
        {...baseProps}
        title="July 2026"
        icon="🏁"
        iconAnimationClass="animate-wave"
      />
    );
    const badge = screen.getByText('🏁');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('animate-wave');
  });

  it('omits the icon badge when none is supplied', () => {
    render(<CollectionCover {...baseProps} title="July 2026" />);
    expect(screen.queryByText('🏁')).not.toBeInTheDocument();
  });

  it('renders the caller-supplied board preview in both variants', () => {
    const { container: portrait } = render(
      <CollectionCover {...baseProps} title="July 2026" variant="portrait" />
    );
    const { container: tile } = render(
      <CollectionCover {...baseProps} title="July 2026" variant="tile" />
    );
    expect(
      portrait.querySelectorAll('[data-testid="cover-board"]').length
    ).toBe(1);
    expect(tile.querySelectorAll('[data-testid="cover-board"]').length).toBe(1);
  });
});
