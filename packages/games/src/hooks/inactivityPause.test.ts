import { renderHook, act } from '@testing-library/react';
import { useInactivityPause, INACTIVITY_MS } from './inactivityPause';

describe('useInactivityPause', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('exposes the 5 minute inactivity threshold', () => {
    expect(INACTIVITY_MS).toBe(5 * 60 * 1000);
  });

  it('does not pause before the inactivity threshold elapses', () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    const lastInteractionRef = { current: Date.now() };
    const setPauseTimer = jest.fn();

    const { result } = renderHook(() =>
      useInactivityPause({
        lastInteractionRef,
        completed: undefined,
        isPaused: false,
        setPauseTimer,
      })
    );

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(setPauseTimer).not.toHaveBeenCalled();
    expect(result.current.isPausedDueToInactivity).toBe(false);
  });

  it('pauses once the inactivity threshold has elapsed', () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    const lastInteractionRef = { current: Date.now() };
    const setPauseTimer = jest.fn();

    const { result } = renderHook(() =>
      useInactivityPause({
        lastInteractionRef,
        completed: undefined,
        isPaused: false,
        setPauseTimer,
      })
    );

    act(() => {
      jest.advanceTimersByTime(INACTIVITY_MS);
    });
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(setPauseTimer).toHaveBeenCalledWith(true);
    expect(result.current.isPausedDueToInactivity).toBe(true);
    expect(result.current.isPausedDueToInactivityRef.current).toBe(true);
  });

  it('does not call setPauseTimer(true) again once already paused due to inactivity', () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    const lastInteractionRef = { current: Date.now() };
    const setPauseTimer = jest.fn();

    renderHook(() =>
      useInactivityPause({
        lastInteractionRef,
        completed: undefined,
        isPaused: false,
        setPauseTimer,
      })
    );

    // Advance one tick at a time so each interval firing sees the previous
    // render's committed state, mirroring how the effect re-subscribes with
    // a fresh closure after isPausedDueToInactivity changes in real usage.
    for (let i = 0; i < INACTIVITY_MS / 60000; i += 1) {
      act(() => {
        jest.advanceTimersByTime(60000);
      });
    }
    expect(setPauseTimer).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(setPauseTimer).toHaveBeenCalledTimes(1);
  });

  it('does not call setPauseTimer(true) when already paused for another reason (isPaused)', () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    const lastInteractionRef = { current: Date.now() };
    const setPauseTimer = jest.fn();

    const { result } = renderHook(() =>
      useInactivityPause({
        lastInteractionRef,
        completed: undefined,
        isPaused: true,
        setPauseTimer,
      })
    );

    act(() => {
      jest.advanceTimersByTime(INACTIVITY_MS + 60000);
    });

    expect(setPauseTimer).not.toHaveBeenCalled();
    expect(result.current.isPausedDueToInactivity).toBe(false);
  });

  it('resumes (calls setPauseTimer(false)) once interaction resets the ref before the next tick', () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    const lastInteractionRef = { current: Date.now() };
    const setPauseTimer = jest.fn();

    const { result, rerender } = renderHook(
      (props: { isPaused: boolean }) =>
        useInactivityPause({
          lastInteractionRef,
          completed: undefined,
          isPaused: props.isPaused,
          setPauseTimer,
        }),
      { initialProps: { isPaused: false } }
    );

    act(() => {
      jest.advanceTimersByTime(INACTIVITY_MS + 60000);
    });
    expect(result.current.isPausedDueToInactivity).toBe(true);
    expect(setPauseTimer).toHaveBeenLastCalledWith(true);

    // Simulate the caller's own interaction handler resetting the ref
    lastInteractionRef.current = Date.now();
    rerender({ isPaused: false });

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(result.current.isPausedDueToInactivity).toBe(false);
    expect(setPauseTimer).toHaveBeenLastCalledWith(false);
  });

  it('does not run the interval at all when completed', () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    const lastInteractionRef = { current: Date.now() };
    const setPauseTimer = jest.fn();

    renderHook(() =>
      useInactivityPause({
        lastInteractionRef,
        completed: { at: 'x', seconds: 1 },
        isPaused: false,
        setPauseTimer,
      })
    );

    act(() => {
      jest.advanceTimersByTime(INACTIVITY_MS + 60000);
    });

    expect(setPauseTimer).not.toHaveBeenCalled();
  });

  it('clears the interval on unmount', () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const lastInteractionRef = { current: Date.now() };
    const setPauseTimer = jest.fn();

    const { unmount } = renderHook(() =>
      useInactivityPause({
        lastInteractionRef,
        completed: undefined,
        isPaused: false,
        setPauseTimer,
      })
    );

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
