'use client';
import { useCallback, useContext, useEffect, useState } from 'react';
import { GlobalStateContext } from '../providers/GlobalStateProvider';

function useOnline() {
  const [globalState, setGlobalState] = useContext(GlobalStateContext)!;
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : false
  );

  const handleOnlineChange = () => {
    setIsOnline(window.navigator.onLine);
  };

  useEffect(() => {
    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, []);

  const forceOffline = useCallback(
    (isForceOffline: boolean) => {
      setGlobalState((current) => {
        return { ...current, isForceOffline };
      });
    },
    [setGlobalState]
  );

  const isOnlineResult = isOnline && !globalState.isForceOffline;

  return { forceOffline, isOnline: isOnlineResult };
}

export { useOnline };
