import React from 'react';
import { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GlobalStateProvider, {
  GlobalStateContext,
  GlobalState,
} from './GlobalStateProvider';

describe('GlobalStateProvider', () => {
  describe('provider setup', () => {
    it('should provide GlobalStateContext', () => {
      expect(GlobalStateContext).toBeDefined();
    });

    it('should render children', () => {
      render(
        <GlobalStateProvider>
          <div>Test Content</div>
        </GlobalStateProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <GlobalStateProvider>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </GlobalStateProvider>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('should render empty children', () => {
      const { container } = render(
        <GlobalStateProvider>
          <div />
        </GlobalStateProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle fragment children', () => {
      render(
        <GlobalStateProvider>
          <>
            <div>Fragment Child 1</div>
            <div>Fragment Child 2</div>
          </>
        </GlobalStateProvider>
      );

      expect(screen.getByText('Fragment Child 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment Child 2')).toBeInTheDocument();
    });
  });

  describe('initial state', () => {
    it('should provide initial state with isForceOffline false', () => {
      let contextValue: [GlobalState, any] | undefined;

      const TestComponent = () => {
        contextValue = useContext(GlobalStateContext);
        return <div>Test</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(contextValue).toBeDefined();
      expect(contextValue?.[0]).toBeDefined();
      expect(contextValue?.[0].isForceOffline).toBe(false);
    });

    it('should provide setState function', () => {
      let setState: any;

      const TestComponent = () => {
        const [, setGlobalState] = useContext(GlobalStateContext)!;
        setState = setGlobalState;
        return <div>Test</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(typeof setState).toBe('function');
    });
  });

  describe('state updates', () => {
    it('should update isForceOffline through setState', async () => {
      let globalState: GlobalState | undefined;
      let setState: any;

      const TestComponent = () => {
        const [state, setStateFunc] = useContext(GlobalStateContext)!;
        globalState = state;
        setState = setStateFunc;
        return <div>{state.isForceOffline ? 'Offline' : 'Online'}</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(globalState?.isForceOffline).toBe(false);

      // Update state
      setState((prevState: GlobalState) => ({
        ...prevState,
        isForceOffline: true,
      }));

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

    it('should toggle isForceOffline state', async () => {
      let setState: any;

      const TestComponent = () => {
        const [state, setStateFunc] = useContext(GlobalStateContext)!;
        setState = setStateFunc;
        return (
          <div>{state.isForceOffline ? 'Forced Offline' : 'Normal Online'}</div>
        );
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(screen.getByText('Normal Online')).toBeInTheDocument();

      setState({ isForceOffline: true });

      await waitFor(() => {
        expect(screen.getByText('Forced Offline')).toBeInTheDocument();
      });

      setState({ isForceOffline: false });

      await waitFor(() => {
        expect(screen.getByText('Normal Online')).toBeInTheDocument();
      });
    });

    it('should preserve state across multiple children', async () => {
      const states: GlobalState[] = [];

      const ChildComponent1 = () => {
        const [state] = useContext(GlobalStateContext)!;
        states[0] = state;
        return (
          <div>Child 1: {state.isForceOffline ? 'Offline' : 'Online'}</div>
        );
      };

      const ChildComponent2 = () => {
        const [state] = useContext(GlobalStateContext)!;
        states[1] = state;
        return (
          <div>Child 2: {state.isForceOffline ? 'Offline' : 'Online'}</div>
        );
      };

      let setState: any;

      const ControlComponent = () => {
        const [, setStateFunc] = useContext(GlobalStateContext)!;
        setState = setStateFunc;
        return null;
      };

      render(
        <GlobalStateProvider>
          <ChildComponent1 />
          <ChildComponent2 />
          <ControlComponent />
        </GlobalStateProvider>
      );

      setState({ isForceOffline: true });

      await waitFor(() => {
        expect(states[0].isForceOffline).toBe(true);
        expect(states[1].isForceOffline).toBe(true);
      });
    });
  });

  describe('multiple consumers', () => {
    it('should provide same state to all consumers', async () => {
      const states: Array<{ value: boolean; id: number }> = [];

      const Consumer = ({ id }: { id: number }) => {
        const [state] = useContext(GlobalStateContext)!;
        states.push({ value: state.isForceOffline, id });
        return <div>Consumer {id}</div>;
      };

      render(
        <GlobalStateProvider>
          <Consumer id={1} />
          <Consumer id={2} />
          <Consumer id={3} />
        </GlobalStateProvider>
      );

      expect(states).toHaveLength(3);
      expect(states[0].value).toBe(states[1].value);
      expect(states[1].value).toBe(states[2].value);
    });

    it('should update all consumers when state changes', async () => {
      const renderCounts: { [key: number]: number } = {};

      const Consumer = ({ id }: { id: number }) => {
        const [state, setState] = useContext(GlobalStateContext)!;
        renderCounts[id] = (renderCounts[id] || 0) + 1;

        const handleToggle = () => {
          setState((prev) => ({
            ...prev,
            isForceOffline: !prev.isForceOffline,
          }));
        };

        return (
          <button onClick={handleToggle} data-testid={`button-${id}`}>
            Consumer {id}: {state.isForceOffline ? 'Offline' : 'Online'}
          </button>
        );
      };

      const { getByTestId } = render(
        <GlobalStateProvider>
          <Consumer id={1} />
          <Consumer id={2} />
        </GlobalStateProvider>
      );

      const button1 = getByTestId('button-1');
      expect(screen.getAllByText(/Online/)).toHaveLength(2);

      button1.click();

      await waitFor(() => {
        expect(screen.getAllByText(/Offline/)).toHaveLength(2);
      });
    });
  });

  describe('state persistence', () => {
    it('should maintain state during re-renders', async () => {
      let rerenderCount = 0;

      const TestComponent = () => {
        const [state, setState] = useContext(GlobalStateContext)!;
        rerenderCount++;

        return (
          <div>
            <p>{state.isForceOffline ? 'Offline' : 'Online'}</p>
            <button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  isForceOffline: !prev.isForceOffline,
                }))
              }
              data-testid="toggle-button"
            >
              Toggle
            </button>
          </div>
        );
      };

      const { getByTestId } = render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(screen.getByText('Online')).toBeInTheDocument();
      const initialRenderCount = rerenderCount;

      getByTestId('toggle-button').click();

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });

      expect(rerenderCount).toBeGreaterThan(initialRenderCount);
    });
  });

  describe('nested providers', () => {
    it('should work with nested GlobalStateProviders', () => {
      let outerState: GlobalState | undefined;
      let innerState: GlobalState | undefined;

      const OuterComponent = () => {
        const [state] = useContext(GlobalStateContext)!;
        outerState = state;
        return <div>Outer: {state.isForceOffline ? 'Offline' : 'Online'}</div>;
      };

      const InnerComponent = () => {
        const [state] = useContext(GlobalStateContext)!;
        innerState = state;
        return <div>Inner: {state.isForceOffline ? 'Offline' : 'Online'}</div>;
      };

      render(
        <GlobalStateProvider>
          <OuterComponent />
          <GlobalStateProvider>
            <InnerComponent />
          </GlobalStateProvider>
        </GlobalStateProvider>
      );

      expect(outerState).toBeDefined();
      expect(innerState).toBeDefined();
      // Inner should have its own state instance
      expect(outerState).not.toBe(innerState);
    });
  });

  describe('context value shape', () => {
    it('should provide tuple of [state, setState]', () => {
      let contextValue: any;

      const TestComponent = () => {
        contextValue = useContext(GlobalStateContext);
        return null;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(Array.isArray(contextValue)).toBe(true);
      expect(contextValue).toHaveLength(2);
    });

    it('should have correct state shape', () => {
      let state: any;

      const TestComponent = () => {
        const [globalState] = useContext(GlobalStateContext)!;
        state = globalState;
        return null;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(state).toHaveProperty('isForceOffline');
      expect(Object.keys(state)).toContain('isForceOffline');
    });
  });

  describe('edge cases', () => {
    it('should handle setState with callback function', async () => {
      let setState: any;

      const TestComponent = () => {
        const [state, setStateFunc] = useContext(GlobalStateContext)!;
        setState = setStateFunc;
        return <div>{state.isForceOffline ? 'Offline' : 'Online'}</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      setState((prev: GlobalState) => ({
        ...prev,
        isForceOffline: !prev.isForceOffline,
      }));

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

    it('should handle rapid state updates', async () => {
      let setState: any;
      let finalState: GlobalState | undefined;

      const TestComponent = () => {
        const [state, setStateFunc] = useContext(GlobalStateContext)!;
        finalState = state;
        setState = setStateFunc;
        return <div>{state.isForceOffline ? 'Offline' : 'Online'}</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      setState({ isForceOffline: true });
      setState({ isForceOffline: false });
      setState({ isForceOffline: true });
      setState({ isForceOffline: false });

      await waitFor(() => {
        expect(finalState?.isForceOffline).toBe(false);
      });
    });

    it('should handle empty children array', () => {
      const { container } = render(
        <GlobalStateProvider>{[]}</GlobalStateProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('should provide new state instance per provider', () => {
      let state1: any;
      let state2: any;

      const Consumer = ({ id }: { id: number }) => {
        const [state] = useContext(GlobalStateContext)!;
        if (id === 1) state1 = state;
        else state2 = state;
        return null;
      };

      render(
        <>
          <GlobalStateProvider>
            <Consumer id={1} />
          </GlobalStateProvider>
          <GlobalStateProvider>
            <Consumer id={2} />
          </GlobalStateProvider>
        </>
      );

      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state1).not.toBe(state2);
    });
  });
});
