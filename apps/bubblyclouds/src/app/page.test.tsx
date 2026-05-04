import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page', () => {
  describe('Page rendering', () => {
    it('should render the container with correct styling', () => {
      const { container } = render(<Home />);
      const mainContainer = container.querySelector('.w-full');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('w-full', 'max-w-xl');
    });
  });

  describe('Links and navigation', () => {
    it('should render James Acres link with correct href', () => {
      render(<Home />);
      const jamesLink = screen.getByRole('link', { name: /James Acres/i });
      expect(jamesLink).toBeInTheDocument();
      expect(jamesLink).toHaveAttribute('href', 'https://jamesacres.co.uk');
      expect(jamesLink).toHaveClass('underline');
    });

    it('should render support email link with correct href', () => {
      render(<Home />);
      const supportLink = screen.getByRole('link', {
        name: /Email/i,
      });
      expect(supportLink).toHaveAttribute(
        'href',
        'mailto:support@bubblyclouds.com'
      );
    });

    it('should render Sudoku app link with correct href', () => {
      render(<Home />);
      const sudokuLink = screen.getByRole('link', { name: /Sudoku/i });
      expect(sudokuLink).toHaveAttribute(
        'href',
        'https://sudoku.bubblyclouds.com'
      );
      expect(sudokuLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should have noopener noreferrer on external links', () => {
      render(<Home />);
      const externalLinks = [screen.getByRole('link', { name: /Sudoku/i })];
      externalLinks.forEach((link) => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Services section', () => {
    it('should render Contact me heading', () => {
      render(<Home />);
      expect(
        screen.getByRole('heading', { name: /Contact me/i })
      ).toBeInTheDocument();
    });

    it('should render service card with correct styling', () => {
      const { container } = render(<Home />);
      const serviceCard = container.querySelector(
        'a[href="mailto:support@bubblyclouds.com"]'
      );
      expect(serviceCard).toHaveClass(
        'group',
        'rounded-xl',
        'border',
        'px-5',
        'py-5',
        'transition-all'
      );
    });

    it('should render email title', () => {
      render(<Home />);
      const serviceTitle = screen.getByText(/Email/i);
      expect(serviceTitle).toBeInTheDocument();
    });

    it('should render contact email in service description', () => {
      render(<Home />);
      expect(screen.getByText(/support@bubblyclouds.com/i)).toBeInTheDocument();
    });
  });

  describe('Personal Projects section', () => {
    it('should render Personal Projects heading', () => {
      render(<Home />);
      expect(
        screen.getByRole('heading', { name: /Personal Projects/i })
      ).toBeInTheDocument();
    });

    it('should render Sudoku app card', () => {
      render(<Home />);
      const sudokuCard = screen.getByRole('link', { name: /Sudoku/i });
      expect(sudokuCard).toHaveClass(
        'group',
        'rounded-xl',
        'border',
        'transition-all'
      );
    });

    it('should render Sudoku description', () => {
      render(<Home />);
      expect(
        screen.getByText(/Share a Sudoku with family and friends/i)
      ).toBeInTheDocument();
    });

    it('should render arrow indicator in Sudoku card', () => {
      render(<Home />);
      const { container } = render(<Home />);
      const arrows = container.querySelectorAll('.group-hover\\:translate-x-1');
      expect(arrows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Styling and classes', () => {
    it('should apply motion-reduce transform styles to arrows', () => {
      const { container } = render(<Home />);
      const arrows = container.querySelectorAll('.group-hover\\:translate-x-1');
      arrows.forEach((arrow) => {
        expect(arrow).toHaveClass('motion-reduce:transform-none');
      });
    });

    it('should have correct heading text styles', () => {
      render(<Home />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      headings.forEach((heading) => {
        if (
          heading.textContent === 'Services' ||
          heading.textContent === 'Personal Projects'
        ) {
          expect(heading).toHaveClass('text-xs', 'font-semibold', 'uppercase');
        }
      });
    });
  });

  describe('Component structure', () => {
    it('should be a function component', () => {
      expect(typeof Home).toBe('function');
    });

    it('should render without crashing', () => {
      expect(() => render(<Home />)).not.toThrow();
    });

    it('should have correct number of paragraphs', () => {
      const { container } = render(<Home />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    it('should have all required links', () => {
      render(<Home />);
      const links = screen.getAllByRole('link');
      expect(links.length).toBe(3);
    });
  });

  describe('Accessibility', () => {
    it('should have descriptive link text', () => {
      render(<Home />);
      const sudokuLink = screen.getByRole('link', { name: /Sudoku/i });
      expect(sudokuLink).toHaveAccessibleName();
    });

    it('should have properly structured headings', () => {
      render(<Home />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Content validation', () => {
    it('should contain all expected sections', () => {
      const { container } = render(<Home />);
      expect(container.textContent).toContain('James Acres');
      expect(container.textContent).toContain('Bubbly Clouds');
      expect(container.textContent).toContain('Personal Projects');
      expect(container.textContent).toContain('Sudoku');
    });

    it('should have valid email addresses', () => {
      render(<Home />);
      const emailLink = screen.getByRole('link', {
        name: /Email/i,
      });
      expect(emailLink.getAttribute('href')).toMatch(/^mailto:/);
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(<Home />);
      expect(container).toMatchSnapshot();
    });
  });
});
