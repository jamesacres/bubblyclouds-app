import React, { useRef, useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ThemeColorProvider, useThemeColor } from './ThemeColorProvider';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({ theme: 'light' })),
}));

describe('ThemeColorProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    jest.clearAllMocks();
  });

  afterEach(() => {
    document.documentElement.className = '';
  });

  describe('provider setup', () => {
    it('should render children', () => {
      render(
        <ThemeColorProvider>
          <div>Test Content</div>
        </ThemeColorProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <ThemeColorProvider>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </ThemeColorProvider>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
      expect(screen.getByText('Third')).toBeInTheDocument();
    });

    it('should render fragment children', () => {
      render(
        <ThemeColorProvider>
          <>
            <div>Child 1</div>
            <div>Child 2</div>
          </>
        </ThemeColorProvider>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('initial state', () => {
    it('should provide initial theme color as blue', () => {
      const themeColorRef = { current: undefined as string | undefined };

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        const ref = useRef(themeColorRef);
        useEffect(() => {
          ref.current.current = color;
        }, [color]);
        return <div>Color: {color}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(themeColorRef.current).toBe('blue');
      expect(screen.getByText('Color: blue')).toBeInTheDocument();
    });

    it('should apply initial theme class to document element', () => {
      render(
        <ThemeColorProvider>
          <div>Test</div>
        </ThemeColorProvider>
      );

      expect(document.documentElement.classList.contains('theme-blue')).toBe(
        true
      );
    });

    it('should load saved theme color from localStorage', () => {
      localStorage.setItem('theme-color', 'red');

      const themeColorRef = { current: undefined as string | undefined };

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        const ref = useRef(themeColorRef);
        useEffect(() => {
          ref.current.current = color;
        }, [color]);
        return <div>Color: {color}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(themeColorRef.current).toBe('red');
    });

    it('should ignore invalid saved theme color', () => {
      localStorage.setItem('theme-color', 'invalid-color');

      const themeColorRef = { current: undefined as string | undefined };

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        const ref = useRef(themeColorRef);
        useEffect(() => {
          ref.current.current = color;
        }, [color]);
        return <div>Color: {color}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(themeColorRef.current).toBe('blue');
    });
  });

  describe('setThemeColor', () => {
    it('should update theme color', async () => {
      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };
      const currentColorRef = { current: undefined as string | undefined };

      const TestComponent = () => {
        const { themeColor, setThemeColor: setColor } = useThemeColor();
        const ref1 = useRef(setThemeColorRef);
        const ref2 = useRef(currentColorRef);
        useEffect(() => {
          ref1.current.current = setColor;
          ref2.current.current = themeColor;
        }, [setColor, themeColor]);
        return <div>Color: {themeColor}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(currentColorRef.current).toBe('blue');

      if (setThemeColorRef.current) {
        act(() => {
          setThemeColorRef.current!('red');
        });
      }

      await waitFor(() => {
        expect(screen.getByText('Color: red')).toBeInTheDocument();
      });
    });

    it('should save theme color to localStorage', () => {
      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        const ref = useRef(setThemeColorRef);
        useEffect(() => {
          ref.current.current = setColor;
        }, [setColor]);
        return <button onClick={() => setColor('green')}>Set Green</button>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      if (setThemeColorRef.current) {
        act(() => {
          setThemeColorRef.current!('green');
        });
      }

      expect(localStorage.getItem('theme-color')).toBe('green');
    });

    it('should remove old theme class and add new one', () => {
      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        const ref = useRef(setThemeColorRef);
        useEffect(() => {
          ref.current.current = setColor;
        }, [setColor]);
        return <button onClick={() => setColor('purple')}>Set Purple</button>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(document.documentElement.classList.contains('theme-blue')).toBe(
        true
      );

      if (setThemeColorRef.current) {
        act(() => {
          setThemeColorRef.current!('purple');
        });
      }

      expect(document.documentElement.classList.contains('theme-blue')).toBe(
        false
      );
      expect(document.documentElement.classList.contains('theme-purple')).toBe(
        true
      );
    });

    it('should handle all valid theme colors', () => {
      const validColors = [
        'blue',
        'red',
        'green',
        'purple',
        'amber',
        'cyan',
        'pink',
        'indigo',
        'orange',
        'teal',
        'slate',
        'rose',
        'emerald',
        'sky',
        'violet',
        'lime',
        'fuchsia',
        'yellow',
        'stone',
        'zinc',
      ];

      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        const ref = useRef(setThemeColorRef);
        useEffect(() => {
          ref.current.current = setColor;
        }, [setColor]);
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      for (const color of validColors) {
        if (setThemeColorRef.current) {
          act(() => {
            setThemeColorRef.current!(color as any);
          });
        }
        expect(
          document.documentElement.classList.contains(`theme-${color}`)
        ).toBe(true);
      }
    });

    it('should persist theme color across remounts', () => {
      localStorage.setItem('theme-color', 'orange');

      const themeColorRef = { current: undefined as string | undefined };

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        const ref = useRef(themeColorRef);
        useEffect(() => {
          ref.current.current = color;
        }, [color]);
        return <div>Color: {color}</div>;
      };

      const { unmount } = render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(themeColorRef.current).toBe('orange');

      unmount();

      const themeColor2Ref = { current: undefined as string | undefined };

      const TestComponent2 = () => {
        const { themeColor: color } = useThemeColor();
        const ref = useRef(themeColor2Ref);
        useEffect(() => {
          ref.current.current = color;
        }, [color]);
        return <div>Color: {color}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent2 />
        </ThemeColorProvider>
      );

      expect(themeColor2Ref.current).toBe('orange');
    });
  });

  describe('useThemeColor hook', () => {
    it('should throw when used outside provider', () => {
      const TestComponent = () => {
        useThemeColor();
        return null;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useThemeColor must be used within a ThemeColorProvider');
    });

    it('should provide context value to consumers', () => {
      const contextValueRef = { current: undefined as any };

      const TestComponent = () => {
        const context = useThemeColor();
        const ref = useRef(contextValueRef);
        useEffect(() => {
          ref.current.current = context;
        }, [context]);
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(contextValueRef.current).toBeDefined();
      expect(contextValueRef.current.themeColor).toBeDefined();
      expect(contextValueRef.current.setThemeColor).toBeDefined();
    });

    it('should have correct return type', () => {
      const hasThemeColorRef = { current: false };
      const hasSetThemeColorRef = { current: false };

      const TestComponent = () => {
        const context = useThemeColor();
        const ref1 = useRef(hasThemeColorRef);
        const ref2 = useRef(hasSetThemeColorRef);
        useEffect(() => {
          ref1.current.current = 'themeColor' in context;
          ref2.current.current = 'setThemeColor' in context;
        }, [context]);
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(hasThemeColorRef.current).toBe(true);
      expect(hasSetThemeColorRef.current).toBe(true);
    });
  });

  describe('multiple consumers', () => {
    it('should provide same theme color to all consumers', () => {
      const colorsRef = { current: [] as string[] };

      const Consumer = ({ id }: { id: number }) => {
        const { themeColor } = useThemeColor();
        const ref = useRef(colorsRef);
        useEffect(() => {
          ref.current.current[id] = themeColor;
        }, [id, themeColor]);
        return (
          <div>
            Consumer {id}: {themeColor}
          </div>
        );
      };

      render(
        <ThemeColorProvider>
          <Consumer id={0} />
          <Consumer id={1} />
          <Consumer id={2} />
        </ThemeColorProvider>
      );

      expect(colorsRef.current[0]).toBe('blue');
      expect(colorsRef.current[1]).toBe('blue');
      expect(colorsRef.current[2]).toBe('blue');
    });

    it('should update all consumers when theme changes', async () => {
      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };
      const colorsRef = { current: [] as string[] };

      const Consumer = ({ id }: { id: number }) => {
        const { themeColor } = useThemeColor();
        const ref = useRef(colorsRef);
        useEffect(() => {
          ref.current.current[id] = themeColor;
        }, [id, themeColor]);
        return (
          <div>
            Consumer {id}: {themeColor}
          </div>
        );
      };

      const Controller = () => {
        const { setThemeColor: setColor } = useThemeColor();
        const ref = useRef(setThemeColorRef);
        useEffect(() => {
          ref.current.current = setColor;
        }, [setColor]);
        return <button onClick={() => setColor('cyan')}>Change</button>;
      };

      render(
        <ThemeColorProvider>
          <Consumer id={0} />
          <Consumer id={1} />
          <Controller />
        </ThemeColorProvider>
      );

      if (setThemeColorRef.current) {
        act(() => {
          setThemeColorRef.current!('cyan');
        });
      }

      await waitFor(() => {
        expect(colorsRef.current[0]).toBe('cyan');
        expect(colorsRef.current[1]).toBe('cyan');
      });
    });
  });

  describe('theme class management', () => {
    it('should remove all theme classes before adding new one', () => {
      document.documentElement.classList.add('theme-red');
      document.documentElement.classList.add('theme-green');

      render(
        <ThemeColorProvider>
          <div>Test</div>
        </ThemeColorProvider>
      );

      const themeClasses = Array.from(
        document.documentElement.classList
      ).filter((c) => c.startsWith('theme-'));
      expect(themeClasses).toContain('theme-blue');
      expect(themeClasses.length).toBe(1);
    });

    it('should add theme class on mount', () => {
      render(
        <ThemeColorProvider>
          <div>Test</div>
        </ThemeColorProvider>
      );

      expect(document.documentElement.classList.contains('theme-blue')).toBe(
        true
      );
    });

    it('should remove theme class on unmount', () => {
      const { unmount } = render(
        <ThemeColorProvider>
          <div>Test</div>
        </ThemeColorProvider>
      );

      expect(document.documentElement.classList.contains('theme-blue')).toBe(
        true
      );

      unmount();

      expect(document.documentElement.classList.contains('theme-blue')).toBe(
        false
      );
    });

    it('should handle rapid theme changes', () => {
      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        const ref = useRef(setThemeColorRef);
        useEffect(() => {
          ref.current.current = setColor;
        }, [setColor]);
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      const colors = ['red', 'green', 'blue', 'purple', 'orange'];
      act(() => {
        for (const color of colors) {
          if (setThemeColorRef.current) {
            setThemeColorRef.current!(color as any);
          }
        }
      });

      expect(document.documentElement.classList.contains('theme-orange')).toBe(
        true
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty children', () => {
      const { container } = render(
        <ThemeColorProvider>{null}</ThemeColorProvider>
      );

      expect(container).toBeInTheDocument();
    });

    it('should handle very rapid color changes', () => {
      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        const ref = useRef(setThemeColorRef);
        useEffect(() => {
          ref.current.current = setColor;
        }, [setColor]);
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      act(() => {
        if (setThemeColorRef.current) {
          for (let i = 0; i < 100; i++) {
            setThemeColorRef.current!('red');
            setThemeColorRef.current!('green');
            setThemeColorRef.current!('blue');
          }
        }
      });

      expect(document.documentElement.classList.contains('theme-blue')).toBe(
        true
      );
    });

    it('should handle setting same color multiple times', () => {
      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        const ref = useRef(setThemeColorRef);
        useEffect(() => {
          ref.current.current = setColor;
        }, [setColor]);
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      act(() => {
        if (setThemeColorRef.current) {
          setThemeColorRef.current!('red');
          setThemeColorRef.current!('red');
          setThemeColorRef.current!('red');
        }
      });

      expect(document.documentElement.classList.contains('theme-red')).toBe(
        true
      );
    });

    it('should handle invalid color gracefully', () => {
      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        const ref = useRef(setThemeColorRef);
        useEffect(() => {
          ref.current.current = setColor;
        }, [setColor]);
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      act(() => {
        if (setThemeColorRef.current) {
          setThemeColorRef.current!('invalid' as any);
        }
      });

      expect(localStorage.getItem('theme-color')).toBe('invalid');
    });

    it('should handle nested providers', () => {
      const outerColorRef = { current: undefined as string | undefined };
      const innerColorRef = { current: undefined as string | undefined };

      const OuterComponent = () => {
        const { themeColor } = useThemeColor();
        const ref = useRef(outerColorRef);
        useEffect(() => {
          ref.current.current = themeColor;
        }, [themeColor]);
        return <div>Outer</div>;
      };

      const InnerComponent = () => {
        const { themeColor } = useThemeColor();
        const ref = useRef(innerColorRef);
        useEffect(() => {
          ref.current.current = themeColor;
        }, [themeColor]);
        return <div>Inner</div>;
      };

      render(
        <ThemeColorProvider>
          <OuterComponent />
          <ThemeColorProvider>
            <InnerComponent />
          </ThemeColorProvider>
        </ThemeColorProvider>
      );

      expect(outerColorRef.current).toBe('blue');
      expect(innerColorRef.current).toBe('blue');
    });
  });

  describe('localStorage integration', () => {
    it('should save all color changes to localStorage', () => {
      const setThemeColorRef = {
        current: undefined as ((_color: any) => void) | undefined,
      };

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        const ref = useRef(setThemeColorRef);
        useEffect(() => {
          ref.current.current = setColor;
        }, [setColor]);
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      const colors = ['red', 'green', 'blue', 'purple'];

      for (const color of colors) {
        act(() => {
          if (setThemeColorRef.current) {
            setThemeColorRef.current!(color as any);
          }
        });
        expect(localStorage.getItem('theme-color')).toBe(color);
      }
    });

    it('should load from localStorage on mount', () => {
      localStorage.setItem('theme-color', 'teal');

      const themeColorRef = { current: undefined as string | undefined };

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        const ref = useRef(themeColorRef);
        useEffect(() => {
          ref.current.current = color;
        }, [color]);
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(themeColorRef.current).toBe('teal');
    });
  });
});
