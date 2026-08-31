'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);

  const requestWakeLock = useCallback(async () => {
    try {
      // Check if Wake Lock API is supported
      if ('wakeLock' in navigator) {
        // The browser rejects the request while the page isn't visible
        // (e.g. backgrounded tab, mid-navigation); visibilitychange will retry.
        if (document.hidden) {
          return null;
        }

        const wakeLock = await navigator.wakeLock.request('screen');
        wakeLockRef.current = wakeLock;
        setIsActive(true);
        console.info('Screen wake lock activated');

        // Listen for wake lock release (e.g., when tab becomes hidden)
        wakeLock.addEventListener('release', () => {
          console.info('Screen wake lock released');
          wakeLockRef.current = null;
          setIsActive(false);
        });

        return wakeLock;
      } else {
        console.warn('Wake Lock API not supported in this browser');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.info('Screen wake lock request skipped: page not visible');
      } else {
        console.error('Failed to activate screen wake lock:', error);
      }
    }
    return null;
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        console.info('Screen wake lock manually released');
      } catch (error) {
        console.error('Failed to release screen wake lock:', error);
      }
    }
  }, []);

  // Re-request wake lock when document becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !window.document.hidden &&
        (!wakeLockRef.current || wakeLockRef.current?.released)
      ) {
        requestWakeLock();
      }
    };

    console.info('listening to visibilitychange');
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [requestWakeLock]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, [releaseWakeLock]);

  return {
    requestWakeLock,
    releaseWakeLock,
    isActive,
  };
}
