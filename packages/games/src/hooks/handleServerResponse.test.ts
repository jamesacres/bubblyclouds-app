import { renderHook } from '@testing-library/react';
import { useHandleServerResponse } from './handleServerResponse';
import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';

interface TestState {
  value: string;
}

describe('useHandleServerResponse', () => {
  it('calls setSessionParties when active and parties are present', () => {
    const setSessionParties = jest.fn();
    const { result } = renderHook(() =>
      useHandleServerResponse<TestState>(setSessionParties)
    );

    const parties: Parties<Session<TestState>> = {
      party1: {
        memberSessions: {
          user1: {
            sessionId: 'session1',
            state: { value: 'hello' },
            updatedAt: new Date(),
          },
        },
      },
    };

    result.current(true, {
      sessionId: 'session1',
      state: { value: 'hello' },
      updatedAt: new Date(),
      parties,
    });

    expect(setSessionParties).toHaveBeenCalledWith(parties);
  });

  it('does not call setSessionParties when inactive', () => {
    const setSessionParties = jest.fn();
    const { result } = renderHook(() =>
      useHandleServerResponse<TestState>(setSessionParties)
    );

    result.current(false, {
      sessionId: 'session1',
      state: { value: 'hello' },
      updatedAt: new Date(),
      parties: { party1: { memberSessions: {} } },
    });

    expect(setSessionParties).not.toHaveBeenCalled();
  });

  it('does not call setSessionParties when parties is undefined', () => {
    const setSessionParties = jest.fn();
    const { result } = renderHook(() =>
      useHandleServerResponse<TestState>(setSessionParties)
    );

    result.current(true, {
      sessionId: 'session1',
      state: { value: 'hello' },
      updatedAt: new Date(),
    });

    expect(setSessionParties).not.toHaveBeenCalled();
  });

  it('does not call setSessionParties when parties is empty', () => {
    const setSessionParties = jest.fn();
    const { result } = renderHook(() =>
      useHandleServerResponse<TestState>(setSessionParties)
    );

    result.current(true, {
      sessionId: 'session1',
      state: { value: 'hello' },
      updatedAt: new Date(),
      parties: {},
    });

    expect(setSessionParties).not.toHaveBeenCalled();
  });

  it('does not call setSessionParties when serverValue is undefined', () => {
    const setSessionParties = jest.fn();
    const { result } = renderHook(() =>
      useHandleServerResponse<TestState>(setSessionParties)
    );

    result.current(true, undefined);

    expect(setSessionParties).not.toHaveBeenCalled();
  });

  it('returns a stable callback identity across re-renders when setSessionParties is stable', () => {
    const setSessionParties = jest.fn();
    const { result, rerender } = renderHook(() =>
      useHandleServerResponse<TestState>(setSessionParties)
    );

    const firstCallback = result.current;
    rerender();

    expect(result.current).toBe(firstCallback);
  });
});
