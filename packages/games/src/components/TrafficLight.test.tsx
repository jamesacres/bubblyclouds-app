import React from 'react';
import { render } from '@testing-library/react';
import TrafficLight from './TrafficLight';

describe('TrafficLight', () => {
  describe('rendering', () => {
    it('should not render when countdown is undefined', () => {
      const { container } = render(<TrafficLight countdown={undefined} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when countdown is 0', () => {
      const { container } = render(<TrafficLight countdown={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('should not render when countdown is negative', () => {
      const { container } = render(<TrafficLight countdown={-1} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when countdown is 1', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render when countdown is 2', () => {
      const { container } = render(<TrafficLight countdown={2} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render when countdown is 3', () => {
      const { container } = render(<TrafficLight countdown={3} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render when countdown is 4', () => {
      const { container } = render(<TrafficLight countdown={4} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render when countdown is higher than 4', () => {
      const { container } = render(<TrafficLight countdown={10} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('light indicators - countdown 1 (GO!)', () => {
    it('should show only green light when countdown is 1', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const lights = container.querySelectorAll('.rounded-full');

      expect(lights[0]).toHaveClass('bg-red-900/20'); // Red off
      expect(lights[1]).toHaveClass('bg-yellow-900/20'); // Yellow off
      expect(lights[2]).toHaveClass('bg-green-400'); // Green on
    });

    it('should have green light with bounce animation when countdown is 1', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const lights = container.querySelectorAll('.rounded-full');

      expect(lights[2]).toHaveClass('animate-bounce');
      expect(lights[2]).toHaveClass('scale-125');
    });

    it('should have green light with glowing shadow when countdown is 1', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const lights = container.querySelectorAll('.rounded-full');

      expect(lights[2]).toHaveClass('shadow-lg');
      expect(lights[2]).toHaveClass('shadow-green-400/70');
    });
  });

  describe('light indicators - countdown 2 (Red + Yellow)', () => {
    it('should show red and yellow lights when countdown is 2', () => {
      const { container } = render(<TrafficLight countdown={2} />);
      const lights = container.querySelectorAll('.rounded-full');

      expect(lights[0]).toHaveClass('bg-red-500'); // Red on
      expect(lights[1]).toHaveClass('bg-yellow-400'); // Yellow on
      expect(lights[2]).toHaveClass('bg-green-900/20'); // Green off
    });

    it('should have red and yellow lights with pulse animation when countdown is 2', () => {
      const { container } = render(<TrafficLight countdown={2} />);
      const lights = container.querySelectorAll('.rounded-full');

      expect(lights[0]).toHaveClass('animate-pulse');
      expect(lights[0]).toHaveClass('scale-110');
      expect(lights[1]).toHaveClass('animate-pulse');
      expect(lights[1]).toHaveClass('scale-110');
    });

    it('should have red and yellow lights with glow shadows when countdown is 2', () => {
      const { container } = render(<TrafficLight countdown={2} />);
      const lights = container.querySelectorAll('.rounded-full');

      expect(lights[0]).toHaveClass('shadow-lg');
      expect(lights[0]).toHaveClass('shadow-red-500/70');
      expect(lights[1]).toHaveClass('shadow-lg');
      expect(lights[1]).toHaveClass('shadow-yellow-400/70');
    });
  });

  describe('light indicators - countdown 3 (Red only)', () => {
    it('should show only red light when countdown is 3', () => {
      const { container } = render(<TrafficLight countdown={3} />);
      const lights = container.querySelectorAll('.rounded-full');

      expect(lights[0]).toHaveClass('bg-red-500'); // Red on
      expect(lights[1]).toHaveClass('bg-yellow-900/20'); // Yellow off
      expect(lights[2]).toHaveClass('bg-green-900/20'); // Green off
    });

    it('should have red light with pulse animation when countdown is 3', () => {
      const { container } = render(<TrafficLight countdown={3} />);
      const lights = container.querySelectorAll('.rounded-full');

      expect(lights[0]).toHaveClass('animate-pulse');
      expect(lights[0]).toHaveClass('scale-110');
    });
  });

  describe('light indicators - countdown >= 4 (No lights)', () => {
    it('should show no lights when countdown is 4', () => {
      const { container } = render(<TrafficLight countdown={4} />);
      const lights = container.querySelectorAll('.rounded-full');

      lights.forEach((light) => {
        expect(light).toHaveClass('scale-90');
        expect(light).not.toHaveClass('scale-110');
        expect(light).not.toHaveClass('scale-125');
      });
    });

    it('should show no lights when countdown is higher', () => {
      const { container } = render(<TrafficLight countdown={10} />);
      const lights = container.querySelectorAll('.rounded-full');

      lights.forEach((light) => {
        expect(light).not.toHaveClass('bg-red-500');
        expect(light).not.toHaveClass('bg-yellow-400');
        expect(light).not.toHaveClass('bg-green-400');
      });
    });
  });

  describe('positioning and layout', () => {
    it('should be absolutely positioned at center', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const wrapper = container.querySelector('.absolute');

      expect(wrapper).toHaveClass('absolute');
      expect(wrapper).toHaveClass('top-1/2');
      expect(wrapper).toHaveClass('left-1/2');
      expect(wrapper).toHaveClass('z-20');
      expect(wrapper).toHaveClass('-translate-x-1/2');
      expect(wrapper).toHaveClass('-translate-y-1/2');
      expect(wrapper).toHaveClass('transform');
    });

    it('should have horizontal flex layout for lights', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const lightsContainer = container.querySelector('.flex');

      expect(lightsContainer).toHaveClass('flex');
      expect(lightsContainer).toHaveClass('items-center');
      expect(lightsContainer).toHaveClass('space-x-1');
    });

    it('should have dark gray housing', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const lightsContainer = container.querySelector('.flex');

      expect(lightsContainer).toHaveClass('rounded-lg');
      expect(lightsContainer).toHaveClass('bg-gray-900');
      expect(lightsContainer).toHaveClass('p-2');
      expect(lightsContainer).toHaveClass('shadow-lg');
    });
  });

  describe('light styling', () => {
    it('should have circular lights with borders', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const lights = container.querySelectorAll('.rounded-full');

      lights.forEach((light) => {
        expect(light).toHaveClass('h-4');
        expect(light).toHaveClass('w-4');
        expect(light).toHaveClass('rounded-full');
        expect(light).toHaveClass('border-2');
      });
    });

    it('should have transition effects on lights', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const lights = container.querySelectorAll('.rounded-full');

      lights.forEach((light) => {
        expect(light).toHaveClass('transition-all');
        expect(light).toHaveClass('duration-500');
      });
    });

    it('should have dimmed borders for inactive lights', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const lights = container.querySelectorAll('.rounded-full');

      // Red light (inactive)
      expect(lights[0]).toHaveClass('border-red-900');
      // Yellow light (inactive)
      expect(lights[1]).toHaveClass('border-yellow-900');
      // Green light (active)
      expect(lights[2]).toHaveClass('border-green-600');
    });

    it('should have bright borders for active lights', () => {
      const { container } = render(<TrafficLight countdown={2} />);
      const lights = container.querySelectorAll('.rounded-full');

      // Red light (active)
      expect(lights[0]).toHaveClass('border-red-600');
      // Yellow light (active)
      expect(lights[1]).toHaveClass('border-yellow-600');
    });
  });

  describe('memoization', () => {
    it('should render correctly multiple times', () => {
      const { container, rerender } = render(<TrafficLight countdown={3} />);

      let lights = container.querySelectorAll('.rounded-full');
      expect(lights[0]).toHaveClass('bg-red-500');

      rerender(<TrafficLight countdown={1} />);

      lights = container.querySelectorAll('.rounded-full');
      expect(lights[2]).toHaveClass('bg-green-400');
    });
  });

  describe('edge cases', () => {
    it('should handle prop updates from countdown 3 to 1', () => {
      const { container, rerender } = render(<TrafficLight countdown={3} />);

      let lights = container.querySelectorAll('.rounded-full');
      expect(lights[0]).toHaveClass('bg-red-500');

      rerender(<TrafficLight countdown={1} />);

      lights = container.querySelectorAll('.rounded-full');
      expect(lights[2]).toHaveClass('bg-green-400');
    });

    it('should handle prop updates from countdown 1 to 0', () => {
      const { container, rerender } = render(<TrafficLight countdown={1} />);
      expect(container.querySelector('.rounded-full')).toBeInTheDocument();

      rerender(<TrafficLight countdown={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('should handle null countdown gracefully', () => {
      const { container } = render(<TrafficLight countdown={null as any} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should render lights as decorative elements', () => {
      const { container } = render(<TrafficLight countdown={1} />);
      const lights = container.querySelectorAll('.rounded-full');

      lights.forEach((light) => {
        // Lights should not have roles or labels as they are visual indicators
        expect(light.getAttribute('role')).toBeNull();
      });
    });
  });
});
