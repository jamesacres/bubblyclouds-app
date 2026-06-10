import React from 'react';
import { render } from '@testing-library/react';
import { HeroBackdrop } from './HeroBackdrop';

describe('HeroBackdrop', () => {
  it('renders without crashing', () => {
    const { container } = render(<HeroBackdrop />);
    expect(container).toBeTruthy();
  });

  it('renders decorative elements as aria-hidden', () => {
    const { container } = render(<HeroBackdrop />);
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThan(0);
  });

  it('renders all backdrop layers', () => {
    const { container } = render(<HeroBackdrop />);
    const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBe(3);
  });

  it('has pointer-events-none on all layers', () => {
    const { container } = render(<HeroBackdrop />);
    const layers = container.querySelectorAll('.pointer-events-none');
    expect(layers.length).toBeGreaterThan(0);
  });
});
