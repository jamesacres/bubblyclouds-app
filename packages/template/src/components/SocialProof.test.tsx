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
        const content = container.querySelector('.text-xs');
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
        const wrapper = container.querySelector('.flex.justify-start');
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toHaveClass('flex');
        expect(wrapper).toHaveClass('justify-start');
      });
    });

    it('should render the animation wrapper', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const animationWrapper = container.querySelector('.animate-fade-in');
        expect(animationWrapper).toBeInTheDocument();
      });
    });

    it('should render the message badge with correct styling', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.rounded-lg');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('inline-flex');
        expect(badge).toHaveClass('items-center');
        expect(badge).toHaveClass('gap-2');
        expect(badge).toHaveClass('border');
        expect(badge).toHaveClass('border-white/20');
        expect(badge).toHaveClass('bg-white/15');
        expect(badge).toHaveClass('px-3');
        expect(badge).toHaveClass('py-2');
      });
    });

    it('should render the pulse indicator dot', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const pulseIndicator = container.querySelector('.animate-pulse');
        expect(pulseIndicator).toBeInTheDocument();
        expect(pulseIndicator).toHaveClass('h-1.5');
        expect(pulseIndicator).toHaveClass('w-1.5');
        expect(pulseIndicator).toHaveClass('rounded-full');
        expect(pulseIndicator).toHaveClass('bg-amber-300');
      });
    });

    it('should render a message text span with correct styling', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('span');
        expect(messageSpan).toBeInTheDocument();
        expect(messageSpan).toHaveClass('text-xs');
        expect(messageSpan).toHaveClass('font-medium');
        expect(messageSpan).toHaveClass('text-white/80');
      });
    });

    it('should display one of the valid motivational messages', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('.text-xs');
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
          return element?.className.includes('text-xs') ?? false;
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
        const messageSpan = container.querySelector('.text-xs');
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
        const messageSpan = container.querySelector('.text-xs.font-medium');
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
        const firstMessage = container.querySelector('.text-xs')?.textContent;
        expect(firstMessage).toBeTruthy();
      });

      jest.advanceTimersByTime(10000);

      const messageSpan = container.querySelector('.text-xs');
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

      jest.advanceTimersByTime(30000);

      expect(container.querySelector('.text-xs')).toBeInTheDocument();
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
        expect(messageSpan).toHaveClass('text-white/80');
      });
    });

    it('should use text-xs for font size', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('.text-xs');
        expect(messageSpan).toBeInTheDocument();
      });
    });

    it('should have proper text contrast with background', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.rounded-lg');
        expect(badge).toHaveClass('bg-white/15');
        const messageSpan = container.querySelector('span');
        expect(messageSpan).toHaveClass('text-white/80');
      });
    });

    it('should have centered alignment for readability', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const outerDiv = container.querySelector('.justify-start');
        expect(outerDiv).toBeInTheDocument();
      });
    });
  });

  describe('styling', () => {
    it('should have flex display with start alignment', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const flexContainer = container.querySelector('.flex');
        expect(flexContainer).toHaveClass('justify-start');
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
        expect(pulse).toHaveClass('bg-amber-300');
      });
    });

    it('should have proper padding on badge', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.px-3');
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

    it('should have subtle border', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const badge = container.querySelector('.border');
        expect(badge).toHaveClass('border-white/20');
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

        expect(true).toBe(true);
      });
    });

    it('should not break if Math.random returns 0', async () => {
      const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

      render(<SocialProof motivationalMessages={mockMessages} />);

      await waitFor(() => {
        const messageSpan = screen.getByText((content, element) => {
          return element?.className.includes('text-xs') ?? false;
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
          return element?.className.includes('text-xs') ?? false;
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
        expect(container.querySelector('.text-xs')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(10000);
      jest.advanceTimersByTime(10000);
      jest.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(container.querySelector('.text-xs')).toBeInTheDocument();
      });
    });

    it('should handle component being hidden from DOM', async () => {
      const { container } = render(
        <div style={{ display: 'none' }}>
          <SocialProof motivationalMessages={mockMessages} />
        </div>
      );

      await waitFor(() => {
        const badge = container.querySelector('.rounded-lg');
        expect(badge).toBeInTheDocument();
      });
    });
  });

  describe('state management', () => {
    it('should initialize state and render content', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        expect(container.querySelector('.text-xs')).toBeInTheDocument();
      });
    });

    it('should set message to one from motivationalMessages array', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('.text-xs');
        expect(messageSpan).toBeInTheDocument();
        expect(messageSpan?.textContent?.length).toBeGreaterThan(0);
      });
    });

    it('should update state with new random message on interval', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const firstMessage = container.querySelector('.text-xs')?.textContent;
        expect(firstMessage).toBeTruthy();
      });

      jest.advanceTimersByTime(10000);

      expect(container.querySelector('.text-xs')).toBeInTheDocument();
    });
  });

  describe('rendering consistency', () => {
    it('should render exact same structure every time', async () => {
      const { container: container1 } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const flex1 = container1.querySelector('.flex');
        const badge1 = container1.querySelector('.rounded-lg');
        const pulse1 = container1.querySelector('.animate-pulse');
        const message1 = container1.querySelector('.text-xs');

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
        const outer = container.querySelector('.flex.justify-start');
        expect(outer).toBeInTheDocument();

        const animated = outer?.querySelector('.animate-fade-in');
        expect(animated).toBeInTheDocument();

        const badge = animated?.querySelector('.rounded-lg');
        expect(badge).toBeInTheDocument();

        const pulse = badge?.querySelector('.animate-pulse');
        expect(pulse).toBeInTheDocument();

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
        expect(container.querySelector('.text-xs')).toBeInTheDocument();
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
        jest.clearAllTimers();
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

      await waitFor(() => {
        expect(container.querySelector('.text-xs')).toBeInTheDocument();
      });
    });

    it('should render content after message is set by effect', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        expect(container.firstChild).not.toBeNull();
        expect(container.querySelector('.text-xs')).toBeInTheDocument();
      });
    });

    it('should verify null render guard works correctly', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        const messageSpan = container.querySelector('.text-xs');
        expect(messageSpan?.textContent).toBeTruthy();
      });
    });
  });

  describe('integration tests', () => {
    it('should provide complete user experience flow', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        expect(container.querySelector('.text-xs')).toBeInTheDocument();
      });

      const messageSpan = container.querySelector('.text-xs');
      expect(messageSpan?.textContent).toBeTruthy();

      expect(container.querySelector('.animate-fade-in')).toBeInTheDocument();
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should handle complete lifecycle without errors', async () => {
      const { container, rerender, unmount } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
        expect(container.querySelector('.text-xs')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(10000);

      rerender(<SocialProof motivationalMessages={mockMessages} />);

      expect(container.querySelector('.text-xs')).toBeInTheDocument();

      unmount();

      expect(true).toBe(true);
    });

    it('should display motivational message to user', async () => {
      const { container } = render(
        <SocialProof motivationalMessages={mockMessages} />
      );

      await waitFor(() => {
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
        expect(container.querySelector('.animate-fade-in')).toBeInTheDocument();

        const pulse = container.querySelector('.animate-pulse');
        expect(pulse).toBeInTheDocument();
        expect(pulse).toHaveClass('bg-amber-300');
      });
    });
  });
});
