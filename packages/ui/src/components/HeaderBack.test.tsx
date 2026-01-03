import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HeaderBack from './HeaderBack';

// Mock Next.js router
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock react-feather
jest.mock('react-feather', () => ({
  ChevronLeft: ({ className }: any) => (
    <div data-testid="chevron-left" className={className} />
  ),
}));

describe('HeaderBack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/');
  });

  describe('on home page', () => {
    it('should render app name button on home page', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByText(/Sudoku Race/)).toBeInTheDocument();
    });

    it('should have gradient text styling on app name button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByText(/Sudoku Race/);
      expect(button).toHaveClass('bg-gradient-to-r');
      expect(button).toHaveClass('from-blue-500');
      expect(button).toHaveClass('via-purple-500');
      expect(button).toHaveClass('to-pink-500');
      expect(button).toHaveClass('bg-clip-text');
      expect(button).toHaveClass('text-transparent');
    });

    it('should call router.replace with START_PUZZLE when button clicked', async () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByText(/Sudoku Race/);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/?tab=START_PUZZLE');
      });
    });

    it('should have cursor-pointer class on app name button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByText(/Sudoku Race/);
      expect(button).toHaveClass('cursor-pointer');
    });

    it('should have active opacity effect on app name button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByText(/Sudoku Race/);
      expect(button).toHaveClass('active:opacity-70');
    });

    it('should have font styling on app name button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByText(/Sudoku Race/);
      expect(button).toHaveClass('font-semibold');
      expect(button).toHaveClass('text-sm');
    });

    it('should have transition effect on app name button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByText(/Sudoku Race/);
      expect(button).toHaveClass('transition-opacity');
    });

    it('should have flex items center styling', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      render(<HeaderBack appName="Sudoku Race" />);

      const flexContainer = screen.getByText(/Sudoku Race/).closest('div');
      expect(flexContainer).toHaveClass('flex');
      expect(flexContainer).toHaveClass('items-center');
    });
  });

  describe('on other pages', () => {
    it('should render back button on puzzle page', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('should not render app name button on other pages', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.queryByText(/Sudoku Race/)).not.toBeInTheDocument();
    });

    it('should render chevron left icon on non-home pages', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
    });

    it('should have correct styling on back button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      // Check that back button text is visible
      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('should call router.replace with home when back button clicked', async () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByText(/Back/);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });

    it('should be a button element', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have button type set to button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have active opacity effect on back button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('active:opacity-70');
    });

    it('should have transition effect on back button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-opacity');
    });

    it('should render width 16 class for back button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-16');
    });

    it('should have correct text styling for back text', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const backText = screen.getByText(/Back/);
      expect(backText).toHaveClass('text-base');
      expect(backText).toHaveClass('font-normal');
    });
  });

  describe('different page pathnames', () => {
    it('should render back button on /book page', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/book');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('should render back button on /auth page', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/auth');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('should render back button on /import page', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/import');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('should render back button on /invite page', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/invite');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('should go to home for any non-root pathname', async () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/some/nested/path');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('chevron icon styling', () => {
    it('should have correct size classes on chevron', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const chevron = screen.getByTestId('chevron-left');
      expect(chevron).toHaveClass('h-5');
      expect(chevron).toHaveClass('w-5');
    });
  });

  describe('routing behavior', () => {
    it('should use router.replace not router.push', async () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
      });
    });

    it('should not use router.push', async () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');
      const mockPush = jest.fn();
      const { useRouter } = require('next/navigation');
      useRouter.mockReturnValue({
        replace: mockReplace,
        push: mockPush,
      });

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('accessibility', () => {
    it('should have button role', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have descriptive text for back button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });

    it('should be keyboard accessible', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('edge cases', () => {
    it('should handle root path exactly', async () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByText(/Sudoku Race/)).toBeInTheDocument();
      expect(screen.queryByText(/Back/)).not.toBeInTheDocument();
    });

    it('should render correctly when pathname is undefined', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue(undefined);

      // Should render back button since it's not '/'
      render(<HeaderBack appName="Sudoku Race" />);

      expect(screen.getByText(/Back/)).toBeInTheDocument();
    });
  });

  describe('component structure', () => {
    it('should render as flex container on home page', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/');

      const { container } = render(<HeaderBack appName="Sudoku Race" />);

      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should render text properly on back button', () => {
      const { usePathname } = require('next/navigation');
      usePathname.mockReturnValue('/puzzle');

      render(<HeaderBack appName="Sudoku Race" />);

      const backSpan = screen.getByText(/Back/);
      expect(backSpan).toBeInTheDocument();
    });
  });
});
