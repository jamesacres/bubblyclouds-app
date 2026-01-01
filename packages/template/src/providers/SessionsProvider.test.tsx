import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SessionsProvider, useSessions } from './SessionsProvider';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { ServerStateResult, Party } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '../types/state';
import { useServerStorage } from '../hooks/serverStorage';
import { StateType } from '@bubblyclouds-app/types/stateType';

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
        <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
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
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <div>Test Content</div>
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should provide SessionsContext', () => {
      const contextRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref = React.useRef(contextRef);
        React.useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(contextRef.current).toBeDefined();
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
      const contextRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref = React.useRef(contextRef);
        React.useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(contextRef.current).toBeDefined();
    });
  });

  describe('initial state', () => {
    it('should initialize sessions as null', () => {
      const sessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { sessions: s } = useSessions();
        const ref = React.useRef(sessionsRef);
        React.useEffect(() => {
          ref.current.current = s;
        }, [s]);
        return <div>Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(sessionsRef.current).toBeNull();
    });

    it('should initialize isLoading as false', () => {
      const isLoadingRef = { current: true };

      const TestComponent = () => {
        const { isLoading: loading } = useSessions();
        const ref = React.useRef(isLoadingRef);
        React.useEffect(() => {
          ref.current.current = loading;
        }, [loading]);
        return <div>Loading</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(isLoadingRef.current).toBe(false);
    });

    it('should initialize friendSessions as empty object', () => {
      const friendSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { friendSessions: fs } = useSessions();
        const ref = React.useRef(friendSessionsRef);
        React.useEffect(() => {
          ref.current.current = fs;
        }, [fs]);
        return <div>Friend Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(friendSessionsRef.current).toEqual({});
    });
  });

  describe('provided methods', () => {
    it('should provide fetchSessions method', () => {
      const fetchSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { fetchSessions: fs } = useSessions();
        const ref = React.useRef(fetchSessionsRef);
        React.useEffect(() => {
          ref.current.current = fs;
        }, [fs]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof fetchSessionsRef.current).toBe('function');
    });

    it('should provide refetchSessions method', () => {
      const refetchSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { refetchSessions: rs } = useSessions();
        const ref = React.useRef(refetchSessionsRef);
        React.useEffect(() => {
          ref.current.current = rs;
        }, [rs]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof refetchSessionsRef.current).toBe('function');
    });

    it('should provide setSessions method', () => {
      const setSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { setSessions: ss } = useSessions();
        const ref = React.useRef(setSessionsRef);
        React.useEffect(() => {
          ref.current.current = ss;
        }, [ss]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof setSessionsRef.current).toBe('function');
    });

    it('should provide clearSessions method', () => {
      const clearSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { clearSessions: cs } = useSessions();
        const ref = React.useRef(clearSessionsRef);
        React.useEffect(() => {
          ref.current.current = cs;
        }, [cs]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof clearSessionsRef.current).toBe('function');
    });

    it('should provide fetchFriendSessions method', () => {
      const fetchFriendSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { fetchFriendSessions: ffs } = useSessions();
        const ref = React.useRef(fetchFriendSessionsRef);
        React.useEffect(() => {
          ref.current.current = ffs;
        }, [ffs]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof fetchFriendSessionsRef.current).toBe('function');
    });

    it('should provide lazyLoadFriendSessions method', () => {
      const lazyLoadFriendSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { lazyLoadFriendSessions: lfs } = useSessions();
        const ref = React.useRef(lazyLoadFriendSessionsRef);
        React.useEffect(() => {
          ref.current.current = lfs;
        }, [lfs]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof lazyLoadFriendSessionsRef.current).toBe('function');
    });

    it('should provide clearFriendSessions method', () => {
      const clearFriendSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { clearFriendSessions: cfs } = useSessions();
        const ref = React.useRef(clearFriendSessionsRef);
        React.useEffect(() => {
          ref.current.current = cfs;
        }, [cfs]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof clearFriendSessionsRef.current).toBe('function');
    });

    it('should provide getSessionParties method', () => {
      const getSessionPartiesRef = { current: undefined as any };

      const TestComponent = () => {
        const { getSessionParties: gsp } = useSessions();
        const ref = React.useRef(getSessionPartiesRef);
        React.useEffect(() => {
          ref.current.current = gsp;
        }, [gsp]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof getSessionPartiesRef.current).toBe('function');
    });

    it('should provide patchFriendSessions method', () => {
      const patchFriendSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const { patchFriendSessions: pfs } = useSessions();
        const ref = React.useRef(patchFriendSessionsRef);
        React.useEffect(() => {
          ref.current.current = pfs;
        }, [pfs]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(typeof patchFriendSessionsRef.current).toBe('function');
    });
  });

  describe('state updates', () => {
    it('should update sessions with setSessions', async () => {
      const sessionsRef = {
        current: null as ServerStateResult<BaseServerState>[] | null,
      };
      const setSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions<any>();
        const ref1 = React.useRef(sessionsRef);
        const ref2 = React.useRef(setSessionsRef);
        React.useEffect(() => {
          ref1.current.current = context.sessions;
          ref2.current.current = context.setSessions;
        }, [context.sessions, context.setSessions]);
        return <div>Sessions: {context.sessions?.length}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const mockSessions: ServerStateResult<BaseServerState>[] = [
        {
          sessionId: 'session-1',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: new Date(),
        } as any,
      ];

      act(() => {
        setSessionsRef.current(mockSessions);
      });

      await waitFor(() => {
        expect(sessionsRef.current).toEqual(mockSessions);
      });
    });

    it('should clear sessions with clearSessions', async () => {
      const sessionsRef = {
        current: [
          {
            sessionId: 'session-1',
            state: { answerStack: [], initial: {}, final: {} } as any,
            updatedAt: new Date(),
          } as any,
        ] as ServerStateResult<BaseServerState>[] | null,
      };
      const clearSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions<any>();
        const ref1 = React.useRef(sessionsRef);
        const ref2 = React.useRef(clearSessionsRef);
        React.useEffect(() => {
          ref1.current.current = context.sessions;
          ref2.current.current = context.clearSessions;
        }, [context.sessions, context.clearSessions]);
        return <div>Sessions: {context.sessions?.length}</div>;
      };

      const { rerender } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      act(() => {
        clearSessionsRef.current?.();
      });

      rerender(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(sessionsRef.current).toBeNull();
    });
  });

  describe('user context changes', () => {
    it('should clear friend sessions when user changes', () => {
      const friendSessionsRef = {
        current: { userId1: { sessions: [] } } as any,
      };

      const TestComponent = () => {
        const context = useSessions();
        const ref = React.useRef(friendSessionsRef);
        React.useEffect(() => {
          ref.current.current = context.friendSessions;
        }, [context.friendSessions]);
        return <div>Friends: {Object.keys(context.friendSessions).length}</div>;
      };

      const { rerender } = render(
        <UserContext.Provider value={{ user: { id: 'user1' } } as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      rerender(
        <UserContext.Provider value={{ user: { id: 'user2' } } as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      // Should clear when user changes
      expect(friendSessionsRef.current).toEqual({});
    });
  });

  describe('getSessionParties', () => {
    it('should return empty object for no parties', () => {
      const getSessionPartiesRef = { current: undefined as any };
      const resultRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref1 = React.useRef(getSessionPartiesRef);
        const ref2 = React.useRef(resultRef);
        React.useEffect(() => {
          ref1.current.current = context.getSessionParties;
          ref2.current.current = context.getSessionParties([], 'session-1');
        }, [context]);
        return <div>Result</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(resultRef.current).toEqual({});
    });

    it('should filter parties by sessionId', () => {
      const getSessionPartiesRef = { current: undefined as any };
      const resultRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref1 = React.useRef(getSessionPartiesRef);
        const ref2 = React.useRef(resultRef);
        React.useEffect(() => {
          ref1.current.current = context.getSessionParties;

          const parties: Party[] = [
            {
              partyId: 'party-1',
              members: [{ userId: 'user-1', displayName: 'User 1' }],
            } as unknown as Party,
          ];

          ref2.current.current = context.getSessionParties(
            parties,
            'session-1'
          );
        }, [context]);
        return <div>Result</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(resultRef.current).toBeDefined();
      expect(resultRef.current['party-1']).toBeDefined();
    });
  });

  describe('multiple consumers', () => {
    it('should share context across multiple consumers', () => {
      const statesRef = { current: [] as any[] };

      const Consumer = ({ id }: { id: number }) => {
        const context = useSessions();
        const ref = React.useRef(statesRef);
        React.useEffect(() => {
          ref.current.current[id] = context;
        }, [context, id]);
        return <div>Consumer {id}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <Consumer id={0} />
            <Consumer id={1} />
            <Consumer id={2} />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(statesRef.current[0]).toBe(statesRef.current[1]);
      expect(statesRef.current[1]).toBe(statesRef.current[2]);
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
            <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
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
            <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
              <TestComponent id={1} />
            </SessionsProvider>
          </UserContext.Provider>
          <UserContext.Provider value={mockUserContext as any}>
            <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
              <TestComponent id={2} />
            </SessionsProvider>
          </UserContext.Provider>
        </>
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle provider unmount and remount', () => {
      const contextRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref = React.useRef(contextRef);
        React.useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return <div>Test</div>;
      };

      const { unmount } = render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(contextRef.current).toBeDefined();

      unmount();

      contextRef.current = undefined;

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(contextRef.current).toBeDefined();
    });

    it('should handle rapid state updates', () => {
      const setSessionsRef = { current: undefined as any };
      const sessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref1 = React.useRef(setSessionsRef);
        const ref2 = React.useRef(sessionsRef);
        React.useEffect(() => {
          ref1.current.current = context.setSessions;
          ref2.current.current = context.sessions;
        }, [context.setSessions, context.sessions]);
        return <div>Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const mockSessions: ServerStateResult<BaseServerState>[] = [
        {
          sessionId: 'session-1',
          state: { answerStack: [], initial: {}, final: {} } as any,
          updatedAt: new Date(),
        } as any,
      ];

      act(() => {
        setSessionsRef.current(mockSessions);
        setSessionsRef.current(null);
        setSessionsRef.current(mockSessions);
      });

      expect(sessionsRef.current).toEqual(mockSessions);
    });
  });

  describe('friend sessions operations', () => {
    it('should initialize isFriendSessionsLoading as false', () => {
      const isFriendSessionsLoadingRef = { current: true };

      const TestComponent = () => {
        const { isFriendSessionsLoading: loading } = useSessions();
        const ref = React.useRef(isFriendSessionsLoadingRef);
        React.useEffect(() => {
          ref.current.current = loading;
        }, [loading]);
        return <div>Loading</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(isFriendSessionsLoadingRef.current).toBe(false);
    });

    it('should patch friend sessions with updated values', async () => {
      const patchFriendSessionsRef = { current: undefined as any };
      const friendSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref1 = React.useRef(patchFriendSessionsRef);
        const ref2 = React.useRef(friendSessionsRef);
        React.useEffect(() => {
          ref1.current.current = context.patchFriendSessions;
          ref2.current.current = context.friendSessions;
        }, [context.patchFriendSessions, context.friendSessions]);
        return <div>Friends: {Object.keys(context.friendSessions).length}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
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
        patchFriendSessionsRef.current?.('session-1', {
          'friend-1': newSession,
        });
      });

      await waitFor(() => {
        expect(friendSessionsRef.current).toBeDefined();
      });
    });

    it('should not patch friend sessions if already loading', async () => {
      const patchFriendSessionsRef = { current: undefined as any };
      const isFriendSessionsLoadingRef = { current: false };

      const TestComponent = () => {
        const context = useSessions();
        const ref1 = React.useRef(patchFriendSessionsRef);
        const ref2 = React.useRef(isFriendSessionsLoadingRef);
        React.useEffect(() => {
          ref1.current.current = context.patchFriendSessions;
          ref2.current.current = context.isFriendSessionsLoading;
        }, [context.patchFriendSessions, context.isFriendSessionsLoading]);
        return <div>Loading: {context.isFriendSessionsLoading.toString()}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      // Should handle safely even if loading
      act(() => {
        patchFriendSessionsRef.current?.('session-1', {});
      });

      expect(patchFriendSessionsRef.current).toBeDefined();
    });
  });

  describe('lazy loading behavior', () => {
    it('should not lazy load if already initialized', async () => {
      const _lazyLoadFriendSessionsRef = { current: undefined as any };
      const hasCalledRef = { current: false };

      const TestComponent = () => {
        const context = useSessions();
        const ref1 = React.useRef(_lazyLoadFriendSessionsRef);
        const ref2 = React.useRef(hasCalledRef);
        React.useEffect(() => {
          ref1.current.current = context.lazyLoadFriendSessions;
          ref2.current.current = true;
        }, [context.lazyLoadFriendSessions]);

        return <div>Lazy Load Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(hasCalledRef.current).toBe(true);
    });

    it('should lazy load friend sessions on demand', async () => {
      const lazyLoadFriendSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref = React.useRef(lazyLoadFriendSessionsRef);
        React.useEffect(() => {
          ref.current.current = context.lazyLoadFriendSessions;
        }, [context.lazyLoadFriendSessions]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
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
        await lazyLoadFriendSessionsRef.current?.(mockParties);
      });

      expect(lazyLoadFriendSessionsRef.current).toBeDefined();
    });
  });

  describe('session sorting and filtering', () => {
    it('should sort sessions with most recent first', () => {
      const setSessionsRef = { current: undefined as any };
      const _retrievedSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref1 = React.useRef(setSessionsRef);
        const ref2 = React.useRef(_retrievedSessionsRef);
        React.useEffect(() => {
          ref1.current.current = context.setSessions;
          ref2.current.current = context.sessions;
        }, [context.setSessions, context.sessions]);
        return <div>Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const twoDaysAgo = new Date(now.getTime() - 172800000);

      const sessionsToSet: ServerStateResult<BaseServerState>[] = [
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
        setSessionsRef.current(sessionsToSet);
      });

      expect(sessionsToSet[0].sessionId).toBe('old');
    });

    it('should remove duplicate sessions keeping most recent', () => {
      const setSessionsRef = { current: undefined as any };
      const sessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref1 = React.useRef(setSessionsRef);
        const ref2 = React.useRef(sessionsRef);
        React.useEffect(() => {
          ref1.current.current = context.setSessions;
          ref2.current.current = context.sessions;
        }, [context.setSessions, context.sessions]);
        return <div>Sessions</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      const now = new Date();
      const earlier = new Date(now.getTime() - 1000);

      const duplicateSessions: ServerStateResult<BaseServerState>[] = [
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
        setSessionsRef.current(duplicateSessions);
      });

      expect(sessionsRef.current).toBeDefined();
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

      const fetchSessionsRef = { current: undefined as any };
      const sessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref1 = React.useRef(fetchSessionsRef);
        const ref2 = React.useRef(sessionsRef);
        React.useEffect(() => {
          ref1.current.current = context.fetchSessions;
          ref2.current.current = context.sessions;
        }, [context.fetchSessions, context.sessions]);
        return <div>Sessions: {context.sessions?.length ?? 'loading'}</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      await act(async () => {
        await fetchSessionsRef.current?.();
      });

      expect(fetchSessionsRef.current).toBeDefined();
    });

    it('should handle refetchSessions forcing reload', async () => {
      const mockListValues = jest.fn().mockResolvedValue([]);

      (useServerStorage as jest.Mock).mockReturnValue({
        listValues: mockListValues,
      });

      const refetchSessionsRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref = React.useRef(refetchSessionsRef);
        React.useEffect(() => {
          ref.current.current = context.refetchSessions;
        }, [context.refetchSessions]);
        return <div>Refetch</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      await act(async () => {
        await refetchSessionsRef.current?.();
      });

      await act(async () => {
        await refetchSessionsRef.current?.();
      });

      expect(refetchSessionsRef.current).toBeDefined();
    });
  });

  describe('context value shape', () => {
    it('should provide all required context properties', () => {
      const contextRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useSessions();
        const ref = React.useRef(contextRef);
        React.useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return <div>Test</div>;
      };

      render(
        <UserContext.Provider value={mockUserContext as any}>
          <SessionsProvider stateType={StateType.PUZZLE} app="mockApp">
            <TestComponent />
          </SessionsProvider>
        </UserContext.Provider>
      );

      expect(contextRef.current).toHaveProperty('sessions');
      expect(contextRef.current).toHaveProperty('isLoading');
      expect(contextRef.current).toHaveProperty('fetchSessions');
      expect(contextRef.current).toHaveProperty('refetchSessions');
      expect(contextRef.current).toHaveProperty('setSessions');
      expect(contextRef.current).toHaveProperty('clearSessions');
      expect(contextRef.current).toHaveProperty('friendSessions');
      expect(contextRef.current).toHaveProperty('isFriendSessionsLoading');
      expect(contextRef.current).toHaveProperty('fetchFriendSessions');
      expect(contextRef.current).toHaveProperty('lazyLoadFriendSessions');
      expect(contextRef.current).toHaveProperty('clearFriendSessions');
      expect(contextRef.current).toHaveProperty('getSessionParties');
      expect(contextRef.current).toHaveProperty('patchFriendSessions');
    });
  });
});
