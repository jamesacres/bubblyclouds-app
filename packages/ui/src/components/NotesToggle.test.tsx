import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Toggle } from './NotesToggle';

describe('Toggle', () => {
  describe('rendering', () => {
    it('should render toggle component', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('should render with correct initial checked state when enabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={true} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should render with correct initial checked state when disabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveAttribute('aria-checked', 'false');
    });

    it('should render toggle button with proper dimensions', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveClass('h-7');
      expect(toggle).toHaveClass('w-12');
    });

    it('should render slider indicator inside toggle', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const slider = container.querySelector('[aria-hidden="true"]');
      expect(slider).toBeInTheDocument();
    });
  });

  describe('styling - enabled state', () => {
    it('should have primary color when enabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={true} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveClass('bg-theme-primary');
    });

    it('should translate slider to right when enabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={true} setEnabled={setEnabled} />
      );
      const slider = container.querySelector('[aria-hidden="true"]');
      expect(slider).toHaveClass('translate-x-5');
    });

    it('should have white slider background when enabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={true} setEnabled={setEnabled} />
      );
      const slider = container.querySelector('[aria-hidden="true"]');
      expect(slider).toHaveClass('bg-white');
    });
  });

  describe('styling - disabled state', () => {
    it('should have gray color when disabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveClass('bg-gray-400');
    });

    it('should have dark gray color in dark mode when disabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveClass('dark:bg-gray-600');
    });

    it('should translate slider to left when disabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const slider = container.querySelector('[aria-hidden="true"]');
      expect(slider).toHaveClass('translate-x-0');
    });
  });

  describe('interaction', () => {
    it('should call setEnabled with true when clicked while disabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );

      const toggle = container.querySelector('button');
      fireEvent.click(toggle!);

      expect(setEnabled).toHaveBeenCalledWith(true);
    });

    it('should call setEnabled with false when clicked while enabled', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={true} setEnabled={setEnabled} />
      );

      const toggle = container.querySelector('button');
      fireEvent.click(toggle!);

      expect(setEnabled).toHaveBeenCalledWith(false);
    });

    it('should handle multiple clicks', () => {
      const setEnabled = jest.fn();
      const { container, rerender } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );

      const toggle = container.querySelector('button');
      fireEvent.click(toggle!);
      expect(setEnabled).toHaveBeenCalledWith(true);

      setEnabled.mockClear();

      rerender(<Toggle isEnabled={true} setEnabled={setEnabled} />);
      fireEvent.click(toggle!);
      expect(setEnabled).toHaveBeenCalledWith(false);
    });
  });

  describe('transitions', () => {
    it('should have transition classes for smooth animation', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveClass('transition-colors');
      expect(toggle).toHaveClass('duration-200');
      expect(toggle).toHaveClass('ease-in-out');
    });

    it('should have slider transition classes', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const slider = container.querySelector('[aria-hidden="true"]');
      expect(slider).toHaveClass('transition');
      expect(slider).toHaveClass('duration-200');
      expect(slider).toHaveClass('ease-in-out');
    });
  });

  describe('layout and structure', () => {
    it('should have rounded-full class', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveClass('rounded-full');
    });

    it('should have cursor-pointer for interactive indication', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveClass('cursor-pointer');
    });

    it('should have proper padding', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveClass('p-1');
    });

    it('should have slider with proper size', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const slider = container.querySelector('[aria-hidden="true"]');
      expect(slider).toHaveClass('size-5');
      expect(slider).toHaveClass('rounded-full');
    });
  });

  describe('accessibility', () => {
    it('should be keyboard accessible with focus outline', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toBeInTheDocument();
      expect(toggle?.tagName).toBe('BUTTON');
    });

    it('should have outline-none in focus-outline', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveClass('focus:outline-none');
    });

    it('should have aria-checked attribute', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={true} setEnabled={setEnabled} />
      );
      const toggle = container.querySelector('button');
      expect(toggle).toHaveAttribute('aria-checked');
    });

    it('should have aria-hidden true for slider indicator', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );
      const slider = container.querySelector('[aria-hidden="true"]');
      expect(slider).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('prop changes', () => {
    it('should update when isEnabled prop changes', () => {
      const setEnabled = jest.fn();
      const { container, rerender } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );

      let toggle = container.querySelector('button');
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      rerender(<Toggle isEnabled={true} setEnabled={setEnabled} />);
      toggle = container.querySelector('button');
      expect(toggle).toHaveAttribute('aria-checked', 'true');
    });

    it('should update callback when setEnabled prop changes', () => {
      const setEnabled1 = jest.fn();
      const { container, rerender } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled1} />
      );

      const setEnabled2 = jest.fn();
      rerender(<Toggle isEnabled={false} setEnabled={setEnabled2} />);

      const toggle = container.querySelector('button');
      fireEvent.click(toggle!);

      expect(setEnabled2).toHaveBeenCalledWith(true);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid toggle clicks', () => {
      const setEnabled = jest.fn();
      const { container } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );

      const toggle = container.querySelector('button');
      fireEvent.click(toggle!);
      fireEvent.click(toggle!);
      fireEvent.click(toggle!);

      expect(setEnabled).toHaveBeenCalledTimes(3);
    });

    it('should maintain state consistency', () => {
      const setEnabled = jest.fn();
      const { container, rerender } = render(
        <Toggle isEnabled={false} setEnabled={setEnabled} />
      );

      fireEvent.click(container.querySelector('button')!);
      expect(setEnabled).toHaveBeenCalledWith(true);

      rerender(<Toggle isEnabled={true} setEnabled={setEnabled} />);
      fireEvent.click(container.querySelector('button')!);
      expect(setEnabled).toHaveBeenLastCalledWith(false);
    });
  });
});
