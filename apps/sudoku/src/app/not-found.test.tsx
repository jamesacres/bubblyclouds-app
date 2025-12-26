import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound', () => {
  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<NotFound />);
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('should display page not found message', () => {
      render(<NotFound />);
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('should render text in a centered container', () => {
      const { container } = render(<NotFound />);
      const div = container.querySelector('.text-center');
      expect(div).toBeInTheDocument();
    });

    it('should have centered text styling', () => {
      const { container } = render(<NotFound />);
      const textElement = container.querySelector('.text-center');
      expect(textElement).toHaveClass('text-center');
    });

    it('should render as a div element', () => {
      const { container } = render(<NotFound />);
      const div = container.querySelector('div');
      expect(div?.tagName).toBe('DIV');
    });
  });

  describe('content', () => {
    it('should contain exact text "Page Not Found"', () => {
      render(<NotFound />);
      const element = screen.getByText('Page Not Found');
      expect(element.textContent).toBe('Page Not Found');
    });

    it('should have only one text node with the message', () => {
      const { container } = render(<NotFound />);
      const div = container.querySelector('.text-center');
      expect(div?.childNodes.length).toBe(1);
    });

    it('should not contain additional elements', () => {
      const { container } = render(<NotFound />);
      const div = container.querySelector('.text-center');
      expect(div?.children.length).toBe(0);
    });
  });

  describe('styling', () => {
    it('should apply text-center class for alignment', () => {
      const { container } = render(<NotFound />);
      const element = container.querySelector('.text-center');
      expect(element).toBeInTheDocument();
    });

    it('should be a simple unstyled component beyond text-center', () => {
      const { container } = render(<NotFound />);
      const div = container.querySelector('div');
      expect(div?.className).toBe('text-center');
    });
  });

  describe('accessibility', () => {
    it('should have readable text content', () => {
      render(<NotFound />);
      const element = screen.getByText('Page Not Found');
      expect(element).toBeVisible();
    });

    it('should not contain any interactive elements', () => {
      const { container } = render(<NotFound />);
      const buttons = container.querySelectorAll('button');
      const links = container.querySelectorAll('a');
      expect(buttons.length).toBe(0);
      expect(links.length).toBe(0);
    });

    it('should be properly displayed in the DOM', () => {
      const { container } = render(<NotFound />);
      expect(container.firstChild).toBeTruthy();
    });
  });

  describe('semantic structure', () => {
    it('should contain plain text without semantic markup', () => {
      const { container } = render(<NotFound />);
      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBe(0);
    });

    it('should not contain lists or complex structures', () => {
      const { container } = render(<NotFound />);
      const lists = container.querySelectorAll('ul, ol, li');
      expect(lists.length).toBe(0);
    });

    it('should be a minimal component structure', () => {
      const { container } = render(<NotFound />);
      const allElements = container.querySelectorAll('*');
      // Should only have the outer div
      expect(allElements.length).toBe(1);
    });
  });

  describe('snapshot', () => {
    it('should match snapshot', () => {
      const { container } = render(<NotFound />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('edge cases', () => {
    it('should render with strict mode enabled', () => {
      render(
        <React.StrictMode>
          <NotFound />
        </React.StrictMode>
      );
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });

    it('should be re-renderable without issues', () => {
      const { rerender } = render(<NotFound />);
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      rerender(<NotFound />);
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
    });
  });

  describe('dom structure', () => {
    it('should have single root div element', () => {
      const { container } = render(<NotFound />);
      expect(container.children.length).toBe(1);
      expect(container.children[0].tagName).toBe('DIV');
    });

    it('should have text-center class on root element', () => {
      const { container } = render(<NotFound />);
      expect(container.firstChild).toHaveClass('text-center');
    });

    it('should contain text directly in the div', () => {
      const { container } = render(<NotFound />);
      const div = container.firstChild as HTMLElement;
      expect(div.textContent).toBe('Page Not Found');
    });
  });

  describe('text content', () => {
    it('should be case-sensitive for the message', () => {
      render(<NotFound />);
      expect(screen.getByText('Page Not Found')).toBeInTheDocument();
      expect(screen.queryByText('page not found')).not.toBeInTheDocument();
    });

    it('should not have any trailing or leading whitespace in content', () => {
      const { container } = render(<NotFound />);
      const div = container.firstChild as HTMLElement;
      expect(div.textContent?.trim()).toBe('Page Not Found');
    });

    it('should be a single text node', () => {
      const { container } = render(<NotFound />);
      const div = container.firstChild as HTMLElement;
      expect(div.childNodes.length).toBe(1);
      expect(div.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    });
  });
});
