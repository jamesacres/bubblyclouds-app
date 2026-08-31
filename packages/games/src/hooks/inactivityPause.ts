import { RefObject, useEffect, useRef, useState } from 'react';

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes in milliseconds

function useInactivityPause({
  lastInteractionRef,
  completed,
  isPaused,
  setPauseTimer,
}: {
  lastInteractionRef: RefObject<number>;
  completed: unknown;
  isPaused: boolean;
  setPauseTimer: (paused: boolean) => void;
}) {
  const [isPausedDueToInactivity, setIsPausedDueToInactivity] = useState(false);
  const isPausedDueToInactivityRef = useRef(isPausedDueToInactivity);

  useEffect(() => {
    isPausedDueToInactivityRef.current = isPausedDueToInactivity;
  }, [isPausedDueToInactivity]);

  // Check for inactivity and pause timer/polling if no interaction in 5 minutes
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (!completed) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const timeSinceLastInteraction = now - lastInteractionRef.current;

        if (timeSinceLastInteraction >= INACTIVITY_MS) {
          if (!isPaused && !isPausedDueToInactivity) {
            setIsPausedDueToInactivity(true);
            setPauseTimer(true);
          }
        } else {
          if (isPausedDueToInactivity) {
            setIsPausedDueToInactivity(false);
            setPauseTimer(false);
          }
        }
      }, 60000); // Check every minute
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    completed,
    isPaused,
    isPausedDueToInactivity,
    setPauseTimer,
    lastInteractionRef,
  ]);

  return { isPausedDueToInactivity, isPausedDueToInactivityRef };
}

export { useInactivityPause, INACTIVITY_MS };
