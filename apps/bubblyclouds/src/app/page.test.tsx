import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page', () => {
  describe('Page rendering', () => {
    it('should render the container with correct styling', () => {
      const { container } = render(<Home />);
      const mainContainer = container.querySelector('.container');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('mx-auto', 'my-10', 'max-w-xl');
    });

    it('should render introduction text', () => {
      render(<Home />);
      expect(screen.getByText(/Hi I am/i)).toBeInTheDocument();
      expect(screen.getByText('James Acres')).toBeInTheDocument();
      expect(screen.getByText(/trading as Bubbly Clouds/i)).toBeInTheDocument();
    });

    it('should render description paragraph', () => {
      render(<Home />);
      expect(
        screen.getByText(
          /I use the latest tools and techniques to create awesome apps/i
        )
      ).toBeInTheDocument();
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
        name: /Web and Mobile Application Development and Hosting/i,
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
    it('should render Services heading', () => {
      render(<Home />);
      expect(
        screen.getByRole('heading', { name: /Services/i })
      ).toBeInTheDocument();
    });

    it('should render service card with correct styling', () => {
      const { container } = render(<Home />);
      const serviceCard = container.querySelector(
        'a[href="mailto:support@bubblyclouds.com"]'
      );
      expect(serviceCard).toHaveClass(
        'group',
        'rounded-lg',
        'border',
        'border-transparent',
        'px-5',
        'py-4',
        'transition-colors'
      );
    });

    it('should render service title with arrow', () => {
      render(<Home />);
      const serviceTitle = screen.getByText(
        /Web and Mobile Application Development and Hosting/i
      );
      expect(serviceTitle).toBeInTheDocument();
      const arrow = serviceTitle.querySelector('span');
      expect(arrow).toHaveTextContent('->');
    });

    it('should render contact email in service description', () => {
      render(<Home />);
      expect(
        screen.getByText(/Contact support@bubblyclouds.com/i)
      ).toBeInTheDocument();
    });
  });

  describe('Apps section', () => {
    it('should render Apps heading', () => {
      render(<Home />);
      expect(
        screen.getByRole('heading', { name: /Apps/i })
      ).toBeInTheDocument();
    });

    it('should render Sudoku app card', () => {
      render(<Home />);
      const sudokuCard = screen.getByRole('link', { name: /Sudoku/i });
      expect(sudokuCard).toHaveClass(
        'group',
        'rounded-lg',
        'border',
        'border-transparent'
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
      const sudokuHeading = screen.getByRole('heading', { name: /Sudoku/i });
      const arrow = sudokuHeading.querySelector('span');
      expect(arrow).toBeInTheDocument();
      expect(arrow).toHaveTextContent('->');
    });
  });

  describe('Grid layouts', () => {
    it('should have grid layout for services', () => {
      const { container } = render(<Home />);
      const servicesGrid = container.querySelectorAll('.grid.grid-cols-1')[0];
      expect(servicesGrid).toBeInTheDocument();
      expect(servicesGrid).toHaveClass('my-12', 'w-full', 'max-w-5xl');
    });

    it('should have grid layout for apps', () => {
      const { container } = render(<Home />);
      const grids = container.querySelectorAll('.grid.grid-cols-1');
      expect(grids.length).toBe(2);
    });
  });

  describe('Styling and classes', () => {
    it('should apply hover styles to service card', () => {
      const { container } = render(<Home />);
      const serviceCard = container.querySelector(
        'a[href="mailto:support@bubblyclouds.com"]'
      );
      expect(serviceCard).toHaveClass(
        'hover:border-gray-300',
        'hover:bg-gray-100'
      );
    });

    it('should apply dark mode hover styles', () => {
      const { container } = render(<Home />);
      const cards = container.querySelectorAll('.group');
      cards.forEach((card) => {
        expect(card).toHaveClass(
          'hover:dark:border-neutral-700',
          'hover:dark:bg-neutral-800/30'
        );
      });
    });

    it('should apply motion-reduce transform styles to arrows', () => {
      const { container } = render(<Home />);
      const arrows = container.querySelectorAll('.group-hover\\:translate-x-1');
      arrows.forEach((arrow) => {
        expect(arrow).toHaveClass('motion-reduce:transform-none');
      });
    });

    it('should have correct heading text sizes', () => {
      render(<Home />);
      const headings = screen.getAllByRole('heading', { level: 2 });
      headings.forEach((heading) => {
        if (
          heading.textContent === 'Services' ||
          heading.textContent === 'Apps'
        ) {
          expect(heading).toHaveClass('mt-4', 'text-lg');
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
      expect(paragraphs.length).toBeGreaterThanOrEqual(3);
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
      expect(headings.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Content validation', () => {
    it('should contain all expected sections', () => {
      const { container } = render(<Home />);
      expect(container.textContent).toContain('James Acres');
      expect(container.textContent).toContain('Bubbly Clouds');
      expect(container.textContent).toContain('Services');
      expect(container.textContent).toContain('Apps');
      expect(container.textContent).toContain('Sudoku');
    });

    it('should have valid email addresses', () => {
      render(<Home />);
      const emailLink = screen.getByRole('link', {
        name: /Web and Mobile Application Development and Hosting/i,
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
