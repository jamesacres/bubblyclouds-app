import React from 'react';
import { render, screen } from '@testing-library/react';
import { FinishedBadge } from './FinishedBadge';

describe('FinishedBadge', () => {
  it('renders the finished text', () => {
    render(<FinishedBadge />);
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  it('renders a check icon', () => {
    const { container } = render(<FinishedBadge />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders as an inline span', () => {
    const { container } = render(<FinishedBadge />);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });
});
