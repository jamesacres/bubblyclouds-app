'use client';

import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from './useWakeLock';

describe('useWakeLock', () => {
  let mockWakeLock: any;
  let mockNavigator: any;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Spy on console methods
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Spy on document event listeners
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    // Create mock wake lock sentinel
    mockWakeLock = {
      released: false,
      type: 'screen',
      release: jest.fn(async () => {
        mockWakeLock.released = true;
      }),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    // Mock navigator.wakeLock
    mockNavigator = {
      request: jest.fn(async () => mockWakeLock),
    };

    // Mock the navigator object
    Object.defineProperty(navigator, 'wakeLock', {
      value: mockNavigator,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();

    // Clean up navigator mock
    delete (navigator as any).wakeLock;
  });

  describe('initialization', () => {
    it('should initialize hook without errors', () => {
      const { result } = renderHook(() => useWakeLock());

      expect(result.current).toBeDefined();
      expect(result.current.requestWakeLock).toBeDefined();
      expect(result.current.releaseWakeLock).toBeDefined();
      expect(result.current.isActive).toBeDefined();
    });

    it('should initialize isActive as false', () => {
      const { result } = renderHook(() => useWakeLock());

      expect(result.current.isActive).toBe(false);
    });

    it('should set up visibility change listener on mount', () => {
      renderHook(() => useWakeLock());

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should clean up visibility change listener on unmount', () => {
      const { unmount } = renderHook(() => useWakeLock());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });
  });

  describe('requestWakeLock', () => {
    it('should request wake lock from navigator', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(mockNavigator.request).toHaveBeenCalledWith('screen');
    });

    it('should return the wake lock sentinel', async () => {
      const { result } = renderHook(() => useWakeLock());

      let returnedWakeLock;
      await act(async () => {
        returnedWakeLock = await result.current.requestWakeLock();
      });

      expect(returnedWakeLock).toEqual(mockWakeLock);
    });

    it('should log info message when wake lock is activated', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith('Screen wake lock activated');
    });

    it('should set up release event listener', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(mockWakeLock.addEventListener).toHaveBeenCalledWith(
        'release',
        expect.any(Function)
      );
    });

    it('should update isActive to true after request', async () => {
      const { result } = renderHook(() => useWakeLock());

      expect(result.current.isActive).toBe(false);

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(result.current.isActive).toBe(true);
    });

    it('should log warning when Wake Lock API is not supported', async () => {
      // Remove wakeLock support
      delete (navigator as any).wakeLock;

      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Wake Lock API not supported in this browser'
      );
    });

    it('should return null when Wake Lock API is not supported', async () => {
      delete (navigator as any).wakeLock;

      const { result } = renderHook(() => useWakeLock());

      let returnedWakeLock;
      await act(async () => {
        returnedWakeLock = await result.current.requestWakeLock();
      });

      expect(returnedWakeLock).toBeNull();
    });

    it('should handle errors during wake lock request', async () => {
      const error = new Error('Wake lock request failed');
      mockNavigator.request.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to activate screen wake lock:',
        error
      );
    });

    it('should return null on error', async () => {
      mockNavigator.request.mockRejectedValueOnce(new Error('Failed'));

      const { result } = renderHook(() => useWakeLock());

      let returnedWakeLock;
      await act(async () => {
        returnedWakeLock = await result.current.requestWakeLock();
      });

      expect(returnedWakeLock).toBeNull();
    });

    it('should handle multiple requests', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      mockWakeLock.released = true;

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(mockNavigator.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('releaseWakeLock', () => {
    it('should call release on wake lock sentinel', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      expect(mockWakeLock.release).toHaveBeenCalled();
    });

    it('should log info message when released', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'Screen wake lock manually released'
      );
    });

    it('should clear wake lock reference after release', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(result.current.isActive).toBe(true);

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should not call release if wake lock is already released', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      mockWakeLock.released = true;

      jest.clearAllMocks();

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      expect(mockWakeLock.release).not.toHaveBeenCalled();
    });

    it('should not call release if wake lock is null', async () => {
      const { result } = renderHook(() => useWakeLock());

      // Don't request wake lock, so it remains null

      jest.clearAllMocks();

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      expect(mockWakeLock.release).not.toHaveBeenCalled();
    });

    it('should handle errors during release', async () => {
      const error = new Error('Release failed');
      mockWakeLock.release.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to release screen wake lock:',
        error
      );
    });
  });

  describe('visibility change handling', () => {
    it('should re-request wake lock when document becomes visible', async () => {
      const { result } = renderHook(() => useWakeLock());

      // Request initially
      await act(async () => {
        await result.current.requestWakeLock();
      });

      // Simulate external release
      mockWakeLock.released = true;

      // Simulate document becoming visible
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      });

      // Need to await the visibility change handler since it calls async requestWakeLock
      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
        // Give the async handler time to execute
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Should have requested again
      expect(mockNavigator.request.mock.calls.length).toBeGreaterThan(1);
    });

    it('should not re-request if wake lock is still active', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      const callCount = mockNavigator.request.mock.calls.length;

      // Simulate document becoming visible while wake lock is active
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Should not request again since it's still active
      expect(mockNavigator.request.mock.calls.length).toBe(callCount);
    });

    it('should not re-request if document is still hidden', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      Object.defineProperty(document, 'hidden', {
        value: true,
        writable: true,
        configurable: true,
      });

      const callCount = mockNavigator.request.mock.calls.length;

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Should not request since document is still hidden
      expect(mockNavigator.request.mock.calls.length).toBe(callCount);
    });
  });

  describe('wake lock release event', () => {
    it('should log info when wake lock is released externally', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      // Get the release listener that was added
      const releaseListener = mockWakeLock.addEventListener.mock.calls[0][1];

      act(() => {
        releaseListener();
      });

      expect(consoleInfoSpy).toHaveBeenCalledWith('Screen wake lock released');
    });

    it('should clear wake lock reference when released externally', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(result.current.isActive).toBe(true);

      const releaseListener = mockWakeLock.addEventListener.mock.calls[0][1];

      act(() => {
        releaseListener();
      });

      // After external release, should be inactive
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('cleanup on unmount', () => {
    it('should release wake lock on unmount', async () => {
      const { result, unmount } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      // Verify wake lock is active before unmount
      expect(result.current.isActive).toBe(true);

      unmount();

      // The release should have been called during cleanup
      expect(mockWakeLock.release).toHaveBeenCalled();
    });

    it('should remove visibility change listener on unmount', () => {
      const { unmount } = renderHook(() => useWakeLock());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });
  });

  describe('isActive status', () => {
    it('should reflect current wake lock status', async () => {
      const { result } = renderHook(() => useWakeLock());

      expect(result.current.isActive).toBe(false);

      await act(async () => {
        await result.current.requestWakeLock();
      });

      expect(result.current.isActive).toBe(true);

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should return false if wake lock is released', async () => {
      const { result, rerender } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      // Simulate external release of the wake lock
      mockWakeLock.released = true;

      // Trigger the release event listener
      const releaseListener = mockWakeLock.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'release'
      )?.[1];

      await act(async () => {
        if (releaseListener) {
          releaseListener();
        }
      });

      // Force re-render to recompute isActive
      act(() => {
        rerender();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should return false if wake lock is null', () => {
      const { result } = renderHook(() => useWakeLock());

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('multiple hook instances', () => {
    it('should support multiple instances independently', async () => {
      const { result: result1 } = renderHook(() => useWakeLock());
      const { result: result2 } = renderHook(() => useWakeLock());

      await act(async () => {
        await result1.current.requestWakeLock();
      });

      expect(result1.current.isActive).toBe(true);
      expect(result2.current.isActive).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid request and release cycles', async () => {
      // Create a fresh mock for each request
      mockNavigator.request = jest.fn(async () => {
        return {
          released: false,
          type: 'screen',
          // eslint-disable-next-line no-unused-vars
          release: jest.fn(async function (this: any) {
            this.released = true;
          }),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
      });

      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.requestWakeLock();
      });

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      await act(async () => {
        await result.current.requestWakeLock();
      });

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('should handle release before request', async () => {
      const { result } = renderHook(() => useWakeLock());

      await act(async () => {
        await result.current.releaseWakeLock();
      });

      expect(result.current.isActive).toBe(false);
    });
  });
});
