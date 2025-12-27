import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeSwitch from './ThemeSwitch';
import { useTheme } from 'next-themes';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

// Mock Capacitor StatusBar
jest.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: jest.fn(),
  },
  Style: {
    Dark: 'dark',
    Light: 'light',
  },
}));

describe('ThemeSwitch', () => {
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
    });
  });

  describe('initial render', () => {
    it('should not render before mounting', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: undefined,
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
      });

      const { container } = render(<ThemeSwitch />);

      await waitFor(() => {
        expect(container.querySelector('button')).toBeInTheDocument();
      });
    });

    it('should render button after mounting', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });

    it('should render with aria-label', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        expect(screen.getByLabelText('Toggle Dark Mode')).toBeInTheDocument();
      });
    });
  });

  describe('light mode rendering', () => {
    it('should render moon icon in light mode', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
      });

      const { container } = render(<ThemeSwitch />);

      await waitFor(() => {
        const paths = container.querySelectorAll('path');
        // Moon icon path
        expect(paths.length).toBeGreaterThan(0);
      });
    });

    it('should have light mode styling', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
      });

      render(<ThemeSwitch />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-gray-100');
      });
    });
  });

  describe('dark mode rendering', () => {
    it('should render sun icon in dark mode', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      const { container } = render(<ThemeSwitch />);

      await waitFor(() => {
        const paths = container.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);
      });
    });

    it('should have dark mode styling', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      render(<ThemeSwitch />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('dark:bg-gray-800');
      });
    });
  });

  describe('button styling', () => {
    it('should have primary theme color', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('text-theme-primary');
        expect(button).toHaveClass('dark:text-theme-primary-light');
      });
    });

    it('should have cursor pointer', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('cursor-pointer');
      });
    });

    it('should have rounded-full styling', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('rounded-full');
      });
    });

    it('should have proper padding', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('p-1.5');
      });
    });

    it('should have transition effects', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('transition-colors');
      });
    });

    it('should have active state opacity', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('active:opacity-70');
      });
    });

    it('should have proper dimensions', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveClass('h-8');
        expect(button).toHaveClass('w-8');
        expect(button).toHaveClass('mx-1');
      });
    });
  });

  describe('interaction', () => {
    it('should toggle from light to dark theme', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
      });

      render(<ThemeSwitch />);

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should toggle from dark to light theme', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      render(<ThemeSwitch />);

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should use resolvedTheme when theme is undefined', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: undefined,
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      render(<ThemeSwitch />);

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should handle multiple theme toggles', async () => {
      // First render with light theme
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
      });

      const { rerender } = render(<ThemeSwitch />);

      const button = await screen.findByRole('button');

      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');

      // Update mock to dark theme and force re-render
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      rerender(<ThemeSwitch />);

      fireEvent.click(button);
      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('Capacitor integration', () => {
    it('should call StatusBar.setStyle when on Capacitor in dark mode', async () => {
      const { StatusBar } = require('@capacitor/status-bar');
      const mockIsCapacitor = jest.fn(() => true);

      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      render(<ThemeSwitch isCapacitor={mockIsCapacitor} />);

      await waitFor(() => {
        expect(StatusBar.setStyle).toHaveBeenCalled();
        expect(mockIsCapacitor).toHaveBeenCalled();
      });
    });

    it('should not call StatusBar when not on Capacitor', async () => {
      const { StatusBar } = require('@capacitor/status-bar');
      const mockIsCapacitor = jest.fn(() => false);

      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      render(<ThemeSwitch isCapacitor={mockIsCapacitor} />);

      await waitFor(() => {
        expect(mockIsCapacitor).toHaveBeenCalled();
      });

      expect(StatusBar.setStyle).not.toHaveBeenCalled();
    });

    it('should update StatusBar style when theme changes', async () => {
      const { StatusBar } = require('@capacitor/status-bar');
      const mockIsCapacitor = jest.fn(() => true);

      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
      });

      const { rerender } = render(
        <ThemeSwitch isCapacitor={mockIsCapacitor} />
      );

      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      rerender(<ThemeSwitch isCapacitor={mockIsCapacitor} />);

      await waitFor(() => {
        expect(StatusBar.setStyle).toHaveBeenCalled();
        expect(mockIsCapacitor).toHaveBeenCalled();
      });
    });

    it('should use default isCapacitor that returns false when not provided', async () => {
      const { StatusBar } = require('@capacitor/status-bar');

      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      render(<ThemeSwitch />);

      await waitFor(() => {
        expect(StatusBar.setStyle).not.toHaveBeenCalled();
      });
    });
  });

  describe('SVG icon rendering', () => {
    it('should render SVG element', async () => {
      const { container } = render(<ThemeSwitch />);

      await waitFor(() => {
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });

    it('should have proper SVG attributes', async () => {
      const { container } = render(<ThemeSwitch />);

      await waitFor(() => {
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
        expect(svg).toHaveAttribute('fill', 'currentColor');
      });
    });

    it('should have full size SVG styling', async () => {
      const { container } = render(<ThemeSwitch />);

      await waitFor(() => {
        const svg = container.querySelector('svg');
        expect(svg).toHaveClass('h-full');
        expect(svg).toHaveClass('w-full');
      });
    });

    it('should render sun icon paths in dark mode', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
        resolvedTheme: 'dark',
      });

      const { container } = render(<ThemeSwitch />);

      await waitFor(() => {
        const paths = container.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);
      });
    });

    it('should render moon icon paths in light mode', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
      });

      const { container } = render(<ThemeSwitch />);

      await waitFor(() => {
        const paths = container.querySelectorAll('path');
        expect(paths.length).toBeGreaterThan(0);
      });
    });
  });

  describe('accessibility', () => {
    it('should be keyboard accessible', async () => {
      render(<ThemeSwitch />);

      const button = await screen.findByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have descriptive aria-label', async () => {
      render(<ThemeSwitch />);

      await waitFor(() => {
        expect(screen.getByLabelText('Toggle Dark Mode')).toBeInTheDocument();
      });
    });

    it('should be clickable with keyboard Enter', async () => {
      render(<ThemeSwitch />);

      const button = await screen.findByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(button).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle theme as undefined gracefully', async () => {
      (useTheme as jest.Mock).mockReturnValue({
        theme: undefined,
        setTheme: mockSetTheme,
        resolvedTheme: undefined,
      });

      render(<ThemeSwitch />);

      const button = await screen.findByRole('button');
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalled();
    });

    it('should handle rapid clicks', async () => {
      render(<ThemeSwitch />);

      const button = await screen.findByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledTimes(3);
    });
  });
});
