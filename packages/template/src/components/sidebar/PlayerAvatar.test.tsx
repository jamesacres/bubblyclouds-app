import React from 'react';
import { render, screen } from '@testing-library/react';
import { PlayerAvatar } from './PlayerAvatar';

describe('PlayerAvatar', () => {
  it('renders the first letter of the name uppercased', () => {
    render(<PlayerAvatar name="alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('handles names that start with an uppercase letter', () => {
    render(<PlayerAvatar name="Bob" />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('is not muted by default', () => {
    const { container } = render(<PlayerAvatar name="Carol" />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.style.opacity).toBe('1');
  });

  it('applies reduced opacity when muted', () => {
    const { container } = render(<PlayerAvatar name="Dave" muted />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.style.opacity).toBe('0.55');
  });

  it('is not muted when muted is false', () => {
    const { container } = render(<PlayerAvatar name="Eve" muted={false} />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar.style.opacity).toBe('1');
  });

  it('renders with a single character name', () => {
    render(<PlayerAvatar name="X" />);
    expect(screen.getByText('X')).toBeInTheDocument();
  });
});
