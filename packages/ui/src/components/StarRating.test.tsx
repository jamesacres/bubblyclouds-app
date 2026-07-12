import React from 'react';
import { render } from '@testing-library/react';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('renders max stars (default 3)', () => {
    const { container } = render(<StarRating rating={2} />);
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(3);
  });

  it('respects a custom max', () => {
    const { container } = render(<StarRating rating={3} max={5} />);
    const stars = container.querySelectorAll('svg');
    expect(stars.length).toBe(5);
  });

  it('fills the correct number of stars with amber', () => {
    const { container } = render(<StarRating rating={2} max={3} />);
    const stars = container.querySelectorAll('svg');
    const filled = Array.from(stars).filter((s) =>
      s.getAttribute('class')?.includes('fill-amber-400')
    );
    const dimmed = Array.from(stars).filter((s) =>
      s.getAttribute('class')?.includes('fill-transparent')
    );
    expect(filled.length).toBe(2);
    expect(dimmed.length).toBe(1);
  });

  it('clamps rating to the range [0, max]', () => {
    const { container } = render(<StarRating rating={9} max={3} />);
    const filled = Array.from(container.querySelectorAll('svg')).filter((s) =>
      s.getAttribute('class')?.includes('fill-amber-400')
    );
    expect(filled.length).toBe(3);
  });

  it('exposes an accessible role and label', () => {
    const { getByRole } = render(<StarRating rating={1} max={3} />);
    const img = getByRole('img');
    expect(img).toHaveAttribute('aria-label', '1 of 3 stars');
  });

  it('applies size classes', () => {
    const { container: sm } = render(<StarRating rating={1} size="sm" />);
    expect(sm.querySelector('svg')?.getAttribute('class')).toContain('h-4');

    const { container: lg } = render(<StarRating rating={1} size="lg" />);
    expect(lg.querySelector('svg')?.getAttribute('class')).toContain('h-9');
  });

  it('does not render pop animation styling when not animated', () => {
    const { container } = render(<StarRating rating={2} />);
    expect(container.querySelector('.star-rating-pop')).not.toBeInTheDocument();
    expect(container.querySelector('style')).not.toBeInTheDocument();
  });

  it('staggers per-star animation delay when animated', () => {
    const { container } = render(
      <StarRating rating={3} animated staggerMs={220} />
    );
    const popped = container.querySelectorAll('.star-rating-pop');
    expect(popped.length).toBe(3);
    expect((popped[0] as HTMLElement).style.animationDelay).toBe('0ms');
    expect((popped[1] as HTMLElement).style.animationDelay).toBe('220ms');
    expect((popped[2] as HTMLElement).style.animationDelay).toBe('440ms');
  });

  it('includes a reduced-motion guard in the animation styles', () => {
    const { container } = render(<StarRating rating={3} animated />);
    const style = container.querySelector('style');
    expect(style?.textContent).toContain('prefers-reduced-motion: reduce');
  });

  it('applies a custom className', () => {
    const { getByRole } = render(
      <StarRating rating={1} className="my-custom-class" />
    );
    expect(getByRole('img')).toHaveClass('my-custom-class');
  });
});
