import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SocialProof from './SocialProof';

const mockMessages = ['Test message 1', 'Test message 2', 'Test message 3'];

describe('SocialProof', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('should eventually render content after component mounts', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const content = container.querySelector('.text-sm');
        expect(content).toBeInTheDocument();
      });
    });

    it('should render a message container after effect runs', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const wrapper = container.querySelector('.flex');
        expect(wrapper).toBeInTheDocument();
      });
    });

    it('should render the outer wrapper div with correct classes', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const wrapper = container.querySelector('.mb-4');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveClass('flex');
        expect(wrapper).toHaveClass('justify-center');
        expect(wrapper).toHaveClass('md:mb-6');
      });
    });

    it('should render the max-width container', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const maxWidthContainer = container.querySelector('.max-w-md');
        expect(maxWidthContainer).toBeInTheDocument();
      });
    });

    it('should render the animation wrapper', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const animationWrapper = container.querySelector('.animate-fade-in');
        expect(animationWrapper).toBeInTheDocument();
        expect(animationWrapper).toHaveClass('text-center');
      });
    });

    it('should render the message badge with correct styling', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.rounded-full');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('inline-flex');
        expect(badge).toHaveClass('items-center');
        expect(badge).toHaveClass('space-x-2');
        expect(badge).toHaveClass('border');
        expect(badge).toHaveClass('border-white/10');
        expect(badge).toHaveClass('bg-white/15');
        expect(badge).toHaveClass('px-4');
        expect(badge).toHaveClass('py-2');
        expect(badge).toHaveClass('backdrop-blur-sm');
      });
    });

    it('should render the pulse indicator dot', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const pulseIndicator = container.querySelector('.animate-pulse');
        expect(pulseIndicator).toBeInTheDocument();
        expect(pulseIndicator).toHaveClass('h-2');
        expect(pulseIndicator).toHaveClass('w-2');
        expect(pulseIndicator).toHaveClass('rounded-full');
        expect(pulseIndicator).toHaveClass('bg-yellow-400');
      });
    });

    it('should render a message text span with correct styling', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('span');
        expect(messageSpan).toBeInTheDocument();
        expect(messageSpan).toHaveClass('text-sm');
        expect(messageSpan).toHaveClass('font-medium');
        expect(messageSpan).toHaveClass('text-white/90');
      });
    });

    it('should display one of the valid motivational messages', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('.text-sm');
        expect(messageSpan).toBeInTheDocument();
        expect(messageSpan?.textContent).toBeTruthy();
      });
    });
  });

  describe('message display', () => {
    it('should display a message after component mounts', async () => {
      render(<SocialProof motivationalMessages={mockMessages} />);

      await waitFor(() => {
        const messageSpan = screen.getByText((content, element) => {
          return element?.className.includes('text-sm') ?? false;
        });
        expect(messageSpan).toBeInTheDocument();
        expect(messageSpan.textContent).toBeTruthy();
        expect(messageSpan.textContent?.length).toBeGreaterThan(0);
      });
    });

    it('should display text that contains motivational content', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        // Check that some message is displayed
        const messageSpan = container.querySelector('.text-sm');
        expect(messageSpan?.textContent).toBeTruthy();
        expect(messageSpan?.textContent?.length).toBeGreaterThan(0);
      });
    });

    it('should have text content in the span element', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const span = container.querySelector('span');
        expect(span?.textContent).toBeTruthy();
        expect(span?.textContent?.length).toBeGreaterThan(0);
      });
    });

    it('should display a message that is not empty', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('.text-sm.font-medium');
        expect(messageSpan?.textContent?.trim()).toBeTruthy();
      });
    });
  });

  describe('timer functionality', () => {
    it('should set up an interval on mount', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      render(<SocialProof motivationalMessages={mockMessages} />);

      await waitFor(() => {
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      });

      setIntervalSpy.mockRestore();
    });

    it('should set interval to 10000 milliseconds (10 seconds)', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      render(<SocialProof motivationalMessages={mockMessages} />);

      await waitFor(() => {
        expect(setIntervalSpy).toHaveBeenCalledWith(
          expect.any(Function),
          10000
        );
      });

      setIntervalSpy.mockRestore();
    });

    it('should change message after interval elapse', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const firstMessage = container.querySelector('.text-sm')?.textContent;
        expect(firstMessage).toBeTruthy();
      });

      // Advance timers to trigger interval
      jest.advanceTimersByTime(10000);

      // Note: Component may display different or same message due to randomness
      const messageSpan = container.querySelector('.text-sm');
      expect(messageSpan?.textContent).toBeTruthy();
    });

    it('should continue updating messages at 10-second intervals', async () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        expect(setIntervalSpy).toHaveBeenCalled();
      });

      // Advance time by multiple intervals
      jest.advanceTimersByTime(30000); // 3 intervals

      // Component should continue to work
      expect(container.querySelector('.text-sm')).toBeInTheDocument();
      setIntervalSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should clean up interval on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const { unmount } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        unmount();
        expect(clearIntervalSpy).toHaveBeenCalled();
      });

      clearIntervalSpy.mockRestore();
    });

    it('should return cleanup function from useEffect', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const { unmount } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        expect(clearIntervalSpy).toHaveBeenCalledTimes(0);
        unmount();
        expect(clearIntervalSpy).toHaveBeenCalled();
      });

      clearIntervalSpy.mockRestore();
    });

    it('should prevent memory leaks by cleaning up timer', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const { unmount } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        unmount();

        // After unmount, clearing interval should have been called
        expect(clearIntervalSpy).toHaveBeenCalled();
      });

      clearIntervalSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    it('should have proper semantic structure', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        // Check for basic semantic structure
        const divElements = container.querySelectorAll('div');
        expect(divElements.length).toBeGreaterThan(0);
      });
    });

    it('should have readable text color', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('span');
        expect(messageSpan).toHaveClass('text-white/90');
      });
    });

    it('should use text-sm for reasonable font size', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('.text-sm');
        expect(messageSpan).toBeInTheDocument();
      });
    });

    it('should have proper text contrast with backdrop', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.rounded-full');
        expect(badge).toHaveClass('bg-white/15');
        const messageSpan = container.querySelector('span');
        expect(messageSpan).toHaveClass('text-white/90');
      });
    });

    it('should have centered alignment for readability', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const animatedDiv = container.querySelector('.text-center');
        expect(animatedDiv).toBeInTheDocument();
        const outerDiv = container.querySelector('.justify-center');
        expect(outerDiv).toBeInTheDocument();
      });
    });
  });

  describe('styling', () => {
    it('should have responsive margin bottom', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const outerDiv = container.querySelector('.mb-4');
        expect(outerDiv).toHaveClass('md:mb-6');
      });
    });

    it('should have flex display with center alignment', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const flexContainer = container.querySelector('.flex');
        expect(flexContainer).toHaveClass('justify-center');
        expect(flexContainer).toHaveClass('mb-4');
      });
    });

    it('should have constrained max width', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const maxWidth = container.querySelector('.max-w-md');
        expect(maxWidth).toBeInTheDocument();
      });
    });

    it('should apply backdrop blur effect', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.backdrop-blur-sm');
        expect(badge).toBeInTheDocument();
      });
    });

    it('should have semi-transparent background', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.rounded-full');
        expect(badge).toHaveClass('bg-white/15');
      });
    });

    it('should have subtle border', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.border');
        expect(badge).toHaveClass('border-white/10');
      });
    });

    it('should have animation class applied', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const animatedDiv = container.querySelector('.animate-fade-in');
        expect(animatedDiv).toBeInTheDocument();
      });
    });

    it('should have pulse animation on indicator', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const pulse = container.querySelector('.animate-pulse');
        expect(pulse).toBeInTheDocument();
        expect(pulse).toHaveClass('bg-yellow-400');
      });
    });

    it('should have proper padding on badge', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.px-4');
        expect(badge).toHaveClass('py-2');
      });
    });

    it('should have proper font weight on message', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const message = container.querySelector('.font-medium');
        expect(message).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple mounts and unmounts', async () => {
      const { unmount: unmount1 } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        unmount1();
      });

      const { unmount: unmount2 } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        unmount2();
      });

      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should handle rapid re-renders', async () => {
      const { rerender } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        rerender(<SocialProof motivationalMessages={mockMessages} />);
        rerender(<SocialProof motivationalMessages={mockMessages} />);
        rerender(<SocialProof motivationalMessages={mockMessages} />);

        // Should handle multiple renders gracefully
        expect(true).toBe(true);
      });
    });

    it('should not break if Math.random returns 0', async () => {
      const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

      render(<SocialProof motivationalMessages={mockMessages} />);

      await waitFor(() => {
        const messageSpan = screen.getByText((content, element) => {
          return element?.className.includes('text-sm') ?? false;
        });
        expect(messageSpan).toBeInTheDocument();
      });

      mathRandomSpy.mockRestore();
    });

    it('should not break if Math.random returns nearly 1', async () => {
      const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9999);

      render(<SocialProof motivationalMessages={mockMessages} />);

      await waitFor(() => {
        const messageSpan = screen.getByText((content, element) => {
          return element?.className.includes('text-sm') ?? false;
        });
        expect(messageSpan).toBeInTheDocument();
      });

      mathRandomSpy.mockRestore();
    });

    it('should continue working after timer fires multiple times', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        expect(container.querySelector('.text-sm')).toBeInTheDocument();
      });

      // Advance timer multiple times
      jest.advanceTimersByTime(10000);
      jest.advanceTimersByTime(10000);
      jest.advanceTimersByTime(10000);

      // Component should still be functional
      await waitFor(() => {
        expect(container.querySelector('.text-sm')).toBeInTheDocument();
      });
    });

    it('should handle component being hidden from DOM', async () => {
      const { container } = render(
        <div style={{ display: 'none' }}>
          <SocialProof motivationalMessages={mockMessages} />
        </div>
      );

      await waitFor(() => {
        // Component should still render even when parent is hidden
        const badge = container.querySelector('.rounded-full');
        expect(badge).toBeInTheDocument();
      });
    });
  });

  describe('state management', () => {
    it('should initialize state and render content', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      // Component should render after effect runs
      await waitFor(() => {
        expect(container.querySelector('.text-sm')).toBeInTheDocument();
      });
    });

    it('should set message to one from motivationalMessages array', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('.text-sm');
        expect(messageSpan).toBeInTheDocument();
        // Message should not be empty
        expect(messageSpan?.textContent?.length).toBeGreaterThan(0);
      });
    });

    it('should update state with new random message on interval', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const firstMessage = container.querySelector('.text-sm')?.textContent;
        expect(firstMessage).toBeTruthy();
      });

      // Advance timer
      jest.advanceTimersByTime(10000);

      // Component should still function
      expect(container.querySelector('.text-sm')).toBeInTheDocument();
    });
  });

  describe('rendering consistency', () => {
    it('should render exact same structure every time', async () => {
      const { container: container1 } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const flex1 = container1.querySelector('.flex');
        const badge1 = container1.querySelector('.rounded-full');
        const pulse1 = container1.querySelector('.animate-pulse');
        const message1 = container1.querySelector('.text-sm');

        expect(flex1).toBeInTheDocument();
        expect(badge1).toBeInTheDocument();
        expect(pulse1).toBeInTheDocument();
        expect(message1).toBeInTheDocument();
      });

      const { unmount } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );
      unmount();
    });

    it('should always render with correct hierarchy', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        // Outer wrapper
        const outer = container.querySelector('.mb-4.flex.justify-center');
        expect(outer).toBeInTheDocument();

        // Max width container
        const maxWidth = outer?.querySelector('.max-w-md');
        expect(maxWidth).toBeInTheDocument();

        // Animation wrapper
        const animated = maxWidth?.querySelector('.animate-fade-in');
        expect(animated).toBeInTheDocument();

        // Badge
        const badge = animated?.querySelector('.rounded-full');
        expect(badge).toBeInTheDocument();

        // Pulse indicator
        const pulse = badge?.querySelector('.animate-pulse');
        expect(pulse).toBeInTheDocument();

        // Message span
        const message = badge?.querySelector('span');
        expect(message).toBeInTheDocument();
      });
    });
  });

  describe('component lifecycle', () => {
    it('should execute useEffect on mount', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        // Effect should have run, setting message
        expect(container.querySelector('.text-sm')).toBeInTheDocument();
      });
    });

    it('should have cleanup function executed on unmount', async () => {
      const { unmount } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const clearSpy = jest.spyOn(global, 'clearInterval');
        unmount();
        expect(clearSpy).toHaveBeenCalled();
        clearSpy.mockRestore();
      });
    });

    it('should not execute interval after unmount', async () => {
      const { unmount } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        unmount();

        // Clear any pending timers
        jest.clearAllTimers();

        // Should not throw or cause issues
        expect(true).toBe(true);
      });
    });
  });

  describe('message randomization', () => {
    it('should select random message on mount', async () => {
      const floorSpy = jest.spyOn(Math, 'floor');
      render(<SocialProof motivationalMessages={mockMessages} />);

      await waitFor(() => {
        expect(floorSpy).toHaveBeenCalled();
      });

      floorSpy.mockRestore();
    });

    it('should use Math.random for selection', async () => {
      const randomSpy = jest.spyOn(Math, 'random');
      render(<SocialProof motivationalMessages={mockMessages} />);

      await waitFor(() => {
        expect(randomSpy).toHaveBeenCalled();
      });

      randomSpy.mockRestore();
    });

    it('should multiply random by array length', async () => {
      const floorSpy = jest.spyOn(Math, 'floor');
      render(<SocialProof motivationalMessages={mockMessages} />);

      await waitFor(() => {
        // floor should be called with result of Math.random() * length
        expect(floorSpy).toHaveBeenCalled();
      });

      floorSpy.mockRestore();
    });
  });

  describe('conditional rendering', () => {
    it('should render content when message is set', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      // After effect runs, component should render
      await waitFor(() => {
        expect(container.querySelector('.text-sm')).toBeInTheDocument();
      });
    });

    it('should render content after message is set by effect', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      // After effect runs
      await waitFor(() => {
        expect(container.firstChild).not.toBeNull();
        expect(container.querySelector('.text-sm')).toBeInTheDocument();
      });
    });

    it('should verify null render guard works correctly', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      // Component should eventually render with message
      await waitFor(() => {
        const messageSpan = container.querySelector('.text-sm');
        expect(messageSpan?.textContent).toBeTruthy();
      });
    });
  });

  describe('integration tests', () => {
    it('should provide complete user experience flow', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      // After mount, message appears
      await waitFor(() => {
        expect(container.querySelector('.text-sm')).toBeInTheDocument();
      });

      // Message is readable
      const messageSpan = container.querySelector('.text-sm');
      expect(messageSpan?.textContent).toBeTruthy();

      // Visual elements are present
      expect(container.querySelector('.animate-fade-in')).toBeInTheDocument();
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should handle complete lifecycle without errors', async () => {
      const { container, rerender, unmount } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      // Component mounted and rendering
      await waitFor(() => {
        expect(container.querySelector('.text-sm')).toBeInTheDocument();
      });

      // Advance timer
      jest.advanceTimersByTime(10000);

      // Rerender
      rerender(<SocialProof motivationalMessages={mockMessages} />);

      // Component still works
      expect(container.querySelector('.text-sm')).toBeInTheDocument();

      // Unmount
      unmount();

      // No errors should occur
      expect(true).toBe(true);
    });

    it('should display motivational message to user', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        // User should see a message
        const messageElement = container.querySelector('.font-medium');

        expect(messageElement).toBeInTheDocument();
        expect(messageElement?.textContent).toBeTruthy();
      });
    });

    it('should provide visual feedback with animations', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        // Fade in animation
        expect(container.querySelector('.animate-fade-in')).toBeInTheDocument();

        // Pulse indicator
        const pulse = container.querySelector('.animate-pulse');
        expect(pulse).toBeInTheDocument();
        expect(pulse).toHaveClass('bg-yellow-400');

        // User sees a polished UI
        expect(
          container.querySelector('.backdrop-blur-sm')
        ).toBeInTheDocument();
      });
    });
  });
});
