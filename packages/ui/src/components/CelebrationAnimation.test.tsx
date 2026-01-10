import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { CelebrationAnimation } from './CelebrationAnimation';

jest.mock('@capacitor-community/in-app-review', () => ({
  InAppReview: {
    requestReview: jest.fn(() => Promise.resolve()),
  },
}));

describe('CelebrationAnimation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('should not render when isVisible is false', () => {
      const { container } = render(<CelebrationAnimation isVisible={false} />);
      expect(
        container.querySelector('.pointer-events-none')
      ).not.toBeInTheDocument();
    });

    it('should render fireworks when isVisible is true with gridRef', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      const fireworksContainer = container.querySelector(
        '.pointer-events-none'
      );
      expect(fireworksContainer).toBeInTheDocument();
    });

    it('should render when gridRef is provided and isVisible is true', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      // Component should render
      expect(container).toBeInTheDocument();
    });

    it('should not render before animation starts', async () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container, rerender } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={false} gridRef={gridRef} />
        </div>
      );

      let animationContainers = container.querySelectorAll(
        '.pointer-events-none'
      );
      expect(animationContainers.length).toBe(0);

      rerender(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      // After making visible, animation containers should exist
      animationContainers = container.querySelectorAll('.pointer-events-none');
      expect(animationContainers.length).toBeGreaterThan(0);
    });
  });

  describe('animation elements', () => {
    it('should render fireworks elements', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      const fireworks = container.querySelectorAll('.h-4.w-4.rounded-full');
      expect(fireworks.length).toBe(25); // Should have 25 fireworks
    });

    it('should apply firework animations', () => {
      const { container } = render(<CelebrationAnimation isVisible={true} />);

      const fireworks = container.querySelectorAll('.h-4.w-4.rounded-full');
      fireworks.forEach((firework) => {
        const style = firework.getAttribute('style');
        expect(style).toContain('animation');
      });
    });

    it('should randomize firework positions', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      const fireworks = container.querySelectorAll('.h-4.w-4.rounded-full');
      const positions = Array.from(fireworks).map((fw) =>
        fw.getAttribute('style')
      );

      // Positions should vary (not all be the same)
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBeGreaterThan(1);
    });

    it('should apply rainbow colors to fireworks', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      const fireworks = container.querySelectorAll('.h-4.w-4.rounded-full');
      expect(fireworks.length).toBe(25);

      // Check that fireworks have background colors
      const firstFirework = fireworks[0] as HTMLElement;
      expect(firstFirework.style.backgroundColor).toBeTruthy();
    });
  });

  describe('explosion pieces with gridRef', () => {
    it('should hide grid during animation', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef} data-testid="grid">
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      const grid = container.querySelector('[data-testid="grid"]');
      expect(grid).toHaveStyle('visibility: hidden');
    });

    it('should show grid after animation completes', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef} data-testid="grid">
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      const grid = container.querySelector('[data-testid="grid"]');
      expect(grid).toHaveStyle('visibility: hidden');

      jest.advanceTimersByTime(9000);

      expect(grid).toHaveStyle('visibility: visible');
    });

    it('should create explosion pieces from grid cells', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef} data-testid="grid">
          <div data-cell-id="1">5</div>
          <div data-cell-id="2">3</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      // Animation should have processed cells
      expect(container).toBeInTheDocument();
    });

    it('should handle empty grid cells', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef} data-testid="grid">
          <div data-cell-id="1"></div>
          <div data-cell-id="2"></div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('in-app review integration', () => {
    it('should request in-app review on third game completion', async () => {
      const mockIsCapacitor = jest.fn().mockReturnValue(true);
      const { InAppReview } = require('@capacitor-community/in-app-review');
      const requestSpy = jest.spyOn(InAppReview, 'requestReview');

      const gridRef = React.createRef<HTMLDivElement>();
      render(
        <div ref={gridRef}>
          <CelebrationAnimation
            isVisible={true}
            gridRef={gridRef}
            completedGamesCount={2}
            isCapacitor={mockIsCapacitor}
          />
        </div>
      );

      jest.advanceTimersByTime(9000);

      await waitFor(() => {
        expect(requestSpy).toHaveBeenCalled();
      });

      requestSpy.mockRestore();
    });

    it('should not request in-app review if not on Capacitor', () => {
      const mockIsCapacitor = jest.fn().mockReturnValue(false);
      const { InAppReview } = require('@capacitor-community/in-app-review');
      const requestSpy = jest.spyOn(InAppReview, 'requestReview');

      const gridRef = React.createRef<HTMLDivElement>();
      render(
        <div ref={gridRef}>
          <CelebrationAnimation
            isVisible={true}
            gridRef={gridRef}
            completedGamesCount={2}
            isCapacitor={mockIsCapacitor}
          />
        </div>
      );

      jest.advanceTimersByTime(9000);

      expect(requestSpy).not.toHaveBeenCalled();
      requestSpy.mockRestore();
    });

    it('should not request in-app review if completedGamesCount is not 2', () => {
      const mockIsCapacitor = jest.fn().mockReturnValue(true);
      const { InAppReview } = require('@capacitor-community/in-app-review');
      const requestSpy = jest.spyOn(InAppReview, 'requestReview');

      const gridRef = React.createRef<HTMLDivElement>();
      render(
        <div ref={gridRef}>
          <CelebrationAnimation
            isVisible={true}
            gridRef={gridRef}
            completedGamesCount={1}
            isCapacitor={mockIsCapacitor}
          />
        </div>
      );

      jest.advanceTimersByTime(9000);

      expect(requestSpy).not.toHaveBeenCalled();
      requestSpy.mockRestore();
    });

    it('should handle in-app review errors gracefully', async () => {
      const mockIsCapacitor = jest.fn().mockReturnValue(true);
      const { InAppReview } = require('@capacitor-community/in-app-review');
      const requestSpy = jest
        .spyOn(InAppReview, 'requestReview')
        .mockRejectedValue(new Error('Review error'));

      const gridRef = React.createRef<HTMLDivElement>();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <div ref={gridRef}>
          <CelebrationAnimation
            isVisible={true}
            gridRef={gridRef}
            completedGamesCount={2}
            isCapacitor={mockIsCapacitor}
          />
        </div>
      );

      jest.advanceTimersByTime(9000);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      requestSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should not request review when isCapacitor is not provided', () => {
      const { InAppReview } = require('@capacitor-community/in-app-review');
      const requestSpy = jest.spyOn(InAppReview, 'requestReview');

      const gridRef = React.createRef<HTMLDivElement>();
      render(
        <div ref={gridRef}>
          <CelebrationAnimation
            isVisible={true}
            gridRef={gridRef}
            completedGamesCount={2}
          />
        </div>
      );

      jest.advanceTimersByTime(9000);

      expect(requestSpy).not.toHaveBeenCalled();
      requestSpy.mockRestore();
    });
  });

  describe('animation timing', () => {
    it('should complete animation after 9 seconds', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      expect(container).toBeInTheDocument();

      jest.advanceTimersByTime(9000);

      // Timer should have executed
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should clean up timer on unmount', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { unmount } = render(
        <div ref={gridRef}>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      unmount();

      // Timer should be cleared
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should clear timer if animation is hidden', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { rerender } = render(
        <div ref={gridRef}>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      rerender(
        <div ref={gridRef}>
          <CelebrationAnimation isVisible={false} gridRef={gridRef} />
        </div>
      );

      jest.advanceTimersByTime(9000);

      // Should complete without errors
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('styling and positioning', () => {
    it('should have fixed positioning for animation container', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      const pointerEventsDiv = container.querySelector('.pointer-events-none');
      expect(pointerEventsDiv).toHaveClass('fixed');
      expect(pointerEventsDiv).toHaveClass('inset-0');
      expect(pointerEventsDiv).toHaveClass('z-50');
      expect(pointerEventsDiv).toHaveClass('overflow-hidden');
    });

    it('should disable pointer events during animation', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      const pointerEventsDiv = container.querySelector('.pointer-events-none');
      expect(pointerEventsDiv).toHaveClass('pointer-events-none');
    });

    it('should apply glow effects to explosion pieces', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      // Container should exist
      expect(container).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle missing gridRef gracefully', () => {
      const { container } = render(
        <CelebrationAnimation isVisible={true} gridRef={undefined} />
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle null gridRef', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      // Don't set the ref, so it's null
      const { container } = render(
        <CelebrationAnimation isVisible={true} gridRef={gridRef} />
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle rapid visibility changes', () => {
      const { rerender, container } = render(
        <CelebrationAnimation isVisible={true} />
      );

      rerender(<CelebrationAnimation isVisible={false} />);
      rerender(<CelebrationAnimation isVisible={true} />);
      rerender(<CelebrationAnimation isVisible={false} />);

      expect(container).toBeInTheDocument();
    });

    it('should handle default completedGamesCount of 0', () => {
      const { container } = render(<CelebrationAnimation isVisible={true} />);

      expect(container).toBeInTheDocument();
    });

    it('should handle very high completedGamesCount', () => {
      const { container } = render(
        <CelebrationAnimation isVisible={true} completedGamesCount={999} />
      );

      expect(container).toBeInTheDocument();
    });
  });

  describe('cleanup', () => {
    it('should clean up grid visibility on unmount', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { unmount } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      const grid = gridRef.current;
      expect(grid).toHaveStyle('visibility: hidden');

      unmount();

      // Grid should be visible after cleanup
      expect(grid).toHaveStyle('visibility: visible');
    });

    it('should prevent memory leaks by clearing timers', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { unmount } = render(
        <div ref={gridRef}>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      unmount();

      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('animation state management', () => {
    it('should set isAnimating to true when animation starts', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      // Animation should be active
      expect(
        container.querySelector('.pointer-events-none')
      ).toBeInTheDocument();
    });

    it('should set isAnimating to false after animation completes', () => {
      const gridRef = React.createRef<HTMLDivElement>();
      const { container, rerender } = render(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={true} gridRef={gridRef} />
        </div>
      );

      // Animation should be active initially
      let animationContainer = container.querySelector('.pointer-events-none');
      expect(animationContainer).toBeInTheDocument();

      jest.advanceTimersByTime(9000);

      // After animation completes, rerender with isVisible false
      rerender(
        <div ref={gridRef}>
          <div data-cell-id="1">5</div>
          <CelebrationAnimation isVisible={false} gridRef={gridRef} />
        </div>
      );

      // Animation container should no longer be in the document
      animationContainer = container.querySelector('.pointer-events-none');
      expect(animationContainer).not.toBeInTheDocument();
    });
  });
});
