'use client';

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnline } from './online';

// Don't mock the GlobalStateContext - we need the real context for proper state updates

// Create a wrapper component that provides the context
const createContextWrapper = () => {
  const { GlobalStateContext } = require('../providers/GlobalStateProvider');

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Use actual useState to make the context reactive
    const [state, setState] = React.useState({ isForceOffline: false });
    const value: [typeof state, typeof setState] = [state, setState];
    return React.createElement(
      GlobalStateContext.Provider,
      { value },
      children
    );
  };

  return Wrapper;
};

describe('useOnline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('initialization', () => {
    it('should initialize with online status', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.isOnline).toBe(true);
      expect(result.current.forceOffline).toBeDefined();
    });

    it('should reflect offline status on init', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(result.current.isOnline).toBe(false);
    });

    it('should have forceOffline function', () => {
      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(typeof result.current.forceOffline).toBe('function');
    });
  });

  describe('online status detection', () => {
    it('should detect when coming online', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(result.current.isOnline).toBe(false);

      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: true,
        });
        const event = new Event('online');
        window.dispatchEvent(event);
      });

      expect(result.current.isOnline).toBe(true);
    });

    it('should detect when going offline', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(result.current.isOnline).toBe(true);

      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: false,
        });
        const event = new Event('offline');
        window.dispatchEvent(event);
      });

      expect(result.current.isOnline).toBe(false);
    });

    it('should handle multiple online/offline transitions', () => {
      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      // Start online
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.isOnline).toBe(true);

      // Go offline
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.isOnline).toBe(false);

      // Go back online
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('forceOffline', () => {
    it('should force offline status', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(result.current.isOnline).toBe(true);

      await act(async () => {
        result.current.forceOffline(true);
      });

      await waitFor(
        () => {
          expect(result.current.isOnline).toBe(false);
        },
        { timeout: 100 }
      );
    });

    it('should restore online status when force offline is disabled', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      act(() => {
        result.current.forceOffline(true);
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      act(() => {
        result.current.forceOffline(false);
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });
    });

    it('should keep offline even when navigator says online', async () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: true,
      });

      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      act(() => {
        result.current.forceOffline(true);
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      // Even though navigator.onLine is true
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      // Should still be offline due to forceOffline
      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('should respect forceOffline over actual offline status', () => {
      Object.defineProperty(window.navigator, 'onLine', {
        writable: true,
        value: false,
      });

      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(result.current.isOnline).toBe(false);

      act(() => {
        result.current.forceOffline(false);
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      // Should be online since forceOffline is false
      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('event listeners', () => {
    it('should add online/offline event listeners', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      const Wrapper = createContextWrapper();
      renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );

      addEventListenerSpy.mockRestore();
    });

    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const Wrapper = createContextWrapper();
      const { unmount } = renderHook(() => useOnline(), { wrapper: Wrapper });

      act(() => {
        unmount();
      });

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'offline',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it('should only add listeners once on mount', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      const Wrapper = createContextWrapper();
      renderHook(() => useOnline(), { wrapper: Wrapper });

      // Should be called exactly twice (once for online, once for offline)
      expect(addEventListenerSpy).toHaveBeenCalledTimes(2);

      addEventListenerSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple hook instances', () => {
      const Wrapper = createContextWrapper();
      const { result: result1 } = renderHook(() => useOnline(), {
        wrapper: Wrapper,
      });
      const { result: result2 } = renderHook(() => useOnline(), {
        wrapper: Wrapper,
      });

      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      expect(result1.current.isOnline).toBe(true);
      expect(result2.current.isOnline).toBe(true);
    });

    it('should handle rapid online/offline transitions', async () => {
      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      // Loop ends with i=4 (even), so online event is last
      for (let i = 0; i < 5; i++) {
        act(() => {
          Object.defineProperty(window.navigator, 'onLine', {
            writable: true,
            value: i % 2 === 0,
          });
          window.dispatchEvent(new Event(i % 2 === 0 ? 'online' : 'offline'));
        });
      }

      await waitFor(() => {
        // Last event was i=4 (even=true), so should be online
        expect(result.current.isOnline).toBe(true);
      });
    });

    it('should handle forceOffline toggle rapidly', async () => {
      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      for (let i = 0; i < 5; i++) {
        await act(async () => {
          result.current.forceOffline(i % 2 === 0);
        });
      }

      // Last call was i=4 (even=true), so forceOffline(true) was called last
      // This means isOnline should be false
      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });

    it('should maintain correct state across forceOffline and network changes', async () => {
      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      // Go offline via force
      act(() => {
        result.current.forceOffline(true);
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });

      // Network comes back online
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false); // Still forced offline
      });

      // Disable force offline
      act(() => {
        result.current.forceOffline(false);
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true); // Now online
      });

      // Network goes down
      act(() => {
        Object.defineProperty(window.navigator, 'onLine', {
          writable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false); // Now offline from network
      });
    });

    it('should handle concurrent forceOffline calls', async () => {
      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      act(() => {
        result.current.forceOffline(true);
        result.current.forceOffline(false);
        result.current.forceOffline(true);
      });

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
      });
    });
  });

  describe('return value', () => {
    it('should return object with isOnline and forceOffline properties', () => {
      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(Object.keys(result.current)).toContain('isOnline');
      expect(Object.keys(result.current)).toContain('forceOffline');
      expect(Object.keys(result.current)).toHaveLength(2);
    });

    it('should return boolean for isOnline', () => {
      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(typeof result.current.isOnline).toBe('boolean');
    });

    it('should return function for forceOffline', () => {
      const Wrapper = createContextWrapper();
      const { result } = renderHook(() => useOnline(), { wrapper: Wrapper });

      expect(typeof result.current.forceOffline).toBe('function');
    });
  });
});
