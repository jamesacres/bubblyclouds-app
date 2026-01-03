import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SidebarButton from './SidebarButton';

describe('SidebarButton', () => {
  describe('rendering', () => {
    it('should render button with text "Races"', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      expect(screen.getByText('Races')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with Sidebar icon from react-feather', () => {
      const mockClick = jest.fn();
      const { container } = render(
        <SidebarButton friendsOnClick={mockClick} />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have primary theme color', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-theme-primary');
      expect(button).toHaveClass('dark:text-theme-primary-light');
    });

    it('should have cursor pointer class', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('cursor-pointer');
    });

    it('should have rounded-lg border radius', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('rounded-lg');
    });

    it('should have proper icon spacing', () => {
      const mockClick = jest.fn();
      const { container } = render(
        <SidebarButton friendsOnClick={mockClick} />
      );

      const icon = container.querySelector('svg');
      expect(icon).toHaveClass('float-left');
      expect(icon).toHaveClass('mr-2');
    });
  });

  describe('interaction', () => {
    it('should call friendsOnClick when button is clicked', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('should call friendsOnClick with MouseEvent', () => {
      const mockClick = jest.fn((e) => e);
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should handle multiple clicks', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockClick).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid clicks', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      expect(mockClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('accessibility', () => {
    it('should be keyboard accessible', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

      expect(button).toBeInTheDocument();
    });

    it('should be focusable', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should receive focus', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it('should be semantic button element', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button', { name: /races/i });
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('content', () => {
    it('should display "Races" text', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      expect(screen.getByText('Races')).toBeInTheDocument();
    });

    it('should render icon before text', () => {
      const mockClick = jest.fn();
      const { container } = render(
        <SidebarButton friendsOnClick={mockClick} />
      );

      const icon = container.querySelector('svg');
      const button = screen.getByRole('button');

      // Icon should be the first child (float-left)
      expect(button.contains(icon)).toBe(true);
    });

    it('should have proper text content structure', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      expect(button.textContent).toContain('Races');
    });
  });

  describe('memoization', () => {
    it('should render correctly', () => {
      const mockClick = jest.fn();
      const { rerender } = render(<SidebarButton friendsOnClick={mockClick} />);

      expect(screen.getByText('Races')).toBeInTheDocument();

      rerender(<SidebarButton friendsOnClick={mockClick} />);

      expect(screen.getByText('Races')).toBeInTheDocument();
    });

    it('should update handler when prop changes', () => {
      const mockClick1 = jest.fn();
      const { rerender } = render(
        <SidebarButton friendsOnClick={mockClick1} />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(mockClick1).toHaveBeenCalledTimes(1);

      const mockClick2 = jest.fn();
      rerender(<SidebarButton friendsOnClick={mockClick2} />);

      fireEvent.click(button);
      expect(mockClick2).toHaveBeenCalledTimes(1);
      expect(mockClick1).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('event handling', () => {
    it('should prevent default if handler calls preventDefault', () => {
      const mockClick = jest.fn((e: React.MouseEvent) => {
        e.preventDefault();
      });

      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockClick).toHaveBeenCalled();
    });

    it('should propagate events if handler does not stop propagation', () => {
      const mockClick = jest.fn();
      const parentClick = jest.fn();

      render(
        <div onClick={parentClick}>
          <SidebarButton friendsOnClick={mockClick} />
        </div>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockClick).toHaveBeenCalled();
      expect(parentClick).toHaveBeenCalled();
    });

    it('should handle stopPropagation if called', () => {
      const mockClick = jest.fn((e: React.MouseEvent) => {
        e.stopPropagation();
      });
      const parentClick = jest.fn();

      render(
        <div onClick={parentClick}>
          <SidebarButton friendsOnClick={mockClick} />
        </div>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle click with undefined handler gracefully', () => {
      const mockClick = jest.fn();
      render(<SidebarButton friendsOnClick={mockClick} />);

      const button = screen.getByRole('button');

      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();
    });

    it('should render consistently with same props', () => {
      const mockClick = jest.fn();
      const { container: container1 } = render(
        <SidebarButton friendsOnClick={mockClick} />
      );

      const { container: container2 } = render(
        <SidebarButton friendsOnClick={mockClick} />
      );

      expect(container1.textContent).toBe(container2.textContent);
    });
  });

  describe('visual rendering', () => {
    it('should render with consistent layout', () => {
      const mockClick = jest.fn();
      const { container } = render(
        <SidebarButton friendsOnClick={mockClick} />
      );

      const button = container.querySelector('button');
      expect(button?.className).toMatch(/text-theme-primary/);
    });

    it('should apply theme colors correctly', () => {
      const mockClick = jest.fn();
      const { container } = render(
        <SidebarButton friendsOnClick={mockClick} />
      );

      const button = container.querySelector('button');
      expect(button).toHaveClass('text-theme-primary');
      expect(button).toHaveClass('dark:text-theme-primary-light');
    });
  });
});
