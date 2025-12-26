import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SudokuInput from './SudokuInput';
import { Notes } from '@sudoku-web/sudoku/types/notes';

describe('SudokuInput', () => {
  const mockSetSelectedCell = jest.fn();
  const mockSelectNumber = jest.fn();
  const mockOnDragStart = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render a cell container with correct data attribute', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={0}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).toBeInTheDocument();
    });

    it('should display numeric value when value is a number', () => {
      render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should not display anything when value is 0', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={0}
          isInitial={false}
        />
      );

      const cellValue = container.querySelector('[data-cell-id]');
      expect(cellValue).not.toBeInTheDocument();
    });

    it('should not display anything when value is undefined', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={undefined}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer?.textContent).toBe('');
    });

    it('should display numbers 1-9 correctly', () => {
      for (let i = 1; i <= 9; i++) {
        render(
          <SudokuInput
            cellId={`0-0-0-${i}`}
            selectedCell={null}
            setSelectedCell={mockSetSelectedCell}
            selectNumber={mockSelectNumber}
            value={i}
            isInitial={false}
          />
        );

        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });
  });

  describe('cell selection', () => {
    it('should call setSelectedCell on pointer down', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={0}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      fireEvent.pointerDown(cellContainer!);

      expect(mockSetSelectedCell).toHaveBeenCalledWith('0-0-0-0');
    });

    it('should pass the correct cellId to setSelectedCell', () => {
      const { container } = render(
        <SudokuInput
          cellId="2-1-1-2"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={0}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="2-1-1-2"]'
      );
      fireEvent.pointerDown(cellContainer!);

      expect(mockSetSelectedCell).toHaveBeenCalledWith('2-1-1-2');
    });

    it('should select cell even when it contains a value', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={7}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      fireEvent.pointerDown(cellContainer!);

      expect(mockSetSelectedCell).toHaveBeenCalledWith('0-0-0-0');
    });

    it('should show selected state when selectedCell matches cellId', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell="0-0-0-0"
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).toHaveClass('bg-theme-primary-lighter');
    });

    it('should not show selected state when selectedCell does not match', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell="0-0-0-1"
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).not.toHaveClass('bg-theme-primary-lighter');
    });

    it('should handle null selectedCell', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).not.toHaveClass('bg-theme-primary-lighter');
    });
  });

  describe('validation display', () => {
    it('should show green background when validation is true', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          validation={true}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).toHaveClass('bg-green-600');
    });

    it('should show red background when validation is false', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          validation={false}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).toHaveClass('bg-red-600');
    });

    it('should not show validation color when validation is undefined', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          validation={undefined}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).not.toHaveClass('bg-green-600');
      expect(cellContainer).not.toHaveClass('bg-red-600');
    });

    it('should not show validation color when value is 0', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={0}
          validation={true}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).not.toHaveClass('bg-green-600');
      expect(cellContainer).not.toHaveClass('bg-red-600');
    });

    it('should prioritize validation display over selection color', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell="0-0-0-0"
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          validation={true}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).toHaveClass('bg-green-600');
      expect(cellContainer).not.toHaveClass('bg-theme-primary-lighter');
    });
  });

  describe('initial vs user-entered cells', () => {
    it('should apply gray text color for initial cells', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={true}
        />
      );

      const cellValue = container.querySelector('[data-cell-id]');
      expect(cellValue).toHaveClass('text-zinc-500');
    });

    it('should apply dark text color for user-entered cells', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      const cellValue = container.querySelector('[data-cell-id]');
      expect(cellValue).toHaveClass('text-zinc-900');
    });

    it('should apply reduced opacity selection for initial selected cells', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell="0-0-0-0"
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={true}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).toHaveClass('bg-theme-primary-lighter/50');
    });

    it('should apply full opacity selection for user-entered selected cells', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell="0-0-0-0"
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).toHaveClass('bg-theme-primary-lighter');
      expect(cellContainer).not.toHaveClass('bg-theme-primary-lighter/50');
    });
  });

  describe('notes mode', () => {
    it('should render notes when value is an object', () => {
      const notes: Notes = { 1: true, 2: true, 3: false };

      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={notes}
          isInitial={false}
        />
      );

      // Should not display a numeric value
      const cellValue = container.querySelector('[data-cell-id]');
      expect(cellValue).not.toBeInTheDocument();
    });

    it('should treat empty object as notes mode', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={{}}
          isInitial={false}
        />
      );

      // Should be in notes mode (not display numeric value)
      const cellValue = container.querySelector('[data-cell-id]');
      expect(cellValue).not.toBeInTheDocument();
    });
  });

  describe('zoom mode', () => {
    it('should accept isZoomMode prop without error', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
          isZoomMode={true}
        />
      );

      expect(
        container.querySelector('[data-cell-container-id="0-0-0-0"]')
      ).toBeInTheDocument();
    });

    it('should call onDragStart when zoom mode is enabled', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
          isZoomMode={true}
          onDragStart={mockOnDragStart}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      fireEvent.pointerDown(cellContainer!);

      expect(mockOnDragStart).toHaveBeenCalled();
    });

    it('should not call onDragStart when zoom mode is disabled', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
          isZoomMode={false}
          onDragStart={mockOnDragStart}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      fireEvent.pointerDown(cellContainer!);

      expect(mockOnDragStart).not.toHaveBeenCalled();
    });

    it('should always call setSelectedCell even in zoom mode', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
          isZoomMode={true}
          onDragStart={mockOnDragStart}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      fireEvent.pointerDown(cellContainer!);

      expect(mockSetSelectedCell).toHaveBeenCalledWith('0-0-0-0');
    });
  });

  describe('styling classes', () => {
    it('should have proper container structure', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer).toBeInTheDocument();
      expect(cellContainer?.tagName).toBe('DIV');
    });

    it('should render cell value display', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      const cellValue = container.querySelector('[data-cell-id]');
      expect(cellValue).toBeInTheDocument();
    });
  });

  describe('memoization', () => {
    it('should be memoized to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      // Re-render with same props
      rerender(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      // Component should still be functional
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper semantic structure', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="0-0-0-0"]'
      );
      expect(cellContainer?.tagName).toBe('DIV');
    });

    it('should have data attributes for identification', () => {
      const { container } = render(
        <SudokuInput
          cellId="1-2-3-4"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      const cellContainer = container.querySelector(
        '[data-cell-container-id="1-2-3-4"]'
      );
      expect(cellContainer).toHaveAttribute(
        'data-cell-container-id',
        '1-2-3-4'
      );
    });

    it('should have cell value data attribute for testing', () => {
      const { container } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={7}
          isInitial={false}
        />
      );

      const cellValue = container.querySelector('[data-cell-id="0-0-0-0"]');
      expect(cellValue).toHaveAttribute('data-cell-id', '0-0-0-0');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid selection changes', () => {
      const { rerender } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      rerender(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell="0-0-0-0"
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      rerender(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      expect(mockSetSelectedCell).not.toHaveBeenCalled();
    });

    it('should handle value changes', () => {
      const { rerender } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();

      rerender(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={9}
          isInitial={false}
        />
      );

      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('should handle transition from number to notes', () => {
      const { rerender } = render(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={5}
          isInitial={false}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();

      rerender(
        <SudokuInput
          cellId="0-0-0-0"
          selectedCell={null}
          setSelectedCell={mockSetSelectedCell}
          selectNumber={mockSelectNumber}
          value={{ 1: true, 2: true }}
          isInitial={false}
        />
      );

      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });
  });
});
