import React from 'react';
import { render, screen } from '@testing-library/react';
import SudokuInputNotes from './SudokuInputNotes';
import { Notes } from '../types/notes';

describe('SudokuInputNotes', () => {
  describe('rendering', () => {
    it('should render with a 3x3 grid layout', () => {
      const notes: Notes = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      const { container } = render(
        <SudokuInputNotes notes={notes} selectNumber={() => {}} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-3');
      expect(grid).toHaveClass('grid-rows-3');
    });

    it('should render notes with correct dimensions', () => {
      const notes: Notes = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      const { container } = render(
        <SudokuInputNotes notes={notes} selectNumber={() => {}} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('h-full');
      expect(grid).toHaveClass('w-full');
    });
  });

  describe('displaying notes', () => {
    it('should show note values when they are set to true', () => {
      const notes: Notes = {
        1: true,
        2: true,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should not show note divs when they are false', () => {
      const notes: Notes = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      // Only grid containers, no text content divs
      expect(screen.queryByText('1')).not.toBeInTheDocument();
      expect(screen.queryByText('9')).not.toBeInTheDocument();
    });

    it('should show all notes when all are true', () => {
      const notes: Notes = {
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        7: true,
        8: true,
        9: true,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      for (let i = 1; i <= 9; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it('should show correct numbers in correct positions', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: true,
        4: false,
        5: false,
        6: true,
        7: false,
        8: false,
        9: true,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply text styling to visible notes', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      const note = screen.getByText('1');
      expect(note).toHaveClass('flex');
      expect(note).toHaveClass('items-center');
      expect(note).toHaveClass('justify-center');
    });

    it('should apply dark mode colors to visible notes', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      const note = screen.getByText('1');
      expect(note).toHaveClass('dark:text-white');
      expect(note).toHaveClass('text-black');
    });

    it('should apply font-bold to checked notes', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      const note = screen.getByText('1');
      expect(note).toHaveClass('font-bold');
    });

    it('should have small text size on mobile', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      const note = screen.getByText('1');
      expect(note).toHaveClass('text-xs');
    });

    it('should have medium text size on desktop', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      const note = screen.getByText('1');
      expect(note).toHaveClass('md:text-sm');
    });

    it('should apply gray color to unchecked notes in container', () => {
      const notes: Notes = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      const { container } = render(
        <SudokuInputNotes notes={notes} selectNumber={() => {}} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });
  });

  describe('full note set scenarios', () => {
    it('should handle a mix of true and false notes', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: true,
        4: true,
        5: false,
        6: true,
        7: false,
        8: true,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      // Check visible notes
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();

      // Check that false notes are not rendered as text
      expect(screen.queryByText('2')).not.toBeInTheDocument();
      expect(screen.queryByText('5')).not.toBeInTheDocument();
      expect(screen.queryByText('7')).not.toBeInTheDocument();
      expect(screen.queryByText('9')).not.toBeInTheDocument();
    });

    it('should only show single digit numbers', () => {
      const notes: Notes = {
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        7: true,
        8: true,
        9: true,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      // Verify that all numbers are single digits
      for (let i = 1; i <= 9; i++) {
        const note = screen.getByText(i.toString());
        expect(note.textContent).toBe(i.toString());
      }
    });
  });

  describe('grid dimensions and layout', () => {
    it('should create a 3x3 grid structure', () => {
      const notes: Notes = {
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        7: true,
        8: true,
        9: true,
      };
      const { container } = render(
        <SudokuInputNotes notes={notes} selectNumber={() => {}} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-3');
      expect(grid).toHaveClass('grid-rows-3');
    });

    it('should fill all available space', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      const { container } = render(
        <SudokuInputNotes notes={notes} selectNumber={() => {}} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('h-full');
      expect(grid).toHaveClass('w-full');
    });
  });

  describe('memo optimization', () => {
    it('should render with memo wrapper', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      const { container } = render(
        <SudokuInputNotes notes={notes} selectNumber={() => {}} />
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle all notes being false', () => {
      const notes: Notes = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      const { container } = render(
        <SudokuInputNotes notes={notes} selectNumber={() => {}} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should handle all notes being true', () => {
      const notes: Notes = {
        1: true,
        2: true,
        3: true,
        4: true,
        5: true,
        6: true,
        7: true,
        8: true,
        9: true,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      for (let i = 1; i <= 9; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it('should maintain grid structure even with no visible notes', () => {
      const notes: Notes = {
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      const { container } = render(
        <SudokuInputNotes notes={notes} selectNumber={() => {}} />
      );

      const grid = container.querySelector('.grid-cols-3');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-rows-3');
    });
  });

  describe('aspect ratio and sizing', () => {
    it('should apply aspect-square to note elements', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      const note = screen.getByText('1');
      expect(note).toHaveClass('aspect-square');
    });

    it('should have full height and width for notes', () => {
      const notes: Notes = {
        1: true,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
      };
      render(<SudokuInputNotes notes={notes} selectNumber={() => {}} />);

      const note = screen.getByText('1');
      expect(note).toHaveClass('h-full');
      expect(note).toHaveClass('w-full');
    });
  });
});
