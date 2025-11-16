'use client';
import { useCallback, useEffect, useState } from 'react';
import { useDocumentVisibility } from '@sudoku-web/template/hooks/documentVisibility';
import { useLocalStorage } from '@sudoku-web/template/hooks/localStorage';
import { StateType } from '@sudoku-web/types/stateType';
import { calculateSeconds } from '@sudoku-web/template/helpers/calculateSeconds';
import { Timer } from '@sudoku-web/template/types/timer';

// eslint-disable-next-line no-undef
let interval: NodeJS.Timeout;

function useTimer({ puzzleId }: { puzzleId: string }) {
  const isDocumentVisible = useDocumentVisibility();
  const [isPaused, setPauseTimer] = useState(false);
  const { getValue, saveValue } = useLocalStorage({
    id: puzzleId,
    type: StateType.TIMER,
  });
  const [timer, setTimer] = useState<null | Timer>(null);

  // Timer - calculates time spent on page

  const setTimerNewSession = useCallback((restoreTimer?: Timer | null) => {
    const COUNTDOWN = 4;
    const nowDate = new Date();
    nowDate.setSeconds(nowDate.getSeconds() + COUNTDOWN);
    const now = nowDate.toISOString();

    setTimer((currentTimer) => {
      const timer = restoreTimer !== undefined ? restoreTimer : currentTimer;
      return {
        ...timer,
        seconds: calculateSeconds(timer),
        inProgress: { start: now, lastInteraction: now },
        ...(timer?.stopped ? undefined : { countdown: COUNTDOWN }),
      };
    });
  }, []);

  const stopTimer = useCallback(() => {
    if (interval) {
      clearInterval(interval);
    }
    setTimer((timer) => {
      if (timer) {
        return {
          ...timer,
          stopped: true,
        };
      }
      return null;
    });
  }, [setTimer]);

  const updateTimer = useCallback(() => {
    const now = new Date().toISOString();
    setTimer((timer) => {
      if (timer) {
        if (timer.stopped) {
          if (interval) {
            clearInterval(interval);
          }
          return timer;
        }
        if (timer.countdown && timer.countdown > 0) {
          return {
            ...timer,
            countdown: timer.countdown - 1,
          };
        } else {
          return {
            ...timer,
            inProgress: {
              ...timer.inProgress,
              lastInteraction: now,
            },
          };
        }
      }
      return null;
    });
  }, []);

  // Force timer to re-render
  useEffect(() => {
    const thisInterval = setInterval(() => {
      if (isDocumentVisible && !isPaused) {
        updateTimer();
      }
    }, 1000);
    interval = thisInterval;
    return () => clearInterval(thisInterval);
  }, [isDocumentVisible, isPaused, updateTimer]);

  useEffect(() => {
    console.info('isDocumentVisible', isDocumentVisible, 'isPaused', isPaused);
    if (isDocumentVisible && !isPaused) {
      // Document now visible, start a new session
      setTimerNewSession();
    } else {
      // Document now invisible, set lastInteraction to now
      updateTimer();
    }
  }, [isDocumentVisible, isPaused, setTimerNewSession, updateTimer]);

  // Save and Restore state
  useEffect(() => {
    const { state: savedTimer } = getValue<Timer>() || {};
    if (savedTimer) {
      setTimerNewSession(savedTimer);
    }
  }, [puzzleId, getValue, setTimerNewSession]);
  useEffect(() => {
    if (timer) {
      saveValue(timer);
    }
  }, [puzzleId, timer, saveValue]);

  return {
    setTimerNewSession,
    timer,
    stopTimer,
    setPauseTimer,
    isPaused,
  };
}

export { useTimer };
