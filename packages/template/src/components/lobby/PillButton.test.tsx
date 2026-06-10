import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PillButton } from './PillButton';
import { Sparkles } from 'lucide-react';

describe('PillButton', () => {
  it('renders children text', () => {
    render(<PillButton>Click me</PillButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<PillButton onClick={onClick}>Press</PillButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders as a button element', () => {
    render(<PillButton>Action</PillButton>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    const { container } = render(
      <PillButton icon={Sparkles}>With Icon</PillButton>
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders without an icon when not provided', () => {
    const { container } = render(<PillButton>No Icon</PillButton>);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('uses theme tone by default', () => {
    const { container } = render(<PillButton>Themed</PillButton>);
    const btn = container.querySelector('button') as HTMLElement;
    expect(btn.style.color).toContain('var(--theme-primary-light)');
  });

  it('applies violet tone styling when tone is violet', () => {
    const { container } = render(<PillButton tone="violet">Violet</PillButton>);
    const btn = container.querySelector('button') as HTMLElement;
    expect(btn.style.color).toBe('rgb(196, 181, 253)');
  });
});
