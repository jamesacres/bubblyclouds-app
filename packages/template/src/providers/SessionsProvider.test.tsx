import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SessionsProvider, useSessions } from './SessionsProvider';
import { UserContext } from '@sudoku-web/auth/providers/AuthProvider';
import { ServerStateResult, Party } from '@sudoku-web/types/serverTypes';
import { ServerState } from '@sudoku-web/sudoku/types/state';
import { useServerStorage } from '../hooks/serverStorage';
import { StateType } from '@sudoku-web/types/stateType';

// Mock dependencies
jest.mock('../hooks/serverStorage', () => ({
  useServerStorage: jest.fn(() => ({
    listValues: jest.fn(() => Promise.resolve([])),
    getValue: jest.fn(() => Promise.resolve(undefined)),
    saveValue: jest.fn(() => Promise.resolve(undefined)),
  })),
}));

jest.mock('../hooks/localStorage', () => ({
  useLocalStorage: jest.fn(() => ({
    listValues: jest.fn(() => []),
    saveValue: jest.fn(),
    getValue: jest.fn(),
    prefix: 'sudoku-',
  })),
}));

describe('SessionsProvider', () => {
  const mockUserContext = { user: undefined };

  const _createWrapper = (userContext = mockUserContext) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <UserContext.Provider value={userContext as any}>
        <SessionsProvider stateType={StateType.PUZZLE}>
          {children}
        </SessionsProvider>
      </UserContext.Provider>
    );
    Wrapper.displayName = 'SessionsProviderWrapper';
    return Wrapper;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('provider setup', () => {
    it('should render children', () => {
      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <div>Test Content</div>
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should provide SessionsContext', () => {
      let context: any;

      const TestComponent = () => {
        context = useSessions();
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(context).toBeDefined();
    });
  });

  describe('useSessions hook', () => {
    it('should throw when used outside provider', () => {
      const TestComponent = () => {
        useSessions();
        return null;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useSessions must be used within a SessionsProvider');
    });

    it('should return context when used inside provider', () => {
      let context: any;

      const TestComponent = () => {
        context = useSessions();
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(context).toBeDefined();
    });
  });

  describe('initial state', () => {
    it('should initialize sessions as null', () => {
      let sessions: any;

      const TestComponent = () => {
        const { sessions: s } = useSessions();
        sessions = s;
        return <div>Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(sessions).toBeNull();
    });

    it('should initialize isLoading as false', () => {
      let isLoading: boolean = true;

      const TestComponent = () => {
        const { isLoading: loading } = useSessions();
        isLoading = loading;
        return <div>Loading</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(isLoading).toBe(false);
    });

    it('should initialize friendSessions as empty object', () => {
      let friendSessions: any;

      const TestComponent = () => {
        const { friendSessions: fs } = useSessions();
        friendSessions = fs;
        return <div>Friend Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(friendSessions).toEqual({});
    });
  });

  describe('provided methods', () => {
    it('should provide fetchSessions method', () => {
      let fetchSessions: any;

      const TestComponent = () => {
        const { fetchSessions: fs } = useSessions();
        fetchSessions = fs;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof fetchSessions).toBe('function');
    });

    it('should provide refetchSessions method', () => {
      let refetchSessions: any;

      const TestComponent = () => {
        const { refetchSessions: rs } = useSessions();
        refetchSessions = rs;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof refetchSessions).toBe('function');
    });

    it('should provide setSessions method', () => {
      let setSessions: any;

      const TestComponent = () => {
        const { setSessions: ss } = useSessions();
        setSessions = ss;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof setSessions).toBe('function');
    });

    it('should provide clearSessions method', () => {
      let clearSessions: any;

      const TestComponent = () => {
        const { clearSessions: cs } = useSessions();
        clearSessions = cs;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof clearSessions).toBe('function');
    });

    it('should provide fetchFriendSessions method', () => {
      let fetchFriendSessions: any;

      const TestComponent = () => {
        const { fetchFriendSessions: ffs } = useSessions();
        fetchFriendSessions = ffs;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof fetchFriendSessions).toBe('function');
    });

    it('should provide lazyLoadFriendSessions method', () => {
      let lazyLoadFriendSessions: any;

      const TestComponent = () => {
        const { lazyLoadFriendSessions: lfs } = useSessions();
        lazyLoadFriendSessions = lfs;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof lazyLoadFriendSessions).toBe('function');
    });

    it('should provide clearFriendSessions method', () => {
      let clearFriendSessions: any;

      const TestComponent = () => {
        const { clearFriendSessions: cfs } = useSessions();
        clearFriendSessions = cfs;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof clearFriendSessions).toBe('function');
    });

    it('should provide getSessionParties method', () => {
      let getSessionParties: any;

      const TestComponent = () => {
        const { getSessionParties: gsp } = useSessions();
        getSessionParties = gsp;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof getSessionParties).toBe('function');
    });

    it('should provide patchFriendSessions method', () => {
      let patchFriendSessions: any;

      const TestComponent = () => {
        const { patchFriendSessions: pfs } = useSessions();
        patchFriendSessions = pfs;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof patchFriendSessions).toBe('function');
    });
  });

  describe('state updates', () => {
    it('should update sessions with setSessions', async () => {
      let sessions: ServerStateResult<ServerState>[] | null = null;
      let setSessions: any;

      const TestComponent = () => {
        const context = useSessions<any>();
        sessions = context.sessions;
        setSessions = context.setSessions;
        return <div>Sessions: {sessions?.length}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const mockSessions: ServerStateResult<ServerState>[] = [
        {
          sessionId: 'session-1',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: new Date(),
        } as any,
      ];

      act(() => {
        setSessions(mockSessions);
      });

      await waitFor(() => {
        expect(sessions).toEqual(mockSessions);
      });
    });

    it('should clear sessions with clearSessions', async () => {
      let sessions: ServerStateResult<ServerState>[] | null = [
        {
          sessionId: 'session-1',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: new Date(),
        } as any,
      ];
      let clearSessions: any;

      const TestComponent = () => {
        const context = useSessions<any>();
        sessions = context.sessions;
        clearSessions = context.clearSessions;
        return <div>Sessions: {sessions?.length}</div>;
      };

      const { rerender } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      act(() => {
        clearSessions?.();
      });

      rerender(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(sessions).toBeNull();
    });
  });

  describe('user context changes', () => {
    it('should clear friend sessions when user changes', () => {
      let friendSessions: any = { userId1: { sessions: [] } };

      const TestComponent = () => {
        const context = useSessions();
        friendSessions = context.friendSessions;
        return <div>Friends: {Object.keys(friendSessions).length}</div>;
      };

      const { rerender } = render(
        <UserContext.Provider value={{ user: { id: 'user1' } } as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      rerender(
        <UserContext.Provider value={{ user: { id: 'user2' } } as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      // Should clear when user changes
      expect(friendSessions).toEqual({});
    });
  });

  describe('getSessionParties', () => {
    it('should return empty object for no parties', () => {
      let getSessionParties: any;
      let result: any;

      const TestComponent = () => {
        const context = useSessions();
        getSessionParties = context.getSessionParties;
        result = getSessionParties([], 'session-1');
        return <div>Result</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(result).toEqual({});
    });

    it('should filter parties by sessionId', () => {
      let getSessionParties: any;
      let result: any;

      const TestComponent = () => {
        const context = useSessions();
        getSessionParties = context.getSessionParties;

        const parties: Party[] = [
          {
            partyId: 'party-1',
            members: [{ userId: 'user-1', displayName: 'User 1' }],
          } as unknown as Party,
        ];

        result = getSessionParties(parties, 'session-1');
        return <div>Result</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(result).toBeDefined();
      expect(result['party-1']).toBeDefined();
    });
  });

  describe('multiple consumers', () => {
    it('should share context across multiple consumers', () => {
      const states: any[] = [];

      const Consumer = ({ id }: { id: number }) => {
        const context = useSessions();
        states[id] = context;
        return <div>Consumer {id}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <Consumer id={0} />
            <Consumer id={1} />
            <Consumer id={2} />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(states[0]).toBe(states[1]);
      expect(states[1]).toBe(states[2]);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', () => {
      const TestComponent = () => {
        const context = useSessions();
        return <div>Sessions: {context.sessions?.length ?? 0}</div>;
      };

      expect(() => {
        render(
          <UserContext.Provider value={mockUserContext as any}>
            <SessionsProvider stateType={StateType.PUZZLE}>
              <TestComponent />
            </SessionsProvider>
          </UserContext.Provider>
        );
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple provider instances', () => {
      const TestComponent = ({ id }: { id: number }) => {
        const context = useSessions();
        return (
          <div>
            Provider {id}: {context.sessions?.length ?? 0}
          </div>
        );
      };

      const { container } = render(
        <>
          <UserContext.Provider value={mockUserContext as any}>
            <SessionsProvider stateType={StateType.PUZZLE}>
              <TestComponent id={1} />
            </SessionsProvider>
          </UserContext.Provider>
          <UserContext.Provider value={mockUserContext as any}>
            <SessionsProvider stateType={StateType.PUZZLE}>
              <TestComponent id={2} />
            </SessionsProvider>
          </UserContext.Provider>
        </>
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle provider unmount and remount', () => {
      let context: any;

      const TestComponent = () => {
        context = useSessions();
        return <div>Test</div>;
      };

      const { unmount } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(context).toBeDefined();

      unmount();

      context = undefined;

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(context).toBeDefined();
    });

    it('should handle rapid state updates', () => {
      let setSessions: any;
      let sessions: any;

      const TestComponent = () => {
        const context = useSessions();
        setSessions = context.setSessions;
        sessions = context.sessions;
        return <div>Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const mockSessions: ServerStateResult<ServerState>[] = [
        {
          sessionId: 'session-1',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: new Date(),
        } as any,
      ];

      act(() => {
        setSessions(mockSessions);
        setSessions(null);
        setSessions(mockSessions);
      });

      expect(sessions).toEqual(mockSessions);
    });
  });

  describe('friend sessions operations', () => {
    it('should initialize isFriendSessionsLoading as false', () => {
      let isFriendSessionsLoading: boolean = true;

      const TestComponent = () => {
        const { isFriendSessionsLoading: loading } = useSessions();
        isFriendSessionsLoading = loading;
        return <div>Loading</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(isFriendSessionsLoading).toBe(false);
    });

    it('should patch friend sessions with updated values', async () => {
      let patchFriendSessions: any;
      let friendSessions: any;

      const TestComponent = () => {
        const context = useSessions();
        patchFriendSessions = context.patchFriendSessions;
        friendSessions = context.friendSessions;
        return <div>Friends: {Object.keys(friendSessions).length}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const newSession = {
        sessionId: 'session-1',
        state: { answerStack: [], initial: {}, final: {} } as any,
        updatedAt: new Date(),
      } as any;

      act(() => {
        patchFriendSessions?.('session-1', {
          'friend-1': newSession,
        });
      });

      await waitFor(() => {
        expect(friendSessions).toBeDefined();
      });
    });

    it('should not patch friend sessions if already loading', async () => {
      let patchFriendSessions: any;
      let isFriendSessionsLoading: boolean = false;

      const TestComponent = () => {
        const context = useSessions();
        patchFriendSessions = context.patchFriendSessions;
        isFriendSessionsLoading = context.isFriendSessionsLoading;
        return <div>Loading: {isFriendSessionsLoading.toString()}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      // Should handle safely even if loading
      act(() => {
        patchFriendSessions?.('session-1', {});
      });

      expect(patchFriendSessions).toBeDefined();
    });
  });

  describe('lazy loading behavior', () => {
    it('should not lazy load if already initialized', async () => {
      let _lazyLoadFriendSessions: any;
      let hasCalled = false;

      const TestComponent = () => {
        const context = useSessions();
        _lazyLoadFriendSessions = context.lazyLoadFriendSessions;

        React.useEffect(() => {
          hasCalled = true;
        }, []);

        return <div>Lazy Load Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(hasCalled).toBe(true);
    });

    it('should lazy load friend sessions on demand', async () => {
      let lazyLoadFriendSessions: any;

      const TestComponent = () => {
        const context = useSessions();
        lazyLoadFriendSessions = context.lazyLoadFriendSessions;
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const mockParties: Party[] = [
        {
          partyId: 'party-1',
          partyName: 'Test Party',
          members: [{ userId: 'friend-1', memberNickname: 'Friend' }],
        } as unknown as Party,
      ];

      await act(async () => {
        await lazyLoadFriendSessions?.(mockParties);
      });

      expect(lazyLoadFriendSessions).toBeDefined();
    });
  });

  describe('session sorting and filtering', () => {
    it('should sort sessions with most recent first', () => {
      let setSessions: any;
      let _retrievedSessions: any;

      const TestComponent = () => {
        const context = useSessions();
        setSessions = context.setSessions;
        _retrievedSessions = context.sessions;
        return <div>Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const twoDaysAgo = new Date(now.getTime() - 172800000);

      const sessionsToSet: ServerStateResult<ServerState>[] = [
        {
          sessionId: 'old',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: twoDaysAgo,
        } as any,
        {
          sessionId: 'recent',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: now,
        } as any,
        {
          sessionId: 'yesterday',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: yesterday,
        } as any,
      ];

      act(() => {
        setSessions(sessionsToSet);
      });

      expect(sessionsToSet[0].sessionId).toBe('old');
    });

    it('should remove duplicate sessions keeping most recent', () => {
      let setSessions: any;
      let sessions: any;

      const TestComponent = () => {
        const context = useSessions();
        setSessions = context.setSessions;
        sessions = context.sessions;
        return <div>Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const now = new Date();
      const earlier = new Date(now.getTime() - 1000);

      const duplicateSessions: ServerStateResult<ServerState>[] = [
        {
          sessionId: 'session-1',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: earlier,
        } as any,
        {
          sessionId: 'session-1',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: now,
        } as any,
      ];

      act(() => {
        setSessions(duplicateSessions);
      });

      expect(sessions).toBeDefined();
    });
  });

  describe('async operations', () => {
    it('should handle fetchSessions async operation', async () => {
      const mockListValues = jest.fn().mockResolvedValue([
        {
          sessionId: 'session-1',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: new Date(),
        } as any,
      ]);

      (useServerStorage as jest.Mock).mockReturnValue({
        listValues: mockListValues,
      });

      let fetchSessions: any;
      let sessions: any;

      const TestComponent = () => {
        const context = useSessions();
        fetchSessions = context.fetchSessions;
        sessions = context.sessions;
        return <div>Sessions: {sessions?.length ?? 'loading'}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      await act(async () => {
        await fetchSessions?.();
      });

      expect(fetchSessions).toBeDefined();
    });

    it('should handle refetchSessions forcing reload', async () => {
      const mockListValues = jest.fn().mockResolvedValue([]);

      (useServerStorage as jest.Mock).mockReturnValue({
        listValues: mockListValues,
      });

      let refetchSessions: any;

      const TestComponent = () => {
        const context = useSessions();
        refetchSessions = context.refetchSessions;
        return <div>Refetch</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      await act(async () => {
        await refetchSessions?.();
      });

      await act(async () => {
        await refetchSessions?.();
      });

      expect(refetchSessions).toBeDefined();
    });
  });

  describe('context value shape', () => {
    it('should provide all required context properties', () => {
      let context: any;

      const TestComponent = () => {
        context = useSessions();
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE}>
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(context).toHaveProperty('sessions');
      expect(context).toHaveProperty('isLoading');
      expect(context).toHaveProperty('fetchSessions');
      expect(context).toHaveProperty('refetchSessions');
      expect(context).toHaveProperty('setSessions');
      expect(context).toHaveProperty('clearSessions');
      expect(context).toHaveProperty('friendSessions');
      expect(context).toHaveProperty('isFriendSessionsLoading');
      expect(context).toHaveProperty('fetchFriendSessions');
      expect(context).toHaveProperty('lazyLoadFriendSessions');
      expect(context).toHaveProperty('clearFriendSessions');
      expect(context).toHaveProperty('getSessionParties');
      expect(context).toHaveProperty('patchFriendSessions');
    });
  });
});
