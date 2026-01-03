import React from 'react';
import { useContext, useRef, useEffect } from 'react';
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
      const contextValueRef = {
        current: undefined as [GlobalState, any] | undefined,
      };

      const TestComponent = () => {
        const context = useContext(GlobalStateContext);
        const ref = useRef(contextValueRef);
        useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return <div>Test</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(contextValueRef.current).toBeDefined();
      expect(contextValueRef.current?.[0]).toBeDefined();
      expect(contextValueRef.current?.[0].isForceOffline).toBe(false);
    });

    it('should provide setState function', () => {
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [, setGlobalState] = useContext(GlobalStateContext)!;
        const ref = useRef(setStateRef);
        useEffect(() => {
          ref.current.current = setGlobalState;
        }, [setGlobalState]);
        return <div>Test</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(typeof setStateRef.current).toBe('function');
    });
  });

  describe('state updates', () => {
    it('should update isForceOffline through setState', async () => {
      const globalStateRef = { current: undefined as GlobalState | undefined };
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [state, setStateFunc] = useContext(GlobalStateContext)!;
        const globalStateLocalRef = useRef(globalStateRef);
        const setStateLocalRef = useRef(setStateRef);
        useEffect(() => {
          globalStateLocalRef.current.current = state;
          setStateLocalRef.current.current = setStateFunc;
        }, [state, setStateFunc]);
        return <div>{state.isForceOffline ? 'Offline' : 'Online'}</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(globalStateRef.current?.isForceOffline).toBe(false);

      // Update state
      setStateRef.current((prevState: GlobalState) => ({
        ...prevState,
        isForceOffline: true,
      }));

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

    it('should toggle isForceOffline state', async () => {
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [state, setStateFunc] = useContext(GlobalStateContext)!;
        const ref = useRef(setStateRef);
        useEffect(() => {
          ref.current.current = setStateFunc;
        }, [setStateFunc]);
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

      setStateRef.current({ isForceOffline: true });

      await waitFor(() => {
        expect(screen.getByText('Forced Offline')).toBeInTheDocument();
      });

      setStateRef.current({ isForceOffline: false });

      await waitFor(() => {
        expect(screen.getByText('Normal Online')).toBeInTheDocument();
      });
    });

    it('should preserve state across multiple children', async () => {
      const statesRef = { current: [] as GlobalState[] };

      const ChildComponent1 = () => {
        const [state] = useContext(GlobalStateContext)!;
        const ref = useRef(statesRef);
        useEffect(() => {
          ref.current.current[0] = state;
        }, [state]);
        return (
          <div>Child 1: {state.isForceOffline ? 'Offline' : 'Online'}</div>
        );
      };

      const ChildComponent2 = () => {
        const [state] = useContext(GlobalStateContext)!;
        const ref = useRef(statesRef);
        useEffect(() => {
          ref.current.current[1] = state;
        }, [state]);
        return (
          <div>Child 2: {state.isForceOffline ? 'Offline' : 'Online'}</div>
        );
      };

      const setStateRef = { current: undefined as any };

      const ControlComponent = () => {
        const [, setStateFunc] = useContext(GlobalStateContext)!;
        const ref = useRef(setStateRef);
        useEffect(() => {
          ref.current.current = setStateFunc;
        }, [setStateFunc]);
        return null;
      };

      render(
        <GlobalStateProvider>
          <ChildComponent1 />
          <ChildComponent2 />
          <ControlComponent />
        </GlobalStateProvider>
      );

      setStateRef.current({ isForceOffline: true });

      await waitFor(() => {
        expect(statesRef.current[0].isForceOffline).toBe(true);
        expect(statesRef.current[1].isForceOffline).toBe(true);
      });
    });
  });

  describe('multiple consumers', () => {
    it('should provide same state to all consumers', async () => {
      const statesRef = {
        current: [] as Array<{ value: boolean; id: number }>,
      };

      const Consumer = ({ id }: { id: number }) => {
        const [state] = useContext(GlobalStateContext)!;
        const ref = useRef(statesRef);
        useEffect(() => {
          ref.current.current.push({ value: state.isForceOffline, id });
        }, [state.isForceOffline, id]);
        return <div>Consumer {id}</div>;
      };

      render(
        <GlobalStateProvider>
          <Consumer id={1} />
          <Consumer id={2} />
          <Consumer id={3} />
        </GlobalStateProvider>
      );

      await waitFor(() => {
        expect(statesRef.current.length).toBeGreaterThanOrEqual(3);
      });

      expect(statesRef.current[0].value).toBe(statesRef.current[1].value);
      expect(statesRef.current[1].value).toBe(statesRef.current[2].value);
    });

    it('should update all consumers when state changes', async () => {
      const renderCounts = { current: {} as { [key: number]: number } };

      const Consumer = ({ id }: { id: number }) => {
        const [state, setState] = useContext(GlobalStateContext)!;
        const ref = useRef(renderCounts);
        useEffect(() => {
          ref.current.current[id] = (ref.current.current[id] || 0) + 1;
        });

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
      const outerStateRef = { current: undefined as GlobalState | undefined };
      const innerStateRef = { current: undefined as GlobalState | undefined };

      const OuterComponent = () => {
        const [state] = useContext(GlobalStateContext)!;
        const ref = useRef(outerStateRef);
        useEffect(() => {
          ref.current.current = state;
        }, [state]);
        return <div>Outer: {state.isForceOffline ? 'Offline' : 'Online'}</div>;
      };

      const InnerComponent = () => {
        const [state] = useContext(GlobalStateContext)!;
        const ref = useRef(innerStateRef);
        useEffect(() => {
          ref.current.current = state;
        }, [state]);
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

      expect(outerStateRef.current).toBeDefined();
      expect(innerStateRef.current).toBeDefined();
      // Inner should have its own state instance
      expect(outerStateRef.current).not.toBe(innerStateRef.current);
    });
  });

  describe('context value shape', () => {
    it('should provide tuple of [state, setState]', () => {
      const contextValueRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useContext(GlobalStateContext);
        const ref = useRef(contextValueRef);
        useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return null;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(Array.isArray(contextValueRef.current)).toBe(true);
      expect(contextValueRef.current).toHaveLength(2);
    });

    it('should have correct state shape', () => {
      const stateRef = { current: undefined as any };

      const TestComponent = () => {
        const [globalState] = useContext(GlobalStateContext)!;
        const ref = useRef(stateRef);
        useEffect(() => {
          ref.current.current = globalState;
        }, [globalState]);
        return null;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      expect(stateRef.current).toHaveProperty('isForceOffline');
      expect(Object.keys(stateRef.current)).toContain('isForceOffline');
    });
  });

  describe('edge cases', () => {
    it('should handle setState with callback function', async () => {
      const setStateRef = { current: undefined as any };

      const TestComponent = () => {
        const [state, setStateFunc] = useContext(GlobalStateContext)!;
        const ref = useRef(setStateRef);
        useEffect(() => {
          ref.current.current = setStateFunc;
        }, [setStateFunc]);
        return <div>{state.isForceOffline ? 'Offline' : 'Online'}</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      setStateRef.current((prev: GlobalState) => ({
        ...prev,
        isForceOffline: !prev.isForceOffline,
      }));

      await waitFor(() => {
        expect(screen.getByText('Offline')).toBeInTheDocument();
      });
    });

    it('should handle rapid state updates', async () => {
      const setStateRef = { current: undefined as any };
      const finalStateRef = { current: undefined as GlobalState | undefined };

      const TestComponent = () => {
        const [state, setStateFunc] = useContext(GlobalStateContext)!;
        const finalStateLocalRef = useRef(finalStateRef);
        const setStateLocalRef = useRef(setStateRef);
        useEffect(() => {
          finalStateLocalRef.current.current = state;
          setStateLocalRef.current.current = setStateFunc;
        }, [state, setStateFunc]);
        return <div>{state.isForceOffline ? 'Offline' : 'Online'}</div>;
      };

      render(
        <GlobalStateProvider>
          <TestComponent />
        </GlobalStateProvider>
      );

      setStateRef.current({ isForceOffline: true });
      setStateRef.current({ isForceOffline: false });
      setStateRef.current({ isForceOffline: true });
      setStateRef.current({ isForceOffline: false });

      await waitFor(() => {
        expect(finalStateRef.current?.isForceOffline).toBe(false);
      });
    });

    it('should handle empty children array', () => {
      const { container } = render(
        <GlobalStateProvider>{[]}</GlobalStateProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('should provide new state instance per provider', () => {
      const state1Ref = { current: undefined as any };
      const state2Ref = { current: undefined as any };

      const Consumer = ({ id }: { id: number }) => {
        const [state] = useContext(GlobalStateContext)!;
        const ref1 = useRef(state1Ref);
        const ref2 = useRef(state2Ref);
        useEffect(() => {
          if (id === 1) ref1.current.current = state;
          else ref2.current.current = state;
        }, [state, id]);
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

      expect(state1Ref.current).toBeDefined();
      expect(state2Ref.current).toBeDefined();
      expect(state1Ref.current).not.toBe(state2Ref.current);
    });
  });
});
