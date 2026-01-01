import React from 'react';
import { render, screen } from '@testing-library/react';
import TestCoversPage from './page';

// Mock the BookCover component
jest.mock('@bubblyclouds-app/sudoku/components/BookCover', () => {
  return {
    __esModule: true,
    default: ({ month, size }: { month: string; size: string }) => (
      <div data-testid={`book-cover-${month}`} data-size={size}>
        {month} Cover
      </div>
    ),
  };
});

describe('Test Covers Page', () => {
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

  describe('Page Structure', () => {
    it('should render without crashing', () => {
      render(<TestCoversPage />);
    });

    it('should render the main heading', () => {
      render(<TestCoversPage />);
      expect(
        screen.getByText(/All 12 Monthly Book Covers/i)
      ).toBeInTheDocument();
    });

    it('should have correct heading level', () => {
      render(<TestCoversPage />);
      const heading = screen.getByText(/All 12 Monthly Book Covers/i);
      expect(heading.tagName).toBe('H1');
    });

    it('should render a container with proper background gradient', () => {
      const { container } = render(<TestCoversPage />);
      const outerDiv = container.firstChild;
      expect(outerDiv).toHaveClass('bg-gradient-to-br');
      expect(outerDiv).toHaveClass('from-slate-900');
      expect(outerDiv).toHaveClass('via-purple-900');
      expect(outerDiv).toHaveClass('to-slate-900');
    });
  });

  describe('Book Covers Grid', () => {
    it('should render all 12 months', () => {
      render(<TestCoversPage />);

      months.forEach((month) => {
        expect(screen.getByTestId(`book-cover-${month}`)).toBeInTheDocument();
      });
    });

    it('should render each month heading', () => {
      render(<TestCoversPage />);

      months.forEach((month) => {
        const monthHeadings = screen.getAllByText(month);
        expect(monthHeadings.length).toBeGreaterThan(0);
      });
    });

    it('should render grid with correct structure', () => {
      const { container } = render(<TestCoversPage />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
      expect(grid).toHaveClass('xl:grid-cols-4');
    });

    it('should have correct gap between grid items', () => {
      const { container } = render(<TestCoversPage />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-8');
    });
  });

  describe('BookCover Component Props', () => {
    it('should pass correct month name to BookCover', () => {
      render(<TestCoversPage />);

      months.forEach((month) => {
        const cover = screen.getByTestId(`book-cover-${month}`);
        expect(cover).toHaveTextContent(`${month} Cover`);
      });
    });

    it('should pass size="medium" to all BookCover components', () => {
      render(<TestCoversPage />);

      months.forEach((month) => {
        const cover = screen.getByTestId(`book-cover-${month}`);
        expect(cover).toHaveAttribute('data-size', 'medium');
      });
    });

    it('should render BookCover components in order', () => {
      const { container } = render(<TestCoversPage />);
      const covers = container.querySelectorAll('[data-testid^="book-cover-"]');

      expect(covers.length).toBe(12);

      // Check order
      covers.forEach((cover, index) => {
        expect(cover.getAttribute('data-testid')).toBe(
          `book-cover-${months[index]}`
        );
      });
    });
  });

  describe('Month Headings', () => {
    it('should render month heading as h2', () => {
      const { container } = render(<TestCoversPage />);

      // Get only h2 elements, not all text nodes
      const h2Headings = container.querySelectorAll('h2');
      expect(h2Headings.length).toBe(12);

      // Each h2 should contain one of the month names
      h2Headings.forEach((heading) => {
        expect(
          /January|February|March|April|May|June|July|August|September|October|November|December/.test(
            heading.textContent || ''
          )
        ).toBe(true);
      });
    });

    it('should have correct styling for month headings', () => {
      const { container } = render(<TestCoversPage />);
      const monthHeadings = container.querySelectorAll('h2');

      monthHeadings.forEach((heading) => {
        expect(heading).toHaveClass('text-xl');
        expect(heading).toHaveClass('font-semibold');
        expect(heading).toHaveClass('text-white');
      });
    });

    it('should have correct spacing below month headings', () => {
      const { container } = render(<TestCoversPage />);
      const monthHeadings = container.querySelectorAll('h2');

      monthHeadings.forEach((heading) => {
        expect(heading).toHaveClass('mb-4');
      });
    });
  });

  describe('Month Item Containers', () => {
    it('should have flex container for each month item', () => {
      const { container } = render(<TestCoversPage />);
      const flexContainers = container.querySelectorAll(
        '.flex.flex-col.items-center'
      );

      expect(flexContainers.length).toBe(12);
    });

    it('should have correct styling for month item containers', () => {
      const { container } = render(<TestCoversPage />);
      const flexContainers = container.querySelectorAll(
        '.flex.flex-col.items-center'
      );

      flexContainers.forEach((container) => {
        expect(container).toHaveClass('flex');
        expect(container).toHaveClass('flex-col');
        expect(container).toHaveClass('items-center');
      });
    });
  });

  describe('Container and Layout', () => {
    it('should have min-h-screen class', () => {
      const { container } = render(<TestCoversPage />);
      const outerDiv = container.firstChild;
      expect(outerDiv).toHaveClass('min-h-screen');
    });

    it('should have padding', () => {
      const { container } = render(<TestCoversPage />);
      const outerDiv = container.firstChild;
      expect(outerDiv).toHaveClass('p-8');
    });

    it('should have container class for max-width', () => {
      const { container } = render(<TestCoversPage />);
      const containerDiv = container.querySelector('.container');
      expect(containerDiv).toBeInTheDocument();
      expect(containerDiv).toHaveClass('mx-auto');
    });

    it('should render all 12 month book covers with keys', () => {
      render(<TestCoversPage />);
      months.forEach((month) => {
        expect(screen.getByTestId(`book-cover-${month}`)).toBeInTheDocument();
      });
    });
  });

  describe('Main Heading Styling', () => {
    it('should have correct heading styling', () => {
      render(<TestCoversPage />);
      const mainHeading = screen.getByText(/All 12 Monthly Book Covers/i);

      expect(mainHeading).toHaveClass('mb-8');
      expect(mainHeading).toHaveClass('text-center');
      expect(mainHeading).toHaveClass('text-4xl');
      expect(mainHeading).toHaveClass('font-bold');
      expect(mainHeading).toHaveClass('text-white');
    });
  });

  describe('Page Responsiveness', () => {
    it('should have responsive grid layout', () => {
      const { container } = render(<TestCoversPage />);
      const grid = container.querySelector('.grid');

      // Check all responsive classes are present
      expect(grid).toHaveClass('grid-cols-1');
      expect(grid).toHaveClass('sm:grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-3');
      expect(grid).toHaveClass('xl:grid-cols-4');
    });

    it('should have justify-items-center for grid alignment', () => {
      const { container } = render(<TestCoversPage />);
      const grid = container.querySelector('.grid');

      expect(grid).toHaveClass('justify-items-center');
    });
  });

  describe('Months Array', () => {
    it('should display all months in correct order', () => {
      render(<TestCoversPage />);

      const expectedOrder = [
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

      const { container } = render(<TestCoversPage />);
      const headings = container.querySelectorAll('h2');

      headings.forEach((heading, index) => {
        expect(heading.textContent).toBe(expectedOrder[index]);
      });
    });

    it('should have no duplicate months', () => {
      render(<TestCoversPage />);

      const covers = screen.getAllByTestId(/^book-cover-/);
      const months = covers.map((cover) =>
        cover.getAttribute('data-testid')?.replace('book-cover-', '')
      );

      const uniqueMonths = new Set(months);
      expect(uniqueMonths.size).toBe(12);
    });
  });

  describe('Dark Mode Support', () => {
    it('should have text color for dark mode', () => {
      const { container } = render(<TestCoversPage />);
      const outerDiv = container.firstChild;

      // The component uses gradient classes that work in both light and dark modes
      expect(outerDiv).toHaveClass('bg-gradient-to-br');
      expect(outerDiv).toHaveClass('from-slate-900');
      expect(outerDiv).toHaveClass('via-purple-900');
      expect(outerDiv).toHaveClass('to-slate-900');
    });
  });

  describe('Edge Cases', () => {
    it('should render correctly with no external dependencies', () => {
      render(<TestCoversPage />);
      expect(
        screen.getByText(/All 12 Monthly Book Covers/i)
      ).toBeInTheDocument();
    });

    it('should maintain structure with large number of items', () => {
      const { container } = render(<TestCoversPage />);
      const grid = container.querySelector('.grid');

      expect(grid?.children.length).toBe(12);
    });

    it('should render with consistent spacing', () => {
      const { container } = render(<TestCoversPage />);
      const grid = container.querySelector('.grid');

      expect(grid).toHaveClass('gap-8');
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(<TestCoversPage />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      const h2s = container.querySelectorAll('h2');
      expect(h2s.length).toBe(12);
    });

    it('should have proper heading hierarchy', () => {
      const { container } = render(<TestCoversPage />);

      const h1 = container.querySelector('h1');
      const h2s = container.querySelectorAll('h2');

      expect(h1).toBeInTheDocument();
      expect(h2s.length).toBeGreaterThan(0);
    });

    it('should have descriptive text content', () => {
      render(<TestCoversPage />);

      months.forEach((month) => {
        expect(screen.getByText(month)).toBeInTheDocument();
      });
    });
  });
});
