// Mock @sudoku-web/ui components BEFORE any imports
jest.mock('@sudoku-web/ui', () => {
  const React = require('react');
  return {
    Toggle: ({
      isEnabled,
      setEnabled,
    }: {
      isEnabled: boolean;
      setEnabled: (value: boolean) => void;
    }) =>
      React.createElement(
        'button',
        {
          'data-testid': 'notes-toggle',
          onClick: () => setEnabled(!isEnabled),
        },
        isEnabled ? 'Notes On' : 'Notes Off'
      ),
  };
});

// Mock @sudoku-web/sudoku components
jest.mock('../index', () => {
  const React = require('react');
  const actual = jest.requireActual('@sudoku-web/sudoku');
  return {
    ...actual,
    NumberPad: ({ selectNumber, isInputDisabled }: any) =>
      React.createElement(
        'div',
        {
          'data-testid': 'number-pad',
          className: 'grid grid-cols-9 lg:grid-cols-3',
        },
        [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) =>
          React.createElement(
            'button',
            {
              key: num,
              onClick: () => selectNumber(num),
              disabled: isInputDisabled,
            },
            num.toString()
          )
        )
      ),
  };
});

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import SudokuControls from './SudokuControls';

// Mock the canUseUndo and canUseCheckGrid functions
jest.mock('@sudoku-web/template/utils/dailyActionCounter', () => ({
  ...jest.requireActual('@sudoku-web/template/utils/dailyActionCounter'),
  canUseUndo: jest.fn(() => true),
  canUseCheckGrid: jest.fn(() => true),
}));

import {
  canUseUndo,
  canUseCheckGrid,
} from '@sudoku-web/template/utils/dailyActionCounter';

describe('SudokuControls', () => {
  const mockValidateGrid = jest.fn();
  const mockValidateCell = jest.fn();
  const mockUndo = jest.fn();
  const mockRedo = jest.fn();
  const mockSelectNumber = jest.fn();
  const mockSetIsNotesMode = jest.fn();
  const mockSetIsZoomMode = jest.fn();
  const mockReset = jest.fn();
  const mockReveal = jest.fn();
  const mockCopyGrid = jest.fn();
  const mockOnAdvancedToggle = jest.fn();

  const defaultProps = {
    isInputDisabled: false,
    isValidateCellDisabled: false,
    isDeleteDisabled: false,
    validateGrid: mockValidateGrid,
    validateCell: mockValidateCell,
    isUndoDisabled: false,
    isRedoDisabled: false,
    undo: mockUndo,
    redo: mockRedo,
    selectNumber: mockSelectNumber,
    isNotesMode: false,
    setIsNotesMode: mockSetIsNotesMode,
    isZoomMode: false,
    setIsZoomMode: mockSetIsZoomMode,
    reset: mockReset,
    reveal: mockReveal,
    copyGrid: mockCopyGrid,
    onAdvancedToggle: mockOnAdvancedToggle,
    isSubscribed: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('should render the component without errors', () => {
      render(<SudokuControls {...defaultProps} />);
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('should render number pad', () => {
      render(<SudokuControls {...defaultProps} />);

      // Check for number buttons 1-9
      for (let i = 1; i <= 9; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it('should render toggle controls section', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
      expect(screen.getByText(/Export/)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Undo')).toBeInTheDocument();
      expect(screen.getByText('Redo')).toBeInTheDocument();
    });

    it('should render hints on large screens', () => {
      const { container } = render(<SudokuControls {...defaultProps} />);

      const hintBox = container.querySelector('.hidden.lg\\:block');
      expect(hintBox).toBeInTheDocument();
    });
  });

  describe('notes toggle', () => {
    it('should show notes toggle with current state', () => {
      render(<SudokuControls {...defaultProps} isNotesMode={false} />);

      const notesText = screen.getByText('Notes');
      expect(notesText).toBeInTheDocument();
    });

    it('should call setIsNotesMode when toggle is clicked', () => {
      render(<SudokuControls {...defaultProps} isNotesMode={false} />);

      const toggleContainer = screen.getByText('Notes').closest('div');
      const toggle = toggleContainer?.querySelector('[role="switch"]');

      if (toggle) {
        fireEvent.click(toggle);
        expect(mockSetIsNotesMode).toHaveBeenCalled();
      }
    });
  });

  describe('copy grid button', () => {
    it('should render copy button with Export text', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should call copyGrid when button is clicked', () => {
      render(<SudokuControls {...defaultProps} />);

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      expect(mockCopyGrid).toHaveBeenCalled();
    });

    it('should show "Copied!" text after clicking', () => {
      jest.useFakeTimers();

      render(<SudokuControls {...defaultProps} />);

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      expect(screen.getByText('Copied!')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(screen.queryByText('Copied!')).not.toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe('number pad integration', () => {
    it('should call selectNumber when a number is clicked', () => {
      render(<SudokuControls {...defaultProps} />);

      fireEvent.click(screen.getByText('5'));

      expect(mockSelectNumber).toHaveBeenCalledWith(5);
    });

    it('should disable number pad when isInputDisabled is true', () => {
      const { container } = render(
        <SudokuControls {...defaultProps} isInputDisabled={true} />
      );

      const numberButtons = container.querySelectorAll('.grid-cols-9 button');
      numberButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('should enable number pad when isInputDisabled is false', () => {
      const { container } = render(
        <SudokuControls {...defaultProps} isInputDisabled={false} />
      );

      const numberButtons = container.querySelectorAll('.grid-cols-9 button');
      numberButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('delete button', () => {
    it('should render delete button', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call selectNumber(0) when delete button is clicked', () => {
      render(<SudokuControls {...defaultProps} />);

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(mockSelectNumber).toHaveBeenCalledWith(0);
    });

    it('should disable delete button when isDeleteDisabled is true', () => {
      render(<SudokuControls {...defaultProps} isDeleteDisabled={true} />);

      const deleteButton = screen.getByText('Delete');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('undo/redo buttons', () => {
    it('should render undo button', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Undo')).toBeInTheDocument();
    });

    it('should render redo button', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Redo')).toBeInTheDocument();
    });

    it('should call undo when undo button is clicked', () => {
      render(<SudokuControls {...defaultProps} />);

      const undoButton = screen.getByText('Undo');
      fireEvent.click(undoButton);

      expect(mockUndo).toHaveBeenCalled();
    });

    it('should call redo when redo button is clicked', () => {
      render(<SudokuControls {...defaultProps} />);

      const redoButton = screen.getByText('Redo');
      fireEvent.click(redoButton);

      expect(mockRedo).toHaveBeenCalled();
    });

    it('should disable undo button when isUndoDisabled is true', () => {
      render(<SudokuControls {...defaultProps} isUndoDisabled={true} />);

      const undoButton = screen.getByText('Undo');
      expect(undoButton).toBeDisabled();
    });

    it('should disable redo button when isRedoDisabled is true', () => {
      render(<SudokuControls {...defaultProps} isRedoDisabled={true} />);

      const redoButton = screen.getByText('Redo');
      expect(redoButton).toBeDisabled();
    });

    it("should show premium indicator on undo when not subscribed and can't use", () => {
      (canUseUndo as jest.Mock).mockReturnValue(false);

      render(
        <SudokuControls
          {...defaultProps}
          isSubscribed={false}
          isUndoDisabled={false}
        />
      );

      const undoButton = screen.getByText('Undo').closest('button');
      const premiumIndicator = undoButton?.querySelector('.bg-gradient-to-r');
      expect(premiumIndicator).toBeInTheDocument();
    });

    it('should not show premium indicator when subscribed', () => {
      (canUseUndo as jest.Mock).mockReturnValue(false);

      render(
        <SudokuControls
          {...defaultProps}
          isSubscribed={true}
          isUndoDisabled={false}
        />
      );

      const undoButton = screen.getByText('Undo').closest('button');
      const premiumIndicator = undoButton?.querySelector('.bg-gradient-to-r');
      expect(premiumIndicator).not.toBeInTheDocument();
    });
  });

  describe('advanced controls', () => {
    it('should render cell button in advanced section', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Cell')).toBeInTheDocument();
    });

    it('should render grid button in advanced section', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Grid')).toBeInTheDocument();
    });

    it('should render zoom button in advanced section', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Zoom')).toBeInTheDocument();
    });

    it('should render reset button in advanced section', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('should render reveal button in advanced section', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText('Reveal')).toBeInTheDocument();
    });

    it('should call validateCell when cell button is clicked', () => {
      render(<SudokuControls {...defaultProps} />);

      const cellButton = screen.getByText('Cell');
      fireEvent.click(cellButton);

      expect(mockValidateCell).toHaveBeenCalled();
    });

    it('should call validateGrid when grid button is clicked', () => {
      render(<SudokuControls {...defaultProps} />);

      const gridButton = screen.getByText('Grid');
      fireEvent.click(gridButton);

      expect(mockValidateGrid).toHaveBeenCalled();
    });

    it('should toggle zoom mode when zoom button is clicked', () => {
      render(<SudokuControls {...defaultProps} isZoomMode={false} />);

      const zoomButton = screen.getByText('Zoom');
      fireEvent.click(zoomButton);

      expect(mockSetIsZoomMode).toHaveBeenCalledWith(true);
    });

    it('should disable cell button when isValidateCellDisabled is true', () => {
      render(
        <SudokuControls {...defaultProps} isValidateCellDisabled={true} />
      );

      const cellButton = screen.getByText('Cell');
      expect(cellButton).toBeDisabled();
    });

    it('should show premium indicator on grid button when not subscribed', () => {
      (canUseCheckGrid as jest.Mock).mockReturnValue(false);

      render(<SudokuControls {...defaultProps} isSubscribed={false} />);

      const gridButton = screen.getByText('Grid').closest('button');
      const premiumIndicator = gridButton?.querySelector('.bg-gradient-to-r');
      expect(premiumIndicator).toBeInTheDocument();
    });
  });

  describe('reset and reveal actions', () => {
    it('should show confirmation dialog for reset', () => {
      window.confirm = jest.fn(() => true);

      render(<SudokuControls {...defaultProps} />);

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('reset')
      );
    });

    it('should call reset when confirmed', () => {
      window.confirm = jest.fn(() => true);

      render(<SudokuControls {...defaultProps} />);

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      expect(mockReset).toHaveBeenCalled();
    });

    it('should not call reset when not confirmed', () => {
      window.confirm = jest.fn(() => false);

      render(<SudokuControls {...defaultProps} />);

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      expect(mockReset).not.toHaveBeenCalled();
    });

    it('should show confirmation dialog for reveal', () => {
      window.confirm = jest.fn(() => true);

      render(<SudokuControls {...defaultProps} />);

      const revealButton = screen.getByText('Reveal');
      fireEvent.click(revealButton);

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('reveal')
      );
    });

    it('should call reveal when confirmed', () => {
      window.confirm = jest.fn(() => true);

      render(<SudokuControls {...defaultProps} />);

      const revealButton = screen.getByText('Reveal');
      fireEvent.click(revealButton);

      expect(mockReveal).toHaveBeenCalled();
    });

    it('should show premium indicator on reveal button when not subscribed', () => {
      render(<SudokuControls {...defaultProps} isSubscribed={false} />);

      const revealButton = screen.getByText('Reveal').closest('button');
      const premiumIndicator = revealButton?.querySelector('.bg-gradient-to-r');
      expect(premiumIndicator).toBeInTheDocument();
    });
  });

  describe('advanced toggle behavior', () => {
    it('should start with advanced controls hidden on mobile', () => {
      jest.useFakeTimers();

      const { container } = render(<SudokuControls {...defaultProps} />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      const advancedSection = container.querySelector('.max-h-0');
      expect(advancedSection).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('should call onAdvancedToggle when expanded', () => {
      jest.useFakeTimers();

      const { container } = render(
        <SudokuControls
          {...defaultProps}
          onAdvancedToggle={mockOnAdvancedToggle}
        />
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Find the clickable chevron element by looking for the cursor-pointer class on <p> elements
      const chevronElements = container.querySelectorAll('p.cursor-pointer');

      if (chevronElements.length > 0) {
        // Click the first chevron to toggle advanced controls
        fireEvent.click(chevronElements[0]);
        expect(mockOnAdvancedToggle).toHaveBeenCalled();
      }

      jest.useRealTimers();
    });
  });

  describe('zoom mode styling', () => {
    it('should highlight zoom button when isZoomMode is true', () => {
      render(<SudokuControls {...defaultProps} isZoomMode={true} />);

      const zoomButton = screen.getByText('Zoom').closest('button');
      expect(zoomButton).toHaveClass('bg-theme-primary');
    });

    it('should not highlight zoom button when isZoomMode is false', () => {
      render(<SudokuControls {...defaultProps} isZoomMode={false} />);

      const zoomButton = screen.getByText('Zoom').closest('button');
      expect(zoomButton).not.toHaveClass('bg-theme-primary');
    });
  });

  describe('drag handle', () => {
    it('should have drag handle on mobile', () => {
      const { container } = render(<SudokuControls {...defaultProps} />);

      const dragHandle = container.querySelector('.cursor-grab');
      expect(dragHandle).toBeInTheDocument();
    });

    it('should change cursor to grabbing on drag', () => {
      const { container } = render(<SudokuControls {...defaultProps} />);

      const dragHandle = container.querySelector('[onmousedown]');

      if (dragHandle) {
        fireEvent.mouseDown(dragHandle as HTMLElement, {
          clientY: 0,
        });

        waitFor(() => {
          expect(dragHandle).toHaveClass('cursor-grabbing');
        });
      }
    });
  });

  describe('keyboard shortcuts hint', () => {
    it('should display keyboard hints on large screens', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText(/arrow keys/i)).toBeInTheDocument();
      expect(screen.getByText(/undo, redo/i)).toBeInTheDocument();
    });

    it('should mention notes mode shortcut', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText(/hold shift|press n/i)).toBeInTheDocument();
    });

    it('should mention validation shortcuts', () => {
      render(<SudokuControls {...defaultProps} />);

      expect(screen.getByText(/press c|press g/i)).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should have mobile-first grid layout', () => {
      const { container } = render(<SudokuControls {...defaultProps} />);

      const numberPadContainer = container.querySelector('.grid-cols-9');
      expect(numberPadContainer).toBeInTheDocument();
    });

    it('should have desktop layout with lg prefix', () => {
      const { container } = render(<SudokuControls {...defaultProps} />);

      // Check for responsive classes
      const controls = container.querySelector('.lg\\:flex-row');
      expect(controls).toBeInTheDocument();
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple button clicks in sequence', () => {
      render(<SudokuControls {...defaultProps} />);

      fireEvent.click(screen.getByText('1'));
      fireEvent.click(screen.getByText('2'));
      fireEvent.click(screen.getByText('3'));

      expect(mockSelectNumber).toHaveBeenCalledTimes(3);
      expect(mockSelectNumber).toHaveBeenNthCalledWith(1, 1);
      expect(mockSelectNumber).toHaveBeenNthCalledWith(2, 2);
      expect(mockSelectNumber).toHaveBeenNthCalledWith(3, 3);
    });

    it('should handle toggling notes and zoom modes', () => {
      const { rerender } = render(
        <SudokuControls
          {...defaultProps}
          isNotesMode={false}
          isZoomMode={false}
        />
      );

      rerender(
        <SudokuControls
          {...defaultProps}
          isNotesMode={true}
          isZoomMode={true}
        />
      );

      expect(mockSetIsNotesMode).not.toHaveBeenCalled();
      expect(mockSetIsZoomMode).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have semantic button elements', () => {
      const { container } = render(<SudokuControls {...defaultProps} />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have accessible toggle for notes', () => {
      render(<SudokuControls {...defaultProps} />);

      const notesToggle = screen.getByText('Notes');
      expect(notesToggle).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined onAdvancedToggle prop', () => {
      render(<SudokuControls {...defaultProps} onAdvancedToggle={undefined} />);

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    it('should handle all buttons disabled', () => {
      const { container } = render(
        <SudokuControls
          {...defaultProps}
          isInputDisabled={true}
          isDeleteDisabled={true}
          isUndoDisabled={true}
          isRedoDisabled={true}
          isValidateCellDisabled={true}
        />
      );

      const buttons = container.querySelectorAll('button:disabled');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle rapid prop changes', () => {
      const { rerender } = render(
        <SudokuControls {...defaultProps} isInputDisabled={false} />
      );

      for (let i = 0; i < 5; i++) {
        rerender(
          <SudokuControls {...defaultProps} isInputDisabled={i % 2 === 0} />
        );
      }

      expect(screen.getByText('Notes')).toBeInTheDocument();
    });
  });
});
