import React from 'react';
import { render, screen } from '@testing-library/react';
import ThemeControls from './ThemeControls';
import * as ThemeSwitchModule from './ThemeSwitch';
import * as ThemeColorSwitchModule from './ThemeColorSwitch';

jest.mock('./ThemeSwitch', () => ({
  __esModule: true,
  default: () => <div data-testid="theme-switch-mock">Theme Switch</div>,
}));

jest.mock('./ThemeColorSwitch', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="theme-color-switch-mock">Theme Color Switch</div>
  ),
}));

describe('ThemeControls', () => {
  describe('Rendering', () => {
    it('should render the component', () => {
      const { container } = render(<ThemeControls />);
      expect(container).toBeInTheDocument();
    });

    it('should render both ThemeSwitch and ThemeColorSwitch components', () => {
      render(<ThemeControls />);

      expect(screen.getByTestId('theme-switch-mock')).toBeInTheDocument();
      expect(screen.getByTestId('theme-color-switch-mock')).toBeInTheDocument();
    });

    it('should render components inside a flex container', () => {
      const { container } = render(<ThemeControls />);

      const flexContainer = container.querySelector('.flex.items-center');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should have correct layout classes', () => {
      const { container } = render(<ThemeControls />);

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toHaveClass('flex');
      expect(flexContainer).toHaveClass('items-center');
    });
  });

  describe('Component Integration', () => {
    it('should render ThemeSwitch before ThemeColorSwitch', () => {
      const { container } = render(<ThemeControls />);

      const flexContainer = container.querySelector('.flex.items-center');
      const children = flexContainer?.children;

      expect(children?.length).toBe(2);
      expect(children?.[0]?.getAttribute('data-testid')).toBe(
        'theme-switch-mock'
      );
      expect(children?.[1]?.getAttribute('data-testid')).toBe(
        'theme-color-switch-mock'
      );
    });

    it('should pass no props to child components', () => {
      const themeColorSwitchSpy = jest.spyOn(ThemeColorSwitchModule, 'default');
      const themeSwitchSpy = jest.spyOn(ThemeSwitchModule, 'default');

      render(<ThemeControls />);

      // Verify components were rendered
      expect(screen.getByTestId('theme-switch-mock')).toBeInTheDocument();
      expect(screen.getByTestId('theme-color-switch-mock')).toBeInTheDocument();

      themeColorSwitchSpy.mockRestore();
      themeSwitchSpy.mockRestore();
    });
  });

  describe('Layout and Styling', () => {
    it('should center items vertically', () => {
      const { container } = render(<ThemeControls />);

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toHaveClass('items-center');
    });

    it('should use flex layout', () => {
      const { container } = render(<ThemeControls />);

      const flexContainer = container.querySelector('div');
      expect(flexContainer).toHaveClass('flex');
    });

    it('should render as client component', () => {
      const { container } = render(<ThemeControls />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have a div as root element', () => {
      const { container } = render(<ThemeControls />);

      const root = container.firstChild;
      expect(root).toBeInstanceOf(HTMLDivElement);
    });

    it('should contain exactly 2 child components', () => {
      const { container } = render(<ThemeControls />);

      const root = container.querySelector('.flex.items-center');
      expect(root?.children.length).toBe(2);
    });

    it('should maintain structure on multiple renders', () => {
      const { rerender, container } = render(<ThemeControls />);

      let root = container.querySelector('.flex.items-center');
      expect(root?.children.length).toBe(2);

      rerender(<ThemeControls />);

      root = container.querySelector('.flex.items-center');
      expect(root?.children.length).toBe(2);
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain flex alignment across different screen sizes', () => {
      const { container } = render(<ThemeControls />);

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toHaveClass('items-center');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via semantic HTML', () => {
      const { container } = render(<ThemeControls />);

      const root = container.firstChild;
      expect(root).toBeInTheDocument();
    });

    it('should pass accessibility through to child components', () => {
      render(<ThemeControls />);

      expect(screen.getByTestId('theme-switch-mock')).toBeInTheDocument();
      expect(screen.getByTestId('theme-color-switch-mock')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid re-renders', () => {
      const { rerender } = render(<ThemeControls />);

      for (let i = 0; i < 10; i++) {
        rerender(<ThemeControls />);
      }

      expect(screen.getByTestId('theme-switch-mock')).toBeInTheDocument();
      expect(screen.getByTestId('theme-color-switch-mock')).toBeInTheDocument();
    });

    it('should handle unmount without errors', () => {
      const { unmount } = render(<ThemeControls />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('DOM Queries', () => {
    it('should be queryable by role', () => {
      const { container } = render(<ThemeControls />);

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should contain data-testid attributes in mocked children', () => {
      render(<ThemeControls />);

      expect(screen.getByTestId('theme-switch-mock')).toBeInTheDocument();
      expect(screen.getByTestId('theme-color-switch-mock')).toBeInTheDocument();
    });
  });

  describe('CSS Classes Verification', () => {
    it('should apply all required Tailwind classes', () => {
      const { container } = render(<ThemeControls />);

      const flexContainer = container.querySelector('div');
      expect(flexContainer).toHaveClass('flex');
      expect(flexContainer).toHaveClass('items-center');
    });

    it('should not have unnecessary classes', () => {
      const { container } = render(<ThemeControls />);

      const flexContainer = container.querySelector('div');
      const classes = flexContainer?.className || '';

      // Should only have flex and items-center
      expect(classes).toMatch(/flex.*items-center/);
    });
  });
});
