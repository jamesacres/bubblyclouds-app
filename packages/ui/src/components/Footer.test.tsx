import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  describe('rendering', () => {
    it('should render footer with children', () => {
      render(
        <Footer>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </Footer>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('should render as a nav element', () => {
      const { container } = render(
        <Footer>
          <div>Content</div>
        </Footer>
      );
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should render empty footer with no children', () => {
      const { container } = render(<Footer>{null}</Footer>);
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should render single child', () => {
      render(
        <Footer>
          <button>Single</button>
        </Footer>
      );
      expect(
        screen.getByRole('button', { name: 'Single' })
      ).toBeInTheDocument();
    });

    it('should render multiple children in grid', () => {
      render(
        <Footer>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Footer>
      );
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have fixed positioning classes', () => {
      const { container } = render(
        <Footer>
          <div>Content</div>
        </Footer>
      );
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('fixed');
      expect(nav).toHaveClass('bottom-0');
      expect(nav).toHaveClass('left-0');
      expect(nav).toHaveClass('z-50');
    });

    it('should have responsive background styling', () => {
      const { container } = render(
        <Footer>
          <div>Content</div>
        </Footer>
      );
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('bg-stone-50/90');
      expect(nav).toHaveClass('dark:bg-zinc-900/90');
      expect(nav).toHaveClass('backdrop-blur-md');
    });

    it('should have border styling', () => {
      const { container } = render(
        <Footer>
          <div>Content</div>
        </Footer>
      );
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('border-t');
      expect(nav).toHaveClass('border-stone-200');
      expect(nav).toHaveClass('dark:border-gray-700');
    });

    it('should have text styling', () => {
      const { container } = render(
        <Footer>
          <div>Content</div>
        </Footer>
      );
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('text-sm');
      expect(nav).toHaveClass('text-black');
      expect(nav).toHaveClass('dark:text-white');
    });
  });

  describe('layout', () => {
    it('should have full width layout', () => {
      const { container } = render(
        <Footer>
          <div>Content</div>
        </Footer>
      );
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('w-screen');
    });

    it('should have height of 20 units (h-20)', () => {
      const { container } = render(
        <Footer>
          <div>Content</div>
        </Footer>
      );
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('h-20');
    });

    it('should center items with proper padding', () => {
      const { container } = render(
        <Footer>
          <div>Content</div>
        </Footer>
      );
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('px-6');
      expect(nav).toHaveClass('items-center');
      expect(nav).toHaveClass('justify-between');
    });
  });

  describe('accessibility', () => {
    it('should be a navigation landmark', () => {
      const { container } = render(
        <Footer>
          <button>Home</button>
          <button>Settings</button>
        </Footer>
      );
      const nav = container.querySelector('nav');
      expect(nav?.tagName).toBe('NAV');
    });

    it('should maintain semantic structure with child content', () => {
      render(
        <Footer>
          <button>Button 1</button>
          <button>Button 2</button>
        </Footer>
      );
      expect(
        screen.getByRole('button', { name: 'Button 1' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Button 2' })
      ).toBeInTheDocument();
    });
  });

  describe('conditional styling with Capacitor', () => {
    it('should add pb-safe and pt-2 classes when isCapacitor is true', () => {
      const mockIsCapacitor = jest.fn(() => true);

      const { container } = render(
        <Footer isCapacitor={mockIsCapacitor}>
          <div>Content</div>
        </Footer>
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('pb-safe');
      expect(nav).toHaveClass('pt-2');
      expect(mockIsCapacitor).toHaveBeenCalled();
    });

    it('should not add pb-safe and pt-2 classes when isCapacitor is false', () => {
      const mockIsCapacitor = jest.fn(() => false);

      const { container } = render(
        <Footer isCapacitor={mockIsCapacitor}>
          <div>Content</div>
        </Footer>
      );

      const nav = container.querySelector('nav');
      expect(nav).not.toHaveClass('pb-safe');
      expect(nav).not.toHaveClass('pt-2');
      expect(mockIsCapacitor).toHaveBeenCalled();
    });

    it('should use default isCapacitor that returns false when not provided', () => {
      const { container } = render(
        <Footer>
          <div>Content</div>
        </Footer>
      );

      const nav = container.querySelector('nav');
      expect(nav).not.toHaveClass('pb-safe');
      expect(nav).not.toHaveClass('pt-2');
    });
  });

  describe('children count grid layout', () => {
    it('should render with correct grid column configuration', () => {
      const { container } = render(
        <Footer>
          <div>1</div>
          <div>2</div>
        </Footer>
      );
      const div = container.querySelector('.grid');
      expect(div).toBeInTheDocument();
      expect(div).toHaveClass('grid-cols-2');
    });

    it('should render three column grid for three children', () => {
      const { container } = render(
        <Footer>
          <div>1</div>
          <div>2</div>
          <div>3</div>
        </Footer>
      );
      const div = container.querySelector('.grid');
      expect(div).toHaveClass('grid-cols-3');
    });
  });
});
