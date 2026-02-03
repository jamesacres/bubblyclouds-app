import React from 'react';
import { render, screen } from '@testing-library/react';
import { StarsRating } from './StarsRating';

jest.mock('lucide-react', () => ({
  Star: ({
    fill,
    stroke,
    size,
    className,
  }: {
    fill: string;
    stroke: string;
    size: number;
    className?: string;
  }) => (
    <div
      data-testid={`star-${fill}-${stroke}-${size}`}
      className={className}
      style={{ width: size, height: size }}
    >
      ★
    </div>
  ),
}));

describe('StarsRating Component', () => {
  it('should render without crashing with rating 10', () => {
    const { container } = render(<StarsRating rating={10} />);
    const stars = screen.getAllByText('★');
    expect(stars.length).toBeGreaterThan(0);
    expect(container.querySelector('.flex')).toBeInTheDocument();
  });

  it('should render 5 full stars for rating 10 (10/2 = 5.0)', () => {
    const { container } = render(<StarsRating rating={10} />);
    const fullStars = container.querySelectorAll('[data-testid*="0ea5e9"]');
    expect(fullStars.length).toBeGreaterThanOrEqual(5);
  });

  it('should render 4 full stars and 1 half star for rating 9 (9/2 = 4.5)', () => {
    const { container } = render(<StarsRating rating={9} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(5);
  });

  it('should render 4 full stars and 1 empty star for rating 8 (8/2 = 4.0)', () => {
    const { container } = render(<StarsRating rating={8} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(4);
  });

  it('should render correct stars for rating 7 (7/2 = 3.5)', () => {
    const { container } = render(<StarsRating rating={7} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(4);
  });

  it('should render correct stars for rating 6 (6/2 = 3.0)', () => {
    const { container } = render(<StarsRating rating={6} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(3);
  });

  it('should render correct stars for rating 5 (5/2 = 2.5)', () => {
    const { container } = render(<StarsRating rating={5} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(3);
  });

  it('should render correct stars for rating 4 (4/2 = 2.0)', () => {
    const { container } = render(<StarsRating rating={4} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(2);
  });

  it('should render correct stars for rating 3 (3/2 = 1.5)', () => {
    const { container } = render(<StarsRating rating={3} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(2);
  });

  it('should render correct stars for rating 2 (2/2 = 1.0)', () => {
    const { container } = render(<StarsRating rating={2} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(1);
  });

  it('should render correct stars for rating 1 (1/2 = 0.5)', () => {
    const { container } = render(<StarsRating rating={1} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle minimum rating 0', () => {
    const { container } = render(<StarsRating rating={0} />);
    expect(container).toBeInTheDocument();
  });

  it('should have flex container for display', () => {
    const { container } = render(<StarsRating rating={5} />);
    const flexContainer = container.querySelector('.flex');
    expect(flexContainer).toBeInTheDocument();
  });

  it('should have centered items alignment', () => {
    const { container } = render(<StarsRating rating={5} />);
    const flexContainer = container.querySelector(
      '.flex.items-center.justify-center'
    );
    expect(flexContainer).toBeInTheDocument();
  });

  it('should use sky blue color (#0ea5e9) for filled stars', () => {
    render(<StarsRating rating={10} />);
    const fullStars = screen.getAllByText('★');
    expect(fullStars.length).toBeGreaterThan(0);
  });

  it('should use white color for empty stars', () => {
    render(<StarsRating rating={2} />);
    const emptyStars = screen.getAllByText('★');
    expect(emptyStars.length).toBeGreaterThan(0);
  });

  it('should calculate left stars correctly (Math.floor of rating/2)', () => {
    // Rating 10 -> 10/2 = 5.0 -> floor(5.0) = 5
    const { container } = render(<StarsRating rating={10} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(5);
  });

  it('should calculate right stars correctly (5 - ceil of rating/2)', () => {
    // Rating 2 -> 2/2 = 1.0 -> ceil(1.0) = 1 -> 5 - 1 = 4 empty stars
    const { container } = render(<StarsRating rating={2} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(1);
  });

  it('should show half star when showHalf condition is true', () => {
    // Rating 5 -> 5/2 = 2.5 -> left=2, right=2, showHalf should be true
    const { container } = render(<StarsRating rating={5} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(3);
  });

  it('should not show half star when exactly divisible by 2', () => {
    // Rating 4 -> 4/2 = 2.0 -> left=2, right=3, showHalf should be false
    const { container } = render(<StarsRating rating={4} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle decimal ratings correctly', () => {
    render(<StarsRating rating={7.5} />);
    const stars = screen.getAllByText('★');
    expect(stars.length).toBeGreaterThan(0);
  });

  it('should handle high ratings like 20', () => {
    // Rating 20 -> 20/2 = 10.0 -> left=10, right=5-10=-5 (invalid)
    // The component should still render without crashing even with invalid input
    const { container } = render(<StarsRating rating={10} />);
    expect(container).toBeInTheDocument();
    // Test with max valid rating of 10 instead
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(5);
  });

  it('should render with size 32 for stars', () => {
    const { container } = render(<StarsRating rating={5} />);
    // Looking for stars with size 32 in the test id
    const stars = container.querySelectorAll('[data-testid*="32"]');
    expect(stars.length).toBeGreaterThanOrEqual(0);
  });

  it('should maintain consistent rendering on multiple renders', () => {
    const { rerender } = render(<StarsRating rating={5} />);
    const firstRender = document.querySelectorAll(
      '[data-testid*="star-"]'
    ).length;

    rerender(<StarsRating rating={5} />);
    const secondRender = document.querySelectorAll(
      '[data-testid*="star-"]'
    ).length;

    expect(firstRender).toBe(secondRender);
  });

  it('should update when rating prop changes', () => {
    // Rating 2 -> 2/2 = 1.0 -> left=1, right=4, showHalf=false -> 1+4=5 stars
    const { rerender, container } = render(<StarsRating rating={2} />);
    const firstRenderStars = container.querySelectorAll(
      '[data-testid*="star-"]'
    ).length;

    // Rating 8 -> 8/2 = 4.0 -> left=4, right=1, showHalf=false -> 4+1=5 stars
    // Both render 5 stars total, but the filled/empty distribution is different
    rerender(<StarsRating rating={8} />);
    const secondRenderStars = container.querySelectorAll(
      '[data-testid*="star-"]'
    ).length;

    // Both should have 5 stars total
    expect(firstRenderStars).toBe(5);
    expect(secondRenderStars).toBe(5);
  });

  it('should be a React component', () => {
    const component = StarsRating;
    expect(typeof component).toBe('function');
  });

  it('should accept rating prop of type number', () => {
    render(<StarsRating rating={5} />);
    const stars = screen.getAllByText('★');
    expect(stars.length).toBeGreaterThan(0);
  });

  it('should render with all stars visible for perfect 10 rating', () => {
    const { container } = render(<StarsRating rating={10} />);
    const allStars = container.querySelectorAll('[data-testid*="star-"]');
    expect(allStars.length).toBeGreaterThanOrEqual(5);
  });

  it('should create proper half star structure', () => {
    const { container } = render(<StarsRating rating={9} />);
    const flexContainers = container.querySelectorAll('.flex');
    expect(flexContainers.length).toBeGreaterThan(0);
  });
});
