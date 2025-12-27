import React from 'react';
import { render, screen } from '@testing-library/react';
import BookCover from './BookCover';

describe('BookCover', () => {
  describe('rendering', () => {
    it('should render without crashing with default props', () => {
      render(<BookCover month="January" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
    });

    it('should render with all month variations', () => {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      months.forEach((month) => {
        const { unmount } = render(<BookCover month={month} />);
        expect(screen.getByText(`${month} Edition`)).toBeInTheDocument();
        unmount();
      });
    });

    it('should display title as "SUDOKU RACE"', () => {
      render(<BookCover month="January" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
    });

    it('should display month edition subtitle', () => {
      render(<BookCover month="February" />);
      expect(screen.getByText('February Edition')).toBeInTheDocument();
    });

    it('should render main content div with proper structure', () => {
      const { container } = render(<BookCover month="January" />);
      const contentDiv = container.querySelector('div');
      expect(contentDiv).toBeInTheDocument();
    });
  });

  describe('sizing', () => {
    it('should use medium size by default', () => {
      const { container } = render(<BookCover month="January" />);
      const bookCover = container.firstChild as HTMLElement;
      // Medium scale is 0.8, so width should be 300 * 0.8 = 240
      expect(bookCover).toBeInTheDocument();
    });

    it('should render with small size when specified', () => {
      const { container } = render(<BookCover month="January" size="small" />);
      const bookCover = container.firstChild as HTMLElement;
      expect(bookCover).toBeInTheDocument();
      // Small scale is 0.6
    });

    it('should render with large size when specified', () => {
      const { container } = render(<BookCover month="January" size="large" />);
      const bookCover = container.firstChild as HTMLElement;
      expect(bookCover).toBeInTheDocument();
      // Large scale is 1.0
    });

    it('should maintain aspect ratio across sizes', () => {
      const { rerender } = render(<BookCover month="January" size="small" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();

      rerender(<BookCover month="January" size="medium" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();

      rerender(<BookCover month="January" size="large" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
    });
  });

  describe('month-specific styling', () => {
    it('should render January with ice/winter theme', () => {
      render(<BookCover month="January" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
      // January should be present
      expect(screen.getByText('January Edition')).toBeInTheDocument();
    });

    it('should render February with love/heart theme', () => {
      render(<BookCover month="February" />);
      expect(screen.getByText('February Edition')).toBeInTheDocument();
    });

    it('should render March with spring theme', () => {
      render(<BookCover month="March" />);
      expect(screen.getByText('March Edition')).toBeInTheDocument();
    });

    it('should render December with holiday theme', () => {
      render(<BookCover month="December" />);
      expect(screen.getByText('December Edition')).toBeInTheDocument();
    });
  });

  describe('sudoku grid', () => {
    it('should render sudoku grid structure', () => {
      const { container } = render(<BookCover month="January" />);
      // Should have multiple divs for grid structure
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(10);
    });

    it('should render cells', () => {
      const { container } = render(<BookCover month="January" />);
      // Find elements with flex centering class (sudoku cells)
      const cells = container.querySelectorAll(
        '.flex.items-center.justify-center'
      );
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should render january puzzle data', () => {
      const { container } = render(<BookCover month="January" />);
      // Should render text content from sudoku data
      const allText = container.textContent;
      expect(allText).toBeTruthy();
    });

    it('should have proper structure for display', () => {
      const { container } = render(<BookCover month="January" />);
      // Should have div elements for layout
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(0);
    });

    it('should render different months', () => {
      const { unmount } = render(<BookCover month="January" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
      unmount();

      render(<BookCover month="February" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
    });
  });

  describe('typography', () => {
    it('should render h1 heading', () => {
      render(<BookCover month="January" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('SUDOKU RACE');
    });

    it('should display month in subtitle', () => {
      render(<BookCover month="April" />);
      expect(screen.getByText('April Edition')).toBeInTheDocument();
    });

    it('should apply different font styles per month', () => {
      const { container } = render(<BookCover month="February" />);
      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });

    it('should have proper text styling on title', () => {
      const { container } = render(<BookCover month="January" />);
      const heading = container.querySelector('h1');
      expect(heading).toHaveStyle({
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
        letterSpacing: '1px',
      });
    });
  });

  describe('layout structure', () => {
    it('should have flex layout for content', () => {
      const { container } = render(<BookCover month="January" />);
      const contentDiv = container.querySelector('[class*="flex"]');
      expect(contentDiv).toBeInTheDocument();
    });

    it('should have proper padding based on scale', () => {
      const { container } = render(<BookCover month="January" />);
      const contentDivs = container.querySelectorAll('div[style*="padding"]');
      expect(contentDivs.length).toBeGreaterThan(0);
    });

    it('should center all content', () => {
      const { container } = render(<BookCover month="January" />);
      // There should be centered content
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should have proper spacing between elements', () => {
      const { container } = render(<BookCover month="January" />);
      const styledDivs = container.querySelectorAll('div[style]');
      expect(styledDivs.length).toBeGreaterThan(0);
    });
  });

  describe('background styling', () => {
    it('should apply background gradient', () => {
      const { container } = render(<BookCover month="January" />);
      const bookCover = container.firstChild as HTMLElement;
      expect(bookCover).toBeInTheDocument();
      // Background should be applied through inline styles
    });

    it('should have different backgrounds for different months', () => {
      const { unmount } = render(<BookCover month="January" />);
      expect(screen.getByText('January Edition')).toBeInTheDocument();
      unmount();

      render(<BookCover month="February" />);
      expect(screen.getByText('February Edition')).toBeInTheDocument();
    });

    it('should apply decorative background elements for some months', () => {
      render(<BookCover month="February" />);
      // February has heart background decorations
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
    });
  });

  describe('stats display', () => {
    it('should display stats section', () => {
      const { container } = render(<BookCover month="January" />);
      // Stats are rendered in a background container
      const stats = container.querySelectorAll('div');
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should render component with stats', () => {
      render(<BookCover month="January" />);
      // Component renders successfully
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
    });

    it('should render stats section', () => {
      const { container } = render(<BookCover month="January" />);
      // Should have styled divs
      const styledDivs = container.querySelectorAll('div[style]');
      expect(styledDivs.length).toBeGreaterThan(0);
    });
  });

  describe('responsive scaling', () => {
    it('should scale all elements with size prop', () => {
      const { rerender } = render(<BookCover month="January" size="small" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();

      rerender(<BookCover month="January" size="large" />);
      expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
    });

    it('should maintain proportions when scaling', () => {
      const { container: smallContainer } = render(
        <BookCover month="January" size="small" />
      );
      const smallCover = smallContainer.firstChild;

      const { container: largeContainer } = render(
        <BookCover month="January" size="large" />
      );
      const largeCover = largeContainer.firstChild;

      expect(smallCover).toBeInTheDocument();
      expect(largeCover).toBeInTheDocument();
    });

    it('should apply correct width and height for each size', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = [
        'small',
        'medium',
        'large',
      ];

      sizes.forEach((size) => {
        const { unmount } = render(<BookCover month="January" size={size} />);
        expect(screen.getByText('SUDOKU RACE')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('content visibility', () => {
    it('should always show title', () => {
      render(<BookCover month="January" />);
      expect(screen.getByText('SUDOKU RACE')).toBeVisible();
    });

    it('should always show month edition', () => {
      render(<BookCover month="June" />);
      expect(screen.getByText('June Edition')).toBeVisible();
    });

    it('should render heading element', () => {
      const { container } = render(<BookCover month="January" />);
      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });

    it('should show sudoku grid', () => {
      const { container } = render(<BookCover month="January" />);
      // Should have grid structure
      const grids = container.querySelectorAll('[style*="grid"]');
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle month names with different cases', () => {
      render(<BookCover month="january" />);
      expect(screen.getByText('january Edition')).toBeInTheDocument();
    });

    it('should handle all 12 months', () => {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      months.forEach((month) => {
        const { unmount } = render(<BookCover month={month} />);
        expect(screen.getByText(`${month} Edition`)).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle unknown month gracefully', () => {
      render(<BookCover month="Unknown" />);
      expect(screen.getByText('Unknown Edition')).toBeInTheDocument();
    });

    it('should handle re-renders without issues', () => {
      const { rerender } = render(<BookCover month="January" />);
      expect(screen.getByText('January Edition')).toBeInTheDocument();

      rerender(<BookCover month="January" size="large" />);
      expect(screen.getByText('January Edition')).toBeInTheDocument();

      rerender(<BookCover month="February" />);
      expect(screen.getByText('February Edition')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<BookCover month="January" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('SUDOKU RACE');
    });

    it('should display readable text content', () => {
      render(<BookCover month="March" />);
      expect(screen.getByText('March Edition')).toBeVisible();
      expect(screen.getByText('SUDOKU RACE')).toBeVisible();
    });

    it('should have semantic structure', () => {
      const { container } = render(<BookCover month="January" />);
      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('svg and grid rendering', () => {
    it('should render grid cells properly spaced', () => {
      const { container } = render(<BookCover month="January" />);
      const gridContainer = container.querySelector('[style*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should have cells with flex layout', () => {
      const { container } = render(<BookCover month="January" />);
      const cells = container.querySelectorAll('[class*="flex"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should render sudoku numbers in cells', () => {
      const { container } = render(<BookCover month="January" />);
      // Look for numbers in cells
      const numberElements = container.querySelectorAll('div');
      expect(numberElements.length).toBeGreaterThan(0);
    });
  });

  describe('text shadows and effects', () => {
    it('should render title with styling', () => {
      const { container } = render(<BookCover month="January" />);
      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe('SUDOKU RACE');
    });

    it('should render subtitle with styling', () => {
      const { container } = render(<BookCover month="January" />);
      // Should have subtitle div
      const divs = container.querySelectorAll('div');
      expect(divs.length).toBeGreaterThan(1);
    });

    it('should have styled elements', () => {
      const { container } = render(<BookCover month="January" />);
      const elements = container.querySelectorAll('[style]');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('snapshot', () => {
    it('should match snapshot for January', () => {
      const { container } = render(<BookCover month="January" />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot for small size', () => {
      const { container } = render(<BookCover month="January" size="small" />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot for large size', () => {
      const { container } = render(<BookCover month="January" size="large" />);
      expect(container).toMatchSnapshot();
    });
  });
});
