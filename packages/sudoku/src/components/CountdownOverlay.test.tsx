import React from 'react';
import { render, screen } from '@testing-library/react';
import CountdownOverlay from './CountdownOverlay';

describe('CountdownOverlay', () => {
  describe('text display', () => {
    it('shows "Get ready" label', () => {
      render(<CountdownOverlay countdown={4} />);
      expect(screen.getByText('Get ready')).toBeInTheDocument();
    });

    it('displays 3 when countdown is 4', () => {
      render(<CountdownOverlay countdown={4} />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays 2 when countdown is 3', () => {
      render(<CountdownOverlay countdown={3} />);
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays 1 when countdown is 2', () => {
      render(<CountdownOverlay countdown={2} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('displays GO! when countdown is 1', () => {
      render(<CountdownOverlay countdown={1} />);
      expect(screen.getByText('GO!')).toBeInTheDocument();
    });

    it('does not show a number when countdown is 1', () => {
      render(<CountdownOverlay countdown={1} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('traffic lights', () => {
    it('renders three light elements', () => {
      const { container } = render(<CountdownOverlay countdown={4} />);
      const lights = container.querySelectorAll('.rounded-full');
      expect(lights).toHaveLength(3);
    });

    it('lights are all off at countdown 4', () => {
      const { container } = render(<CountdownOverlay countdown={4} />);
      const lights = container.querySelectorAll('.rounded-full');
      lights.forEach((light) => {
        expect(light).not.toHaveStyle({ background: '#ef4444' });
        expect(light).not.toHaveStyle({ background: '#facc15' });
        expect(light).not.toHaveStyle({ background: '#4ade80' });
      });
    });

    it('first (red) light is on at countdown 3', () => {
      const { container } = render(<CountdownOverlay countdown={3} />);
      const lights = container.querySelectorAll('.rounded-full');
      expect(lights[0]).toHaveStyle({ background: '#ef4444' });
    });

    it('first and second lights are on at countdown 2', () => {
      const { container } = render(<CountdownOverlay countdown={2} />);
      const lights = container.querySelectorAll('.rounded-full');
      expect(lights[0]).toHaveStyle({ background: '#ef4444' });
      expect(lights[1]).toHaveStyle({ background: '#facc15' });
    });

    it('all three lights are on at countdown 1 (GO!)', () => {
      const { container } = render(<CountdownOverlay countdown={1} />);
      const lights = container.querySelectorAll('.rounded-full');
      expect(lights[0]).toHaveStyle({ background: '#ef4444' });
      expect(lights[1]).toHaveStyle({ background: '#facc15' });
      expect(lights[2]).toHaveStyle({ background: '#4ade80' });
    });
  });

  describe('overlay structure', () => {
    it('renders as a fixed full-screen overlay', () => {
      const { container } = render(<CountdownOverlay countdown={4} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('fixed', 'inset-0');
    });

    it('has a high z-index to appear above other content', () => {
      const { container } = render(<CountdownOverlay countdown={4} />);
      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('z-[120]');
    });
  });
});
