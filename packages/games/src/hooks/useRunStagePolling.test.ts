import { renderHook, act } from '@testing-library/react';
import {
  Party,
  ServerStateNotFoundResult,
  ServerStateResult,
} from '@bubblyclouds-app/types/serverTypes';
import { useRunStagePolling } from './useRunStagePolling';

interface TestState {
  initial: string;
  answerStack: string[];
  completed?: { at: string; seconds: number };
}

// This suite only ever exercises one State shape (TestState), so the mock
// itself is fixed to it — useRunStagePolling's own getServerValue prop stays
// genuinely generic (see useRunStagePolling.ts), only this test double isn't.
type GetServerValue = (_options?: {
  id?: string;
}) => Promise<
  | ServerStateResult<TestState>
  | ServerStateNotFoundResult<TestState>
  | undefined
>;

const STAGE_0 = 'stage-0';
const STAGE_1 = 'stage-1';
const STAGE_2 = 'stage-2';

const friendSessionFor = (stageId: string, seconds?: number) => ({
  sessionId: `app-${stageId}`,
  state: {
    initial: stageId,
    answerStack: [stageId],
    completed:
      seconds === undefined
        ? undefined
        : { at: new Date().toISOString(), seconds },
  },
  updatedAt: new Date(),
});

const patchFriendSessions = jest.fn();
const getServerValueMock = jest.fn<
  ReturnType<GetServerValue>,
  Parameters<GetServerValue>
>();
// jest.fn() can't itself carry useRunStagePolling's generic <T> call
// signature, so this thin wrapper is what's actually passed as the
// getServerValue prop — tests still assert against the underlying mock
// directly. Safe because this suite only ever instantiates the hook with
// State = TestState (every renderHook call below is useRunStagePolling
// <TestState>), matching the mock's own fixed return type.
const getServerValue = <T>(options?: { id?: string }) =>
  getServerValueMock(options) as unknown as Promise<
    ServerStateResult<T> | ServerStateNotFoundResult<T> | undefined
  >;

// mockCurrentStageResponse: answers GETs for any other stage id (options.id)
// with a friend session there (seconds from otherStageFriendSeconds), and
// the current stage's own GET (no id) with an empty-parties response — a
// friend has NOT completed the current stage by default.
const mockCurrentStageResponse = (otherStageFriendSeconds?: number) => {
  getServerValueMock.mockImplementation(async (options?: { id?: string }) => {
    if (options?.id) {
      return {
        parties: {
          party1: {
            memberSessions: {
              friend: friendSessionFor(options.id, otherStageFriendSeconds),
            },
          },
        },
      };
    }
    return {
      sessionId: `app-${STAGE_1}`,
      state: { initial: STAGE_1, answerStack: [STAGE_1] },
      parties: {
        party1: { memberSessions: { friend: friendSessionFor(STAGE_2) } },
      },
      updatedAt: new Date(),
    } as ServerStateResult<TestState>;
  });
};

const parties: Party[] = [
  {
    partyId: 'party1',
    appId: 'app',
    partyName: 'Party 1',
    createdBy: 'friend',
    isOwner: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      {
        userId: 'friend',
        resourceId: 'r1',
        memberNickname: 'Player 2',
        createdAt: new Date(),
        updatedAt: new Date(),
        isOwner: false,
        isUser: false,
      },
    ],
  },
];

const defaultProps = {
  app: 'app',
  stageId: STAGE_1,
  runStageIdsKey: [STAGE_0, STAGE_1, STAGE_2].join(','),
  user: { sub: 'me' },
  isDocumentVisible: true,
  isPaused: false,
  showLobby: false,
  parties,
  getServerValue,
  patchFriendSessions,
};

describe('useRunStagePolling', () => {
  beforeEach(() => {
    getServerValueMock.mockReset();
    patchFriendSessions.mockReset();
  });

  it('fetches every other stage via a direct per-stage GET, earlier and later alike', async () => {
    mockCurrentStageResponse(undefined);
    const { result } = renderHook(() =>
      useRunStagePolling<TestState>(defaultProps)
    );
    await act(async () => {});

    expect(getServerValueMock).toHaveBeenCalledWith({ id: STAGE_0 });
    expect(getServerValueMock).toHaveBeenCalledWith({ id: STAGE_2 });
    expect(
      result.current.runStageParties[STAGE_0]?.party1?.memberSessions.friend
    ).toBeDefined();
    expect(
      result.current.runStageParties[STAGE_2]?.party1?.memberSessions.friend
    ).toBeDefined();
  });

  it('reflects a later (never-started) stage session from the 404 response body', async () => {
    mockCurrentStageResponse(30);
    const { result } = renderHook(() =>
      useRunStagePolling<TestState>(defaultProps)
    );
    await act(async () => {});

    expect(
      result.current.runStageParties[STAGE_2]?.party1?.memberSessions.friend
        ?.state.completed?.seconds
    ).toBe(30);
    expect(patchFriendSessions).toHaveBeenCalledWith(
      `app-${STAGE_2}`,
      expect.objectContaining({ friend: expect.anything() })
    );
  });

  it('stops GETting an other stage once every known friend has completed it there', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    try {
      mockCurrentStageResponse(20);
      const { result } = renderHook(() =>
        useRunStagePolling<TestState>(defaultProps)
      );
      await act(async () => {});

      expect(
        result.current.runStageParties[STAGE_0]?.party1?.memberSessions.friend
          ?.state.completed?.seconds
      ).toBe(20);
      const callsAfterMount = getServerValueMock.mock.calls.filter(
        (call) => call[0]?.id === STAGE_0
      ).length;
      expect(callsAfterMount).toBeGreaterThan(0);

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      const callsAfterInterval = getServerValueMock.mock.calls.filter(
        (call) => call[0]?.id === STAGE_0
      ).length;
      expect(callsAfterInterval).toBe(callsAfterMount);
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps GETting an other stage on a 30s interval while a friend there is still in progress', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    try {
      mockCurrentStageResponse(undefined);
      const { result } = renderHook(() =>
        useRunStagePolling<TestState>(defaultProps)
      );
      await act(async () => {});

      const callsAfterMount = getServerValueMock.mock.calls.filter(
        (call) => call[0]?.id === STAGE_0
      ).length;
      expect(callsAfterMount).toBeGreaterThan(0);

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      const callsAfterInterval = getServerValueMock.mock.calls.filter(
        (call) => call[0]?.id === STAGE_0
      ).length;
      expect(callsAfterInterval).toBeGreaterThan(callsAfterMount);
      expect(
        result.current.runStageParties[STAGE_0]?.party1?.memberSessions.friend
          ?.state.completed
      ).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('accumulates the current stage parties under its stage id via setStageParties', async () => {
    mockCurrentStageResponse();
    const { result } = renderHook(() =>
      useRunStagePolling<TestState>(defaultProps)
    );
    await act(async () => {});

    act(() => {
      result.current.setStageParties(STAGE_1, {
        party1: { memberSessions: { friend: friendSessionFor(STAGE_1, 5) } },
      });
    });

    expect(
      result.current.runStageParties[STAGE_1]?.party1?.memberSessions.friend
    ).toBeDefined();
  });

  it('refreshes every stage session, plus the current stage, from a manual refresh', async () => {
    mockCurrentStageResponse(30);
    const { result } = renderHook(() =>
      useRunStagePolling<TestState>(defaultProps)
    );
    await act(async () => {});

    let refreshResult;
    await act(async () => {
      refreshResult = await result.current.refreshSessionParties();
    });

    expect(getServerValueMock).toHaveBeenCalledWith({ id: STAGE_0 });
    expect(getServerValueMock).toHaveBeenCalledWith({ id: STAGE_2 });
    // The current stage's own GET, via getServerValue() with no id.
    expect(getServerValueMock).toHaveBeenCalledWith(undefined);
    expect(refreshResult).toBeDefined();
    expect(
      result.current.runStageParties[STAGE_2]?.party1?.memberSessions.friend
        ?.state.completed?.seconds
    ).toBe(30);
  });

  it('does not poll other-stage sessions while showLobby is true', async () => {
    mockCurrentStageResponse(30);
    renderHook(() =>
      useRunStagePolling<TestState>({ ...defaultProps, showLobby: true })
    );
    await act(async () => {});

    expect(
      getServerValueMock.mock.calls.some((call) => call[0]?.id === STAGE_0)
    ).toBe(false);
    expect(
      getServerValueMock.mock.calls.some((call) => call[0]?.id === STAGE_2)
    ).toBe(false);
  });

  // STAGE_0 is runStageIdsKey's first entry — "stage 1" of the run.
  it('stops polling every other stage once stage 1 shows no friend ever started this run', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    try {
      getServerValueMock.mockImplementation(
        async (options?: { id?: string }) => {
          if (options?.id === STAGE_0) {
            return { parties: {} };
          }
          if (options?.id) {
            return {
              parties: {
                party1: {
                  memberSessions: { friend: friendSessionFor(options.id, 30) },
                },
              },
            };
          }
          return {
            sessionId: `app-${STAGE_1}`,
            state: { initial: STAGE_1, answerStack: [STAGE_1] },
            parties: {},
            updatedAt: new Date(),
          };
        }
      );

      renderHook(() => useRunStagePolling<TestState>(defaultProps));
      await act(async () => {});

      expect(
        getServerValueMock.mock.calls.some((call) => call[0]?.id === STAGE_0)
      ).toBe(true);
      expect(
        getServerValueMock.mock.calls.some((call) => call[0]?.id === STAGE_2)
      ).toBe(false);

      const callsAfterMount = getServerValueMock.mock.calls.length;

      await act(async () => {
        jest.advanceTimersByTime(60000);
      });

      expect(getServerValueMock.mock.calls.length).toBe(callsAfterMount);
    } finally {
      jest.useRealTimers();
    }
  });

  it('still notices a friend who starts stage 1 later, via a manual refresh', async () => {
    let friendHasStartedStage1 = false;
    getServerValueMock.mockImplementation(async (options?: { id?: string }) => {
      if (options?.id === STAGE_0) {
        return friendHasStartedStage1
          ? {
              parties: {
                party1: {
                  memberSessions: {
                    friend: friendSessionFor(STAGE_0, undefined),
                  },
                },
              },
            }
          : { parties: {} };
      }
      if (options?.id) {
        return {
          parties: {
            party1: {
              memberSessions: { friend: friendSessionFor(options.id, 30) },
            },
          },
        };
      }
      return {
        sessionId: `app-${STAGE_1}`,
        state: { initial: STAGE_1, answerStack: [STAGE_1] },
        parties: {},
        updatedAt: new Date(),
      };
    });

    const { result } = renderHook(() =>
      useRunStagePolling<TestState>(defaultProps)
    );
    await act(async () => {});

    expect(
      getServerValueMock.mock.calls.some((call) => call[0]?.id === STAGE_2)
    ).toBe(false);

    friendHasStartedStage1 = true;
    await act(async () => {
      await result.current.refreshSessionParties();
    });

    expect(
      result.current.runStageParties[STAGE_0]?.party1?.memberSessions.friend
    ).toBeDefined();
    expect(
      getServerValueMock.mock.calls.some((call) => call[0]?.id === STAGE_2)
    ).toBe(true);
  });

  it('stops re-checking stage 1 once every friend there has completed it, even on manual refresh', async () => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask'] });
    try {
      mockCurrentStageResponse(20);
      const { result } = renderHook(() =>
        useRunStagePolling<TestState>(defaultProps)
      );
      await act(async () => {});

      const callsToStage0AfterMount = getServerValueMock.mock.calls.filter(
        (call) => call[0]?.id === STAGE_0
      ).length;
      expect(callsToStage0AfterMount).toBeGreaterThan(0);

      await act(async () => {
        await result.current.refreshSessionParties();
      });

      const callsToStage0AfterRefresh = getServerValueMock.mock.calls.filter(
        (call) => call[0]?.id === STAGE_0
      ).length;
      expect(callsToStage0AfterRefresh).toBe(callsToStage0AfterMount);
    } finally {
      jest.useRealTimers();
    }
  });
});
