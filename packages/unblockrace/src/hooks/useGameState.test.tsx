import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import { RevenueCatContext } from '@bubblyclouds-app/template/providers/RevenueCatProvider';
import { SubscriptionContext } from '@bubblyclouds-app/types/subscriptionContext';

// The board manipulation helpers stay real (they're pure), but every
// provider-backed hook is stubbed so useGameState can run outside its app
// tree and we can drive undo() directly.
jest.mock('@bubblyclouds-app/template/hooks/localStorage', () => ({
  useLocalStorage: () => ({
    getValue: () => undefined,
    saveValue: () => undefined,
  }),
}));
jest.mock('@bubblyclouds-app/template/hooks/serverStorage', () => ({
  useServerStorage: () => ({
    getValue: () => Promise.resolve(undefined),
    saveValue: () => Promise.resolve(undefined),
  }),
}));
const setTimerNewSession = jest.fn();
jest.mock('@bubblyclouds-app/template/hooks/timer', () => ({
  useTimer: () => ({
    timer: null,
    setTimerNewSession,
    stopTimer: jest.fn(),
    setPauseTimer: jest.fn(),
    isPaused: false,
  }),
}));
jest.mock('@bubblyclouds-app/template/hooks/documentVisibility', () => ({
  useDocumentVisibility: () => true,
}));
jest.mock('@bubblyclouds-app/template/providers/SessionsProvider', () => ({
  useSessions: () => ({
    getSessionParties: () => ({}),
    patchFriendSessions: jest.fn(),
  }),
}));
jest.mock('@bubblyclouds-app/template/hooks/useParties', () => ({
  useParties: () => ({ parties: {} }),
}));
jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({ user: undefined }),
}));

const showModalIfRequired = jest.fn();

const START = ['oooooo', 'oooooo', 'AAoBoo', 'oooBoo', 'oooooo', 'oooooo'].join(
  ''
);

const hookArgs = {
  final: START,
  initial: START,
  puzzleId: START,
  metadata: {},
  app: 'unblockrace',
  apiUrl: 'https://api.test.com',
};

const wrapper =
  (value: { isSubscribed: boolean }) =>
  ({ children }: { children: React.ReactNode }) => (
    <RevenueCatContext.Provider
      value={
        {
          isSubscribed: value.isSubscribed,
          subscribeModal: { showModalIfRequired },
        } as unknown as React.ContextType<typeof RevenueCatContext>
      }
    >
      {children}
    </RevenueCatContext.Provider>
  );

// Push a move so the undo stack has something to pop.
const pushOneMove = (result: { current: ReturnType<typeof useGameState> }) => {
  act(() => {
    result.current.pushMove({ piece: 0, steps: 1 });
  });
};

describe('useGameState undo gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  it('lets a subscriber undo without touching the paywall or the daily counter', () => {
    const { result } = renderHook(() => useGameState(hookArgs), {
      wrapper: wrapper({ isSubscribed: true }),
    });
    pushOneMove(result);
    expect(result.current.isUndoDisabled).toBe(false);

    act(() => {
      result.current.undo();
    });

    expect(showModalIfRequired).not.toHaveBeenCalled();
    // No daily-action-counter entry was written for a subscriber
    expect(window.localStorage.getItem('daily-action-counter')).toBeNull();
  });

  it('lets a free user undo while they have free undos left', () => {
    const { result } = renderHook(() => useGameState(hookArgs), {
      wrapper: wrapper({ isSubscribed: false }),
    });
    pushOneMove(result);

    act(() => {
      result.current.undo();
    });

    expect(showModalIfRequired).not.toHaveBeenCalled();
    const stored = JSON.parse(
      window.localStorage.getItem('daily-action-counter') || '{}'
    );
    expect(stored.undoCount).toBe(1);
  });

  it('opens the undo paywall once the free user is out of undos', () => {
    window.localStorage.setItem(
      'daily-action-counter',
      JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        undoCount: 5,
        checkGridCount: 0,
        hintCount: 0,
      })
    );

    const { result } = renderHook(() => useGameState(hookArgs), {
      wrapper: wrapper({ isSubscribed: false }),
    });
    pushOneMove(result);

    act(() => {
      result.current.undo();
    });

    expect(showModalIfRequired).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      SubscriptionContext.UNDO
    );
  });
});
