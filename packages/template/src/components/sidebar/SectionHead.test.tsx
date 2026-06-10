import React from 'react';
import { render, screen } from '@testing-library/react';
import { SectionHead } from './SectionHead';
import { Users } from 'lucide-react';

describe('SectionHead', () => {
  it('renders the title', () => {
    render(<SectionHead title="Players" />);
    expect(screen.getByText('Players')).toBeInTheDocument();
  });

  it('renders title as an h2', () => {
    render(<SectionHead title="Teams" />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renders a count badge when count is provided', () => {
    render(<SectionHead title="Players" count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not render a count badge when count is undefined', () => {
    const { container } = render(<SectionHead title="Players" />);
    const badge = container.querySelector('.rounded-full');
    expect(badge).not.toBeInTheDocument();
  });

  it('renders count badge when count is 0', () => {
    render(<SectionHead title="Players" count={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('renders an icon when provided', () => {
    const { container } = render(<SectionHead icon={Users} title="Players" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render an icon when not provided', () => {
    const { container } = render(<SectionHead title="Players" />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders the action slot content', () => {
    render(<SectionHead title="Players" action={<button>Add</button>} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('renders without optional props', () => {
    render(<SectionHead title="Solo" />);
    expect(screen.getByText('Solo')).toBeInTheDocument();
  });
});
