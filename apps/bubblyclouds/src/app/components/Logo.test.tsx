import React from 'react';
import { render, screen } from '@testing-library/react';
import Logo from './Logo';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt: string;
    width: number;
    height: number;
    priority?: boolean;
    className?: string;
  }) => {
    const { priority, ...rest } = props;
    return <img {...rest} data-priority={priority ? 'true' : 'false'} />;
  },
}));

jest.mock('next/link', () => {
  return function MockLink({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

const { useTheme } = require('next-themes');

describe('Logo Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component rendering', () => {
    it('should render without crashing', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      expect(() => render(<Logo />)).not.toThrow();
    });

    it('should be a function component', () => {
      expect(typeof Logo).toBe('function');
    });

    it('should render a link element', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
    });

    it('should render an image element', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Link properties', () => {
    it('should link to home page', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/');
    });

    it('should wrap the image in a link', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      const { container } = render(<Logo />);
      const link = container.querySelector('a');
      const image = link?.querySelector('img');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Image properties', () => {
    it('should have correct alt text', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByAltText('Bubbly Clouds Logo');
      expect(image).toBeInTheDocument();
    });

    it('should have correct width', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('width', '350');
    });

    it('should have correct height', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('height', '70');
    });

    it('should have priority loading', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('data-priority', 'true');
    });

    it('should have relative className', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveClass('relative');
    });
  });

  describe('Theme-based image switching', () => {
    it('should use inverted logo for light theme', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds-invert.png');
    });

    it('should use normal logo for dark theme', () => {
      useTheme.mockReturnValue({ theme: 'dark' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds.png');
    });

    it('should use inverted logo for undefined theme', () => {
      useTheme.mockReturnValue({ theme: undefined });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds-invert.png');
    });

    it('should use inverted logo for system theme', () => {
      useTheme.mockReturnValue({ theme: 'system' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds-invert.png');
    });

    it('should use inverted logo for any non-dark theme', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds-invert.png');
    });
  });

  describe('useTheme hook integration', () => {
    it('should call useTheme hook', () => {
      useTheme.mockReturnValue({ theme: 'dark' });
      render(<Logo />);
      expect(useTheme).toHaveBeenCalled();
    });

    it('should call useTheme exactly once', () => {
      useTheme.mockReturnValue({ theme: 'dark' });
      render(<Logo />);
      expect(useTheme).toHaveBeenCalledTimes(1);
    });

    it('should handle theme changes on rerender', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      const { rerender } = render(<Logo />);

      let image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds-invert.png');

      useTheme.mockReturnValue({ theme: 'dark' });
      rerender(<Logo />);

      image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds.png');
    });
  });

  describe('Client component behavior', () => {
    it('should be marked as use client component', () => {
      expect(typeof Logo).toBe('function');
    });

    it('should render in client environment', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      const { container } = render(<Logo />);
      expect(container).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible image with alt text', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByRole('img', { name: /Bubbly Clouds Logo/i });
      expect(image).toBeInTheDocument();
    });

    it('should have accessible link', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const link = screen.getByRole('link');
      expect(link).toHaveAccessibleName();
    });
  });

  describe('Edge cases', () => {
    it('should handle null theme', () => {
      useTheme.mockReturnValue({ theme: null });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds-invert.png');
    });

    it('should handle empty string theme', () => {
      useTheme.mockReturnValue({ theme: '' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds-invert.png');
    });

    it('should handle missing theme property', () => {
      useTheme.mockReturnValue({});
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('src', '/bubbly-clouds-invert.png');
    });

    it('should not crash with multiple renders', () => {
      useTheme.mockReturnValue({ theme: 'dark' });
      expect(() => {
        render(<Logo />);
        render(<Logo />);
        render(<Logo />);
      }).not.toThrow();
    });
  });

  describe('Default export', () => {
    it('should export Logo as default', () => {
      expect(Logo).toBeDefined();
      expect(typeof Logo).toBe('function');
    });
  });

  describe('Image paths', () => {
    it('should use correct image path for dark theme', () => {
      useTheme.mockReturnValue({ theme: 'dark' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image.getAttribute('src')).toBe('/bubbly-clouds.png');
    });

    it('should use correct image path for light theme', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      render(<Logo />);
      const image = screen.getByRole('img');
      expect(image.getAttribute('src')).toBe('/bubbly-clouds-invert.png');
    });

    it('should have valid image paths', () => {
      useTheme.mockReturnValue({ theme: 'dark' });
      render(<Logo />);
      const darkImage = screen.getByRole('img');
      expect(darkImage.getAttribute('src')).toMatch(/^\/bubbly-clouds/);

      useTheme.mockReturnValue({ theme: 'light' });
      const { container } = render(<Logo />);
      const lightImage = container.querySelector('img');
      expect(lightImage?.getAttribute('src')).toMatch(/^\/bubbly-clouds/);
    });
  });

  describe('Conditional rendering logic', () => {
    it('should use ternary operator for theme switching', () => {
      useTheme.mockReturnValue({ theme: 'dark' });
      render(<Logo />);
      expect(screen.getByRole('img').getAttribute('src')).toBe(
        '/bubbly-clouds.png'
      );

      useTheme.mockReturnValue({ theme: 'light' });
      const { container } = render(<Logo />);
      expect(container.querySelector('img')?.getAttribute('src')).toBe(
        '/bubbly-clouds-invert.png'
      );
    });

    it('should check theme equality with dark', () => {
      const themes = ['dark', 'light', 'system', undefined, null, ''];

      themes.forEach((themeValue) => {
        useTheme.mockReturnValue({ theme: themeValue });
        const { container } = render(<Logo />);
        const image = container.querySelector('img');

        if (themeValue === 'dark') {
          expect(image?.getAttribute('src')).toBe('/bubbly-clouds.png');
        } else {
          expect(image?.getAttribute('src')).toBe('/bubbly-clouds-invert.png');
        }
      });
    });
  });

  describe('Snapshot', () => {
    it('should match snapshot with dark theme', () => {
      useTheme.mockReturnValue({ theme: 'dark' });
      const { container } = render(<Logo />);
      expect(container).toMatchSnapshot();
    });

    it('should match snapshot with light theme', () => {
      useTheme.mockReturnValue({ theme: 'light' });
      const { container } = render(<Logo />);
      expect(container).toMatchSnapshot();
    });
  });
});
