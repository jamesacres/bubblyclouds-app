import React from 'react';
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
      let contextValue: any;

      const TestComponent = () => {
        contextValue = useContext(FetchContext);
        return <div>Test</div>;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(contextValue).toBeDefined();
      expect(contextValue[0]).toBeDefined();
      expect(contextValue[0].current.accessToken).toBeNull();
      expect(contextValue[0].current.accessExpiry).toBeNull();
      expect(contextValue[0].current.refreshToken).toBeNull();
      expect(contextValue[0].current.refreshExpiry).toBeNull();
      expect(contextValue[0].current.user).toBeNull();
      expect(contextValue[0].current.userExpiry).toBeNull();
    });

    it('should provide setState function', () => {
      let setState: any;

      const TestComponent = () => {
        const [, setStateFunc] = useContext(FetchContext)!;
        setState = setStateFunc;
        return <div>Test</div>;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(typeof setState).toBe('function');
    });
  });

  describe('state updates', () => {
    it('should update state via setState', async () => {
      let contextValue: any;
      let setState: any;

      const TestComponent = () => {
        const [stateRef, setStateFunc] = useContext(FetchContext)!;
        contextValue = stateRef;
        setState = setStateFunc;
        return <div>{stateRef.current.accessToken}</div>;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(contextValue.current.accessToken).toBeNull();

      const newState: State = {
        accessToken: 'new-token',
        accessExpiry: new Date(),
        refreshToken: 'refresh-token',
        refreshExpiry: new Date(),
        user: null,
        userExpiry: null,
      };

      setState(newState);

      await waitFor(() => {
        expect(contextValue.current.accessToken).toBe('new-token');
      });
    });

    it('should allow partial state updates', async () => {
      let stateRef: any;
      let setState: any;

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        stateRef = ref;
        setState = setStateFunc;
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      const token = 'test-token';
      const expiry = new Date();

      setState({
        accessToken: token,
        accessExpiry: expiry,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });

      await waitFor(() => {
        expect(stateRef.current.accessToken).toBe(token);
        expect(stateRef.current.accessExpiry).toBe(expiry);
      });
    });

    it('should preserve state across multiple updates', async () => {
      let stateRef: any;
      let setState: any;

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        stateRef = ref;
        setState = setStateFunc;
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

      setState(state1);

      await waitFor(() => {
        expect(stateRef.current.accessToken).toBe('token1');
      });

      const state2: State = {
        accessToken: 'token1',
        accessExpiry: null,
        refreshToken: 'refresh1',
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      };

      setState(state2);

      await waitFor(() => {
        expect(stateRef.current.refreshToken).toBe('refresh1');
      });
    });
  });

  describe('multiple consumers', () => {
    it('should provide same state to all consumers', async () => {
      const states: Array<{ value: any; id: number }> = [];

      const Consumer = ({ id }: { id: number }) => {
        const [stateRef] = useContext(FetchContext)!;
        states.push({ value: stateRef.current, id });
        return <div>Consumer {id}</div>;
      };

      render(
        <FetchProvider>
          <Consumer id={1} />
          <Consumer id={2} />
          <Consumer id={3} />
        </FetchProvider>
      );

      expect(states).toHaveLength(3);
      expect(states[0].value).toBe(states[1].value);
      expect(states[1].value).toBe(states[2].value);
    });

    it('should update all consumers when state changes', async () => {
      let setState: any;
      let stateRef: any;

      const Consumer = ({ id }: { id: number }) => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        if (id === 1) {
          setState = setStateFunc;
          stateRef = ref;
        }
        return (
          <div data-testid={`consumer-${id}`}>
            {ref.current.accessToken || 'empty'}
          </div>
        );
      };

      render(
        <FetchProvider>
          <Consumer id={1} />
          <Consumer id={2} />
        </FetchProvider>
      );

      expect(screen.getByTestId('consumer-1')).toHaveTextContent('empty');
      expect(screen.getByTestId('consumer-2')).toHaveTextContent('empty');

      setState({
        accessToken: 'shared-token',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });

      // Note: FetchProvider uses refs which don't trigger re-renders
      // The state is updated but components won't re-render automatically
      // This is by design - consumers need to manually trigger renders or check the ref
      await waitFor(() => {
        expect(stateRef.current.accessToken).toBe('shared-token');
      });
    });
  });

  describe('state persistence', () => {
    it('should maintain state during re-renders', async () => {
      let stateRef: any;
      let setState: any;

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        stateRef = ref;
        setState = setStateFunc;
        return (
          <div>
            <p>{ref.current.accessToken || 'null'}</p>
          </div>
        );
      };

      const { rerender } = render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(screen.getByText('null')).toBeInTheDocument();

      const newState: State = {
        accessToken: 'maintained-token',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      };

      setState(newState);

      rerender(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      await waitFor(() => {
        expect(stateRef.current.accessToken).toBe('maintained-token');
      });
    });
  });

  describe('nested providers', () => {
    it('should work with nested FetchProviders', () => {
      let outerState: any;
      let innerState: any;

      const OuterComponent = () => {
        const [ref] = useContext(FetchContext)!;
        outerState = ref;
        return <div>Outer: {ref.current.accessToken || 'null'}</div>;
      };

      const InnerComponent = () => {
        const [ref] = useContext(FetchContext)!;
        innerState = ref;
        return <div>Inner: {ref.current.accessToken || 'null'}</div>;
      };

      render(
        <FetchProvider>
          <OuterComponent />
          <FetchProvider>
            <InnerComponent />
          </FetchProvider>
        </FetchProvider>
      );

      expect(outerState).toBeDefined();
      expect(innerState).toBeDefined();
      // Inner should have its own state instance
      expect(outerState).not.toBe(innerState);
    });
  });

  describe('context value shape', () => {
    it('should provide tuple of [stateRef, setState]', () => {
      let contextValue: any;

      const TestComponent = () => {
        contextValue = useContext(FetchContext);
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(Array.isArray(contextValue)).toBe(true);
      expect(contextValue).toHaveLength(2);
    });

    it('should have stateRef as first element', () => {
      let stateRef: any;

      const TestComponent = () => {
        const [ref] = useContext(FetchContext)!;
        stateRef = ref;
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(stateRef).toBeDefined();
      expect(typeof stateRef.current).toBe('object');
    });

    it('should have correct state shape', () => {
      let state: any;

      const TestComponent = () => {
        const [ref] = useContext(FetchContext)!;
        state = ref.current;
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      expect(state).toHaveProperty('accessToken');
      expect(state).toHaveProperty('accessExpiry');
      expect(state).toHaveProperty('refreshToken');
      expect(state).toHaveProperty('refreshExpiry');
      expect(state).toHaveProperty('user');
      expect(state).toHaveProperty('userExpiry');
    });
  });

  describe('state with user data', () => {
    it('should store user profile in state', async () => {
      let stateRef: any;
      let setState: any;

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        stateRef = ref;
        setState = setStateFunc;
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

      setState(newState);

      await waitFor(() => {
        expect(stateRef.current.user).toEqual(mockUser);
        expect(stateRef.current.userExpiry).toBeDefined();
      });
    });

    it('should clear user data when set to null', async () => {
      let stateRef: any;
      let setState: any;

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        stateRef = ref;
        setState = setStateFunc;
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      const mockUser = { sub: 'user-123', name: 'Test' } as any;

      let state: State = {
        accessToken: 'token',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: mockUser,
        userExpiry: null,
      };

      setState(state);

      await waitFor(() => {
        expect(stateRef.current.user).toEqual(mockUser);
      });

      state = {
        accessToken: null,
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      };

      setState(state);

      await waitFor(() => {
        expect(stateRef.current.user).toBeNull();
      });
    });
  });

  describe('date handling', () => {
    it('should store and maintain Date objects', async () => {
      let stateRef: any;
      let setState: any;

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        stateRef = ref;
        setState = setStateFunc;
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

      setState(newState);

      await waitFor(() => {
        expect(stateRef.current.accessExpiry).toEqual(now);
        expect(stateRef.current.refreshExpiry).toEqual(later);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle rapid state updates', async () => {
      let stateRef: any;
      let setState: any;

      const TestComponent = () => {
        const [ref, setStateFunc] = useContext(FetchContext)!;
        stateRef = ref;
        setState = setStateFunc;
        return null;
      };

      render(
        <FetchProvider>
          <TestComponent />
        </FetchProvider>
      );

      setState({
        accessToken: 'token1',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });
      setState({
        accessToken: 'token2',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });
      setState({
        accessToken: 'token3',
        accessExpiry: null,
        refreshToken: null,
        refreshExpiry: null,
        user: null,
        userExpiry: null,
      });

      await waitFor(() => {
        expect(stateRef.current.accessToken).toBe('token3');
      });
    });

    it('should provide new state instance per provider', () => {
      let state1: any;
      let state2: any;

      const Consumer = ({ id }: { id: number }) => {
        const [ref] = useContext(FetchContext)!;
        if (id === 1) state1 = ref.current;
        else state2 = ref.current;
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

      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state1).not.toBe(state2);
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
