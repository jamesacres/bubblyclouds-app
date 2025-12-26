import React from 'react';
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
      let themeColor: string | undefined;

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        themeColor = color;
        return <div>Color: {color}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(themeColor).toBe('blue');
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

      let themeColor: string | undefined;

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        themeColor = color;
        return <div>Color: {color}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(themeColor).toBe('red');
    });

    it('should ignore invalid saved theme color', () => {
      localStorage.setItem('theme-color', 'invalid-color');

      let themeColor: string | undefined;

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        themeColor = color;
        return <div>Color: {color}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      // Should default to blue
      expect(themeColor).toBe('blue');
    });
  });

  describe('setThemeColor', () => {
    it('should update theme color', async () => {
      let setThemeColor: ((color: any) => void) | undefined;
      let currentColor: string | undefined;

      const TestComponent = () => {
        const { themeColor, setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
        currentColor = themeColor;
        return <div>Color: {themeColor}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(currentColor).toBe('blue');

      if (setThemeColor) {
        act(() => {
          setThemeColor!('red');
        });
      }

      await waitFor(() => {
        expect(screen.getByText('Color: red')).toBeInTheDocument();
      });
    });

    it('should save theme color to localStorage', () => {
      let setThemeColor: ((color: any) => void) | undefined;

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
        return <button onClick={() => setColor('green')}>Set Green</button>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      if (setThemeColor) {
        act(() => {
          setThemeColor!('green');
        });
      }

      expect(localStorage.getItem('theme-color')).toBe('green');
    });

    it('should remove old theme class and add new one', () => {
      let setThemeColor: ((color: any) => void) | undefined;

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
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

      if (setThemeColor) {
        act(() => {
          setThemeColor!('purple');
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

      let setThemeColor: ((color: any) => void) | undefined;

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      for (const color of validColors) {
        if (setThemeColor) {
          act(() => {
            setThemeColor!(color as any);
          });
        }
        expect(
          document.documentElement.classList.contains(`theme-${color}`)
        ).toBe(true);
      }
    });

    it('should persist theme color across remounts', () => {
      localStorage.setItem('theme-color', 'orange');

      let themeColor: string | undefined;

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        themeColor = color;
        return <div>Color: {color}</div>;
      };

      const { unmount } = render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(themeColor).toBe('orange');

      unmount();

      let themeColor2: string | undefined;

      const TestComponent2 = () => {
        const { themeColor: color } = useThemeColor();
        themeColor2 = color;
        return <div>Color: {color}</div>;
      };

      render(
        <ThemeColorProvider>
          <TestComponent2 />
        </ThemeColorProvider>
      );

      expect(themeColor2).toBe('orange');
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
      let contextValue: any;

      const TestComponent = () => {
        contextValue = useThemeColor();
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(contextValue).toBeDefined();
      expect(contextValue.themeColor).toBeDefined();
      expect(contextValue.setThemeColor).toBeDefined();
    });

    it('should have correct return type', () => {
      let hasThemeColor: boolean = false;
      let hasSetThemeColor: boolean = false;

      const TestComponent = () => {
        const context = useThemeColor();
        hasThemeColor = 'themeColor' in context;
        hasSetThemeColor = 'setThemeColor' in context;
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(hasThemeColor).toBe(true);
      expect(hasSetThemeColor).toBe(true);
    });
  });

  describe('multiple consumers', () => {
    it('should provide same theme color to all consumers', () => {
      const colors: string[] = [];

      const Consumer = ({ id }: { id: number }) => {
        const { themeColor } = useThemeColor();
        colors[id] = themeColor;
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

      expect(colors[0]).toBe('blue');
      expect(colors[1]).toBe('blue');
      expect(colors[2]).toBe('blue');
    });

    it('should update all consumers when theme changes', async () => {
      let setThemeColor: ((color: any) => void) | undefined;
      const colors: string[] = [];

      const Consumer = ({ id }: { id: number }) => {
        const { themeColor } = useThemeColor();
        colors[id] = themeColor;
        return (
          <div>
            Consumer {id}: {themeColor}
          </div>
        );
      };

      const Controller = () => {
        const { setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
        return <button onClick={() => setColor('cyan')}>Change</button>;
      };

      render(
        <ThemeColorProvider>
          <Consumer id={0} />
          <Consumer id={1} />
          <Controller />
        </ThemeColorProvider>
      );

      if (setThemeColor) {
        act(() => {
          setThemeColor!('cyan');
        });
      }

      await waitFor(() => {
        expect(colors[0]).toBe('cyan');
        expect(colors[1]).toBe('cyan');
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

      // Should have only theme-blue and no other theme classes
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
      let setThemeColor: ((color: any) => void) | undefined;

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
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
          if (setThemeColor) {
            setThemeColor!(color as any);
          }
        }
      });

      // Only the last color should be applied
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
      let setThemeColor: ((color: any) => void) | undefined;

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      act(() => {
        if (setThemeColor) {
          for (let i = 0; i < 100; i++) {
            setThemeColor!('red');
            setThemeColor!('green');
            setThemeColor!('blue');
          }
        }
      });

      expect(document.documentElement.classList.contains('theme-blue')).toBe(
        true
      );
    });

    it('should handle setting same color multiple times', () => {
      let setThemeColor: ((color: any) => void) | undefined;

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      act(() => {
        if (setThemeColor) {
          setThemeColor!('red');
          setThemeColor!('red');
          setThemeColor!('red');
        }
      });

      expect(document.documentElement.classList.contains('theme-red')).toBe(
        true
      );
    });

    it('should handle invalid color gracefully', () => {
      let setThemeColor: ((color: any) => void) | undefined;

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      act(() => {
        if (setThemeColor) {
          setThemeColor!('invalid' as any);
        }
      });

      // Invalid color should still be set but not add a class
      expect(localStorage.getItem('theme-color')).toBe('invalid');
    });

    it('should handle nested providers', () => {
      let outerColor: string | undefined;
      let innerColor: string | undefined;

      const OuterComponent = () => {
        const { themeColor } = useThemeColor();
        outerColor = themeColor;
        return <div>Outer</div>;
      };

      const InnerComponent = () => {
        const { themeColor } = useThemeColor();
        innerColor = themeColor;
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

      expect(outerColor).toBe('blue');
      expect(innerColor).toBe('blue');
    });
  });

  describe('localStorage integration', () => {
    it('should save all color changes to localStorage', () => {
      let setThemeColor: ((color: any) => void) | undefined;

      const TestComponent = () => {
        const { setThemeColor: setColor } = useThemeColor();
        setThemeColor = setColor;
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
          if (setThemeColor) {
            setThemeColor!(color as any);
          }
        });
        expect(localStorage.getItem('theme-color')).toBe(color);
      }
    });

    it('should load from localStorage on mount', () => {
      localStorage.setItem('theme-color', 'teal');

      let themeColor: string | undefined;

      const TestComponent = () => {
        const { themeColor: color } = useThemeColor();
        themeColor = color;
        return null;
      };

      render(
        <ThemeColorProvider>
          <TestComponent />
        </ThemeColorProvider>
      );

      expect(themeColor).toBe('teal');
    });
  });
});
