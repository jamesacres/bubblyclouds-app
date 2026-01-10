import React, { useRef, useEffect } from 'react';
import { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import FetchProvider, { FetchContext, State } from './FetchProvider';

describe('FetchProvider', () => {
  describe('provider setup', () => {
    it('should provide FetchContext', () => {
      expect(FetchContext).toBeDefined();
    });

    it('should render children', () => {
      render(
        <FetchProvider>
          <div>Test Content</div>
        </FetchProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <FetchProvider>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </FetchProvider>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('should render empty children', () => {
      const { container } = render(
        <FetchProvider>
          <div />
        </FetchProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle fragment children', () => {
      render(
        <FetchProvider>
          <>
            <div>Fragment Child 1</div>
            <div>Fragment Child 2</div>
          </>
        </FetchProvider>
      );

      expect(screen.getByText('Fragment Child 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment Child 2')).toBeInTheDocument();
    });
  });

  describe('initial state', () => {
    it('should provide initial state with null values', () => {
      const contextValueRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(FetchContext);
        const ref = useRef(contextValueRef);
        useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return <div>Test</div>;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(contextValueRef.current).toBeDefined();
      expect(contextValueRef.current[0]).toBeDefined();
      expect(contextValueRef.current[0].current.accessToken).toBeNull();
      expect(contextValueRef.current[0].current.accessExpiry).toBeNull();
      expect(contextValueRef.current[0].current.refreshToken).toBeNull();
      expect(contextValueRef.current[0].current.refreshExpiry).toBeNull();
      expect(contextValueRef.current[0].current.user).toBeNull();
      expect(contextValueRef.current[0].current.userExpiry).toBeNull();
    });

    it('should provide setState function', () => {
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [, setStateFunc] = useContext(FetchContext)!;
        const ref = useRef(setStateRef);
        useEffect(() => {
          ref.current.current = setStateFunc;
        }, [setStateFunc]);
        return <div>Test</div>;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(typeof setStateRef.current).toBe('function');
    });
  });

  describe('state updates', () => {
    it('should update state via setState', async () => {
      const contextValueRef = { current: undefined as any };
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [stateRef, setStateFunc] = useContext(FetchContext)!;
        const ref1 = useRef(contextValueRef);
        const ref2 = useRef(setStateRef);
        useEffect(() => {
          ref1.current.current = stateRef;
          ref2.current.current = setStateFunc;
        }, [stateRef, setStateFunc]);
        return <div>Test</div>;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(contextValueRef.current.current.accessToken).toBeNull();

      const newState: State = {
        accessToken: 'new-token',
        accessExpiry: new Date(),
        refreshToken: 'refresh-token',
        refreshExpiry: new Date(),
        user: null,
        userExpiry: null,
      };

      setStateRef.current(newState);

      await waitFor(() => {
        expect(contextValueRef.current.current.accessToken).toBe('new-token');
      });
    });

    it('should allow partial state updates', async () => {
      const stateRefRef = { current: undefined as any };
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        const r1 = useRef(stateRefRef);
        const r2 = useRef(setStateRef);
        useEffect(() => {
          r1.current.current = ref;
          r2.current.current = setStateFunc;
        }, [ref, setStateFunc]);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      const token = 'test-token';
      const expiry = new Date();

      setStateRef.current({
        accessToken: token,
        accessExpiry: expiry,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });

      await waitFor(() => {
        expect(stateRefRef.current.current.accessToken).toBe(token);
        expect(stateRefRef.current.current.accessExpiry).toBe(expiry);
      });
    });

    it('should preserve state across multiple updates', async () => {
      const stateRefRef = { current: undefined as any };
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        const r1 = useRef(stateRefRef);
        const r2 = useRef(setStateRef);
        useEffect(() => {
          r1.current.current = ref;
          r2.current.current = setStateFunc;
        }, [ref, setStateFunc]);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      const state1: State = {
        accessToken: 'token1',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      };

      setStateRef.current(state1);

      await waitFor(() => {
        expect(stateRefRef.current.current.accessToken).toBe('token1');
      });

      const state2: State = {
        accessToken: 'token1',
        accessExpiry: null,
        refreshToken: 'refresh1',
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      };

      setStateRef.current(state2);

      await waitFor(() => {
        expect(stateRefRef.current.current.refreshToken).toBe('refresh1');
      });
    });
  });

  describe('multiple consumers', () => {
    it('should provide same state to all consumers', async () => {
      const statesRef = { current: [] as Array<{ value: any; id: number }> };

      const Consumer = ({ id }: { id: number }) => {
        const [stateRef] = useContext(FetchContext)!;
        const ref = useRef(statesRef);
        useEffect(() => {
          ref.current.current.push({ value: stateRef.current, id });
        }, [id, stateRef]);
        return <div>Consumer {id}</div>;
      };

      render(
        <FetchProvider>
          <Consumer id={1} />
          <Consumer id={2} />
          <Consumer id={3} />
        </FetchProvider>
      );

      await waitFor(() => {
        expect(statesRef.current).toHaveLength(3);
        expect(statesRef.current[0].value).toBe(statesRef.current[1].value);
        expect(statesRef.current[1].value).toBe(statesRef.current[2].value);
      });
    });

    it('should update all consumers when state changes', async () => {
      const setStateRef = { current: undefined as any };
      const stateRefRef = { current: undefined as any };

      const Consumer = ({ id }: { id: number }) => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        const r1 = useRef(setStateRef);
        const r2 = useRef(stateRefRef);
        useEffect(() => {
          if (id === 1) {
            r1.current.current = setStateFunc;
            r2.current.current = ref;
          }
        }, [id, ref, setStateFunc]);
        return <div data-testid={`consumer-${id}`}>Consumer {id}</div>;
      };

      render(
        <FetchProvider>
          <Consumer id={1} />
          <Consumer id={2} />
        </FetchProvider>
      );

      await waitFor(() => {
        expect(setStateRef.current).toBeDefined();
      });

      setStateRef.current({
        accessToken: 'shared-token',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });

      await waitFor(() => {
        expect(stateRefRef.current.current.accessToken).toBe('shared-token');
      });
    });
  });

  describe('state persistence', () => {
    it('should maintain state during re-renders', async () => {
      const stateRefRef = { current: undefined as any };
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        const r1 = useRef(stateRefRef);
        const r2 = useRef(setStateRef);
        useEffect(() => {
          r1.current.current = ref;
          r2.current.current = setStateFunc;
        }, [ref, setStateFunc]);
        return <div>Test</div>;
      };

      const { rerender } = render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      const newState: State = {
        accessToken: 'maintained-token',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      };

      await waitFor(() => {
        expect(setStateRef.current).toBeDefined();
      });

      setStateRef.current(newState);

      rerender(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      await waitFor(() => {
        expect(stateRefRef.current.current.accessToken).toBe(
          'maintained-token'
        );
      });
    });
  });

  describe('nested providers', () => {
    it('should work with nested FetchProviders', () => {
      const outerStateRef = { current: undefined as any };
      const innerStateRef = { current: undefined as any };

      const OuterComponent = () => {
        const [ref] = useContext(FetchContext)!;
        const r = useRef(outerStateRef);
        useEffect(() => {
          r.current.current = ref;
        }, [ref]);
        return <div>Outer</div>;
      };

      const InnerComponent = () => {
        const [ref] = useContext(FetchContext)!;
        const r = useRef(innerStateRef);
        useEffect(() => {
          r.current.current = ref;
        }, [ref]);
        return <div>Inner</div>;
      };

      render(
        <FetchProvider>
          <OuterComponent />
          <FetchProvider>
            <InnerComponent />
          </FetchProvider>
        </FetchProvider>
      );

      expect(outerStateRef.current).toBeDefined();
      expect(innerStateRef.current).toBeDefined();
      expect(outerStateRef.current).not.toBe(innerStateRef.current);
    });
  });

  describe('context value shape', () => {
    it('should provide tuple of [stateRef, setState]', () => {
      const contextValueRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(FetchContext);
        const ref = useRef(contextValueRef);
        useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(Array.isArray(contextValueRef.current)).toBe(true);
      expect(contextValueRef.current).toHaveLength(2);
    });

    it('should have stateRef as first element', () => {
      const stateRefRef = { current: undefined as any };

      const TestComponent = () => {
        const [ref] = useContext(FetchContext)!;
        const r = useRef(stateRefRef);
        useEffect(() => {
          r.current.current = ref;
        }, [ref]);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(stateRefRef.current).toBeDefined();
      expect(typeof stateRefRef.current.current).toBe('object');
    });

    it('should have correct state shape', () => {
      const stateRef = { current: undefined as any };

      const TestComponent = () => {
        const [ref] = useContext(FetchContext)!;
        const r = useRef(stateRef);
        useEffect(() => {
          r.current.current = ref.current;
        }, [ref]);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(stateRef.current).toHaveProperty('accessToken');
      expect(stateRef.current).toHaveProperty('accessExpiry');
      expect(stateRef.current).toHaveProperty('refreshToken');
      expect(stateRef.current).toHaveProperty('refreshExpiry');
      expect(stateRef.current).toHaveProperty('user');
      expect(stateRef.current).toHaveProperty('userExpiry');
    });
  });

  describe('state with user data', () => {
    it('should store user profile in state', async () => {
      const stateRefRef = { current: undefined as any };
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        const r1 = useRef(stateRefRef);
        const r2 = useRef(setStateRef);
        useEffect(() => {
          r1.current.current = ref;
          r2.current.current = setStateFunc;
        }, [ref, setStateFunc]);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      const mockUser = {
        sub: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const newState: State = {
        accessToken: 'token',
        accessExpiry: null,
        refreshToken: 'refresh',
        refreshExpiry: null,
        user: mockUser as any,
        userExpiry: new Date(),
      };

      await waitFor(() => {
        expect(setStateRef.current).toBeDefined();
      });

      setStateRef.current(newState);

      await waitFor(() => {
        expect(stateRefRef.current.current.user).toEqual(mockUser);
        expect(stateRefRef.current.current.userExpiry).toBeDefined();
      });
    });

    it('should clear user data when set to null', async () => {
      const stateRefRef = { current: undefined as any };
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        const r1 = useRef(stateRefRef);
        const r2 = useRef(setStateRef);
        useEffect(() => {
          r1.current.current = ref;
          r2.current.current = setStateFunc;
        }, [ref, setStateFunc]);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      const mockUser = { sub: 'user-123', name: 'Test' } as any;

      const state: State = {
        accessToken: 'token',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: mockUser,
        userExpiry: null,
      };

      await waitFor(() => {
        expect(setStateRef.current).toBeDefined();
      });

      setStateRef.current(state);

      await waitFor(() => {
        expect(stateRefRef.current.current.user).toEqual(mockUser);
      });

      const clearState: State = {
        accessToken: null,
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      };

      setStateRef.current(clearState);

      await waitFor(() => {
        expect(stateRefRef.current.current.user).toBeNull();
      });
    });
  });

  describe('date handling', () => {
    it('should store and maintain Date objects', async () => {
      const stateRefRef = { current: undefined as any };
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        const r1 = useRef(stateRefRef);
        const r2 = useRef(setStateRef);
        useEffect(() => {
          r1.current.current = ref;
          r2.current.current = setStateFunc;
        }, [ref, setStateFunc]);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      const now = new Date();
      const later = new Date(now.getTime() + 3600000);

      const newState: State = {
        accessToken: 'token',
        accessExpiry: now,
        refreshToken: 'refresh',
        refreshExpiry: later,
        user: null,
        userExpiry: null,
      };

      await waitFor(() => {
        expect(setStateRef.current).toBeDefined();
      });

      setStateRef.current(newState);

      await waitFor(() => {
        expect(stateRefRef.current.current.accessExpiry).toEqual(now);
        expect(stateRefRef.current.current.refreshExpiry).toEqual(later);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle rapid state updates', async () => {
      const stateRefRef = { current: undefined as any };
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        const r1 = useRef(stateRefRef);
        const r2 = useRef(setStateRef);
        useEffect(() => {
          r1.current.current = ref;
          r2.current.current = setStateFunc;
        }, [ref, setStateFunc]);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      await waitFor(() => {
        expect(setStateRef.current).toBeDefined();
      });

      setStateRef.current({
        accessToken: 'token1',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });
      setStateRef.current({
        accessToken: 'token2',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });
      setStateRef.current({
        accessToken: 'token3',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });

      await waitFor(() => {
        expect(stateRefRef.current.current.accessToken).toBe('token3');
      });
    });

    it('should provide new state instance per provider', () => {
      const state1Ref = { current: undefined as any };
      const state2Ref = { current: undefined as any };

      const Consumer = ({ id }: { id: number }) => {
        const [ref] = useContext(FetchContext)!;
        const r1 = useRef(state1Ref);
        const r2 = useRef(state2Ref);
        useEffect(() => {
          if (id === 1) r1.current.current = ref.current;
          else r2.current.current = ref.current;
        }, [id, ref]);
        return null;
      };

      render(
        <>
          <FetchProvider>
            <Consumer id={1} />
          </FetchProvider>
          <FetchProvider>
            <Consumer id={2} />
          </FetchProvider>
        </>
      );

      expect(state1Ref.current).toBeDefined();
      expect(state2Ref.current).toBeDefined();
      expect(state1Ref.current).not.toBe(state2Ref.current);
    });

    it('should handle empty children array', () => {
      const { container } = render(<FetchProvider>{[]}</FetchProvider>);

      expect(container).toBeInTheDocument();
    });

    it('should handle null children', () => {
      const { container } = render(<FetchProvider>{null}</FetchProvider>);

      expect(container).toBeInTheDocument();
    });
  });
});
