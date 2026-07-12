import { render, screen } from '@testing-library/react';
import CollectionCover from './CollectionCover';

describe('CollectionCover', () => {
  it('renders the month label in portrait variant by default', () => {
    render(<CollectionCover month="July 2026" />);
    expect(screen.getByText('July 2026')).toBeInTheDocument();
    expect(screen.getByText('Monthly collection')).toBeInTheDocument();
    expect(screen.getByText('Unblock Race')).toBeInTheDocument();
  });

  it('applies medium size dimensions by default', () => {
    const { container } = render(<CollectionCover month="July 2026" />);
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
      <CollectionCover month="July 2026" size={size} />
    );
    const cover = container.firstElementChild as HTMLElement;
    expect(cover.style.width).toBe(`${width}px`);
    expect(cover.style.height).toBe(`${height}px`);
  });

  it('renders the tile variant without the portrait-only copy', () => {
    render(<CollectionCover month="July 2026" variant="tile" />);
    expect(screen.getByText('July 2026')).toBeInTheDocument();
    expect(screen.queryByText('Monthly collection')).not.toBeInTheDocument();
    expect(screen.queryByText('Unblock Race')).not.toBeInTheDocument();
  });

  it('renders a board preview in both variants', () => {
    const { container: portrait } = render(
      <CollectionCover month="July 2026" variant="portrait" />
    );
    const { container: tile } = render(
      <CollectionCover month="July 2026" variant="tile" />
    );
    expect(portrait.querySelectorAll('[class]').length).toBeGreaterThan(0);
    expect(tile.querySelectorAll('[class]').length).toBeGreaterThan(0);
  });
});
