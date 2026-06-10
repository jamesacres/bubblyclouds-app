import React from 'react';
import { render, screen } from '@testing-library/react';
import { TierBadge } from './TierBadge';

describe('TierBadge', () => {
  it('renders "Novice" label for novice skill level', () => {
    render(<TierBadge skillLevel="novice" />);
    expect(screen.getByText('Novice')).toBeInTheDocument();
  });

  it('renders "Beginner" label for advancedBeginner skill level', () => {
    render(<TierBadge skillLevel="advancedBeginner" />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  it('renders "Competent" label for competent skill level', () => {
    render(<TierBadge skillLevel="competent" />);
    expect(screen.getByText('Competent')).toBeInTheDocument();
  });

  it('renders "Proficient" label for proficient skill level', () => {
    render(<TierBadge skillLevel="proficient" />);
    expect(screen.getByText('Proficient')).toBeInTheDocument();
  });

  it('renders "Expert" label for expert skill level', () => {
    render(<TierBadge skillLevel="expert" />);
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  it('renders the raw skill level as label for unknown tier', () => {
    render(<TierBadge skillLevel="grandmaster" />);
    expect(screen.getByText('grandmaster')).toBeInTheDocument();
  });

  it('falls back to novice colors for unknown skill level', () => {
    const { container } = render(<TierBadge skillLevel="unknown" />);
    const span = container.querySelector('span') as HTMLElement;
    expect(span.style.color).toBe('rgb(110, 231, 183)');
  });

  it('renders as a span', () => {
    const { container } = render(<TierBadge skillLevel="novice" />);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });
});
