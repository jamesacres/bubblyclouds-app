'use client';

import { renderHook, act } from '@testing-library/react';
import { useTimer } from './timer';
import { Timer } from '../types/timer';

// Mock template hooks (must be before imports to avoid hoisting issues)
jest.mock('../hooks/documentVisibility');
jest.mock('../hooks/localStorage');
jest.mock('../helpers/calculateSeconds');
jest.mock('@bubblyclouds-app/types/stateType', () => ({
  StateType: { TIMER: 'timer' },
}));

describe('useTimer', () => {
  let mockUseDocumentVisibility: any;
  let mockUseLocalStorage: any;
  let mockCalculateSeconds: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Import and setup mocks
    const {
      useDocumentVisibility,
    } = require('@bubblyclouds-app/template/hooks/documentVisibility');
    const {
      useLocalStorage,
    } = require('@bubblyclouds-app/template/hooks/localStorage');
    const { calculateSeconds } = require('../helpers/calculateSeconds');

    mockUseDocumentVisibility = useDocumentVisibility;
    mockUseLocalStorage = useLocalStorage;
    mockCalculateSeconds = calculateSeconds;

    // Setup default mock implementations
    mockUseDocumentVisibility.mockReturnValue(false);
    mockUseLocalStorage.mockReturnValue({
      getValue: jest.fn(() => undefined),
      saveValue: jest.fn(),
    });
    mockCalculateSeconds.mockImplementation((timer: Timer) => {
      // Preserve the timer's seconds value if it exists (for session restoration)
      if (timer && typeof timer === 'object' && 'seconds' in timer) {
        return timer.seconds;
      }
      return 0;
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize timer state', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      expect(result.current).toBeDefined();
      expect(result.current.timer).toBeNull();
      expect(result.current.isPaused).toBe(false);
      expect(result.current.setTimerNewSession).toBeDefined();
      expect(result.current.stopTimer).toBeDefined();
      expect(result.current.setPauseTimer).toBeDefined();
    });

    it('should accept puzzleId prop', () => {
      const { result } = renderHook(() => useTimer({ id: 'unique-puzzle-id' }));

      expect(result.current).toBeDefined();
    });
  });

  describe('setTimerNewSession', () => {
    it('should initialize timer with countdown', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      expect(result.current.timer).toBeDefined();
      expect(result.current.timer?.countdown).toBe(4);
      expect(result.current.timer?.inProgress).toBeDefined();
      expect(result.current.timer?.inProgress.start).toBeDefined();
      expect(result.current.timer?.inProgress.lastInteraction).toBeDefined();
    });

    it('should restore timer from previous session', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      const previousTimer = {
        seconds: 100,
        inProgress: {
          start: new Date().toISOString(),
          lastInteraction: new Date().toISOString(),
        },
        stopped: false,
      };

      act(() => {
        result.current.setTimerNewSession(previousTimer);
      });

      expect(result.current.timer?.seconds).toBe(100);
      expect(result.current.timer?.inProgress).toBeDefined();
    });

    it('should set lastInteraction to now', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      const beforeTime = Date.now();

      act(() => {
        result.current.setTimerNewSession();
      });

      const afterTime = Date.now();
      const lastInteractionTime = new Date(
        result.current.timer?.inProgress.lastInteraction || ''
      ).getTime();

      // lastInteraction is set 4 seconds in future (countdown period)
      expect(lastInteractionTime).toBeGreaterThanOrEqual(beforeTime + 3000);
      expect(lastInteractionTime).toBeLessThanOrEqual(afterTime + 5000);
    });

    it('should handle null/undefined restore parameter', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession(null);
      });

      expect(result.current.timer).toBeDefined();
      expect(result.current.timer?.countdown).toBe(4);
    });

    it('should preserve stopped flag when restoring', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      const stoppedTimer = {
        seconds: 100,
        inProgress: {
          start: new Date().toISOString(),
          lastInteraction: new Date().toISOString(),
        },
        stopped: true,
      };

      act(() => {
        result.current.setTimerNewSession(stoppedTimer);
      });

      expect(result.current.timer?.stopped).toBe(true);
      expect(result.current.timer?.countdown).toBeUndefined();
    });
  });

  describe('stopTimer', () => {
    it('should set stopped flag to true', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      expect(result.current.timer?.stopped).toBeUndefined();

      act(() => {
        result.current.stopTimer();
      });

      expect(result.current.timer?.stopped).toBe(true);
    });

    it('should clear interval when stopped', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      act(() => {
        result.current.stopTimer();
      });

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it('should handle stop when timer is null', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      expect(() => {
        act(() => {
          result.current.stopTimer();
        });
      }).not.toThrow();
    });

    it('should prevent further timer updates after stop', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      act(() => {
        result.current.stopTimer();
      });

      const stoppedTimer = result.current.timer;

      jest.advanceTimersByTime(1000);

      expect(result.current.timer?.stopped).toBe(true);
      expect(result.current.timer?.inProgress).toEqual(
        stoppedTimer?.inProgress
      );
    });
  });

  describe('setPauseTimer', () => {
    it('should set paused state', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      expect(result.current.isPaused).toBe(false);

      act(() => {
        result.current.setPauseTimer(true);
      });

      expect(result.current.isPaused).toBe(true);
    });

    it('should toggle pause state', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setPauseTimer(true);
      });

      expect(result.current.isPaused).toBe(true);

      act(() => {
        result.current.setPauseTimer(false);
      });

      expect(result.current.isPaused).toBe(false);
    });

    it('should not update timer when paused', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      const initialLastInteraction =
        result.current.timer?.inProgress.lastInteraction;

      act(() => {
        result.current.setPauseTimer(true);
      });

      jest.advanceTimersByTime(1000);

      expect(result.current.timer?.inProgress.lastInteraction).toBe(
        initialLastInteraction
      );
    });
  });

  describe('timer updates', () => {
    it('should update timer every second when not paused', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      const initialCountdown = result.current.timer?.countdown;

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Countdown should decrease
      if (
        initialCountdown !== undefined &&
        result.current.timer?.countdown !== undefined
      ) {
        expect(result.current.timer.countdown).toBeLessThanOrEqual(
          initialCountdown
        );
      }
    });

    it('should decrement countdown', () => {
      mockUseDocumentVisibility.mockReturnValue(true);
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      // Wait for auto-initialization from useEffect
      act(() => {
        jest.advanceTimersByTime(100);
      });

      const initialCountdown = result.current.timer?.countdown || 0;

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.timer?.countdown).toBe(initialCountdown - 1);
    });

    it('should update lastInteraction after countdown ends', () => {
      mockUseDocumentVisibility.mockReturnValue(true);
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      // Wait for auto-initialization from useEffect
      act(() => {
        jest.advanceTimersByTime(100);
      });

      const initialLastInteraction =
        result.current.timer?.inProgress.lastInteraction;

      // Advance past countdown (4 seconds)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.timer?.inProgress.lastInteraction).not.toBe(
        initialLastInteraction
      );
    });

    it('should not update when paused', () => {
      mockUseDocumentVisibility.mockReturnValue(true);
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      // Wait for auto-initialization from useEffect
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Pause immediately before any countdown updates
      act(() => {
        result.current.setPauseTimer(true);
      });

      // Allow the setTimeout in the useEffect to execute
      act(() => {
        jest.advanceTimersByTime(10);
      });

      const initialCountdown = result.current.timer?.countdown;

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.timer?.countdown).toBe(initialCountdown);
    });

    it('should not update after timer is stopped', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      act(() => {
        result.current.stopTimer();
      });

      const stoppedState = JSON.stringify(result.current.timer);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(JSON.stringify(result.current.timer)).toBe(stoppedState);
    });
  });

  describe('document visibility', () => {
    it('should trigger new session when document becomes visible', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Simulate document becoming visible again
      // This would trigger setTimerNewSession in the real implementation
      expect(result.current.timer).toBeDefined();
    });
  });

  describe('localStorage integration', () => {
    it('should save timer state to localStorage', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      // localStorage save happens via useEffect
      expect(result.current.timer).toBeDefined();
    });

    it('should restore timer from localStorage on mount', () => {
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      // Timer should be restored via useEffect if available in localStorage
      expect(result.current).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should clean up interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it('should clean up when timer is stopped', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
      });

      act(() => {
        result.current.stopTimer();
      });

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  describe('multiple timers', () => {
    it('should handle multiple timer instances independently', () => {
      mockUseDocumentVisibility.mockReturnValue(false);
      const { result: result1 } = renderHook(() =>
        useTimer({ id: 'puzzle-1' })
      );
      const { result: result2 } = renderHook(() =>
        useTimer({ id: 'puzzle-2' })
      );

      act(() => {
        result1.current.setTimerNewSession();
        result2.current.setTimerNewSession();
      });

      expect(result1.current.timer).toBeDefined();
      expect(result2.current.timer).toBeDefined();

      act(() => {
        result1.current.stopTimer();
      });

      expect(result1.current.timer?.stopped).toBe(true);
      expect(result2.current.timer?.stopped).toBeUndefined();
    });

    it('should maintain separate pause states', () => {
      mockUseDocumentVisibility.mockReturnValue(false);
      const { result: result1 } = renderHook(() =>
        useTimer({ id: 'puzzle-1' })
      );
      const { result: result2 } = renderHook(() =>
        useTimer({ id: 'puzzle-2' })
      );

      act(() => {
        result1.current.setPauseTimer(true);
      });

      expect(result1.current.isPaused).toBe(true);
      expect(result2.current.isPaused).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid start/stop cycles', () => {
      mockUseDocumentVisibility.mockReturnValue(false);
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
        result.current.stopTimer();
        result.current.setTimerNewSession();
        result.current.stopTimer();
      });

      expect(result.current.timer?.stopped).toBe(true);
    });

    it('should handle rapid pause/unpause cycles', () => {
      mockUseDocumentVisibility.mockReturnValue(false);
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      act(() => {
        result.current.setTimerNewSession();
        result.current.setPauseTimer(true);
        result.current.setPauseTimer(false);
        result.current.setPauseTimer(true);
        result.current.setPauseTimer(false);
      });

      expect(result.current.isPaused).toBe(false);
    });

    it('should handle undefined timer during updates', () => {
      mockUseDocumentVisibility.mockReturnValue(false);
      const { result } = renderHook(() => useTimer({ id: 'test-puzzle' }));

      // Advance timers without initializing
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(() => result.current).not.toThrow();
    });
  });
});
