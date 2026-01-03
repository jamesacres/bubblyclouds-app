import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumberPad } from './NumberPad';

describe('NumberPad', () => {
  const mockSelectNumber = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render 9 number buttons', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(9);
    });

    it('should render buttons with numbers 1-9', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      for (let i = 1; i <= 9; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it('should have correct styling classes', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const button = screen.getByRole('button', { name: '1' });
      expect(button).toHaveClass('cursor-pointer');
      expect(button).toHaveClass('text-2xl');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });

    it('should render with mobile layout (9 columns) by default', () => {
      const { container } = render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const grid = container.querySelector('.grid-cols-9');
      expect(grid).toBeInTheDocument();
    });

    it('should render with responsive classes for desktop', () => {
      const { container } = render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const grid = container.querySelector('.lg\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('user interaction', () => {
    it('should call selectNumber when a button is clicked', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const button = screen.getByRole('button', { name: '5' });
      fireEvent.click(button);

      expect(mockSelectNumber).toHaveBeenCalledWith(5);
      expect(mockSelectNumber).toHaveBeenCalledTimes(1);
    });

    it('should call selectNumber with the correct number for each button', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      for (let i = 1; i <= 9; i++) {
        const button = screen.getByRole('button', { name: i.toString() });
        fireEvent.click(button);
      }

      expect(mockSelectNumber).toHaveBeenCalledTimes(9);
      for (let i = 1; i <= 9; i++) {
        expect(mockSelectNumber).toHaveBeenCalledWith(i);
      }
    });

    it('should handle multiple clicks on the same button', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const button = screen.getByRole('button', { name: '1' });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockSelectNumber).toHaveBeenCalledTimes(3);
      expect(mockSelectNumber).toHaveBeenCalledWith(1);
    });
  });

  describe('disabled state', () => {
    it('should disable all buttons when isInputDisabled is true', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={true} />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should enable all buttons when isInputDisabled is false', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should show disabled cursor style when disabled', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={true} />
      );

      const button = screen.getByRole('button', { name: '1' });
      expect(button).toHaveClass('disabled:cursor-not-allowed');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should not call selectNumber when a disabled button is clicked', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={true} />
      );

      const button = screen.getByRole('button', { name: '1' });
      fireEvent.click(button);

      expect(mockSelectNumber).not.toHaveBeenCalled();
    });

    it('should have correct disabled classes applied', () => {
      const { container } = render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={true} />
      );

      const buttons = container.querySelectorAll('button[disabled]');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('should have proper button roles', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(9);
    });

    it('should be keyboard accessible', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const button = screen.getByRole('button', { name: '1' });
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have visible text labels', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      for (let i = 1; i <= 9; i++) {
        const button = screen.getByText(i.toString());
        expect(button).toBeVisible();
      }
    });
  });

  describe('styling', () => {
    it('should have dark mode text color', () => {
      const { container } = render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('dark:text-white');
        expect(button).toHaveClass('text-black');
      });
    });

    it('should have padding classes', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const button = screen.getByRole('button', { name: '1' });
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
    });

    it('should have rounded corners', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const button = screen.getByRole('button', { name: '1' });
      expect(button).toHaveClass('rounded-sm');
    });
  });

  describe('grid layout', () => {
    it('should render in a grid layout container', () => {
      const { container } = render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('w-full');
      expect(grid).toHaveClass('h-full');
    });

    it('should have correct row and column structure', () => {
      const { container } = render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const grid = container.querySelector('.mb-0');
      expect(grid).toHaveClass('grid-cols-9');
      expect(grid).toHaveClass('lg:grid-cols-3');
    });
  });

  describe('responsive behavior', () => {
    it('should render correctly on mobile (9 columns)', () => {
      const { container } = render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const grid = container.querySelector('.grid-cols-9');
      expect(grid).toBeInTheDocument();
    });

    it('should have desktop classes for larger screens', () => {
      const { container } = render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const grid = container.querySelector('.lg\\:grid-rows-3');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid clicks', () => {
      render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      const button = screen.getByRole('button', { name: '1' });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockSelectNumber).toHaveBeenCalledTimes(5);
      expect(mockSelectNumber).toHaveBeenCalledWith(1);
    });

    it('should work correctly when toggling isInputDisabled', () => {
      const { rerender } = render(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      let button = screen.getByRole('button', { name: '1' });
      expect(button).not.toBeDisabled();
      fireEvent.click(button);
      expect(mockSelectNumber).toHaveBeenCalledWith(1);

      rerender(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={true} />
      );

      button = screen.getByRole('button', { name: '1' });
      expect(button).toBeDisabled();

      rerender(
        <NumberPad selectNumber={mockSelectNumber} isInputDisabled={false} />
      );

      button = screen.getByRole('button', { name: '1' });
      expect(button).not.toBeDisabled();
    });

    it('should handle function reference changes', () => {
      const mockSelectNumber1 = jest.fn();
      const { rerender } = render(
        <NumberPad selectNumber={mockSelectNumber1} isInputDisabled={false} />
      );

      let button = screen.getByRole('button', { name: '1' });
      fireEvent.click(button);
      expect(mockSelectNumber1).toHaveBeenCalledWith(1);

      const mockSelectNumber2 = jest.fn();
      rerender(
        <NumberPad selectNumber={mockSelectNumber2} isInputDisabled={false} />
      );

      button = screen.getByRole('button', { name: '1' });
      fireEvent.click(button);
      expect(mockSelectNumber2).toHaveBeenCalledWith(1);
      expect(mockSelectNumber1).toHaveBeenCalledTimes(1);
    });
  });
});
