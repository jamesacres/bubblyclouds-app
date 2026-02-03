import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BlogHeader from './BlogHeader';
import { NavLink } from '../types/siteTypes';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock ThemeSwitch component
jest.mock('@bubblyclouds-app/ui/components/ThemeSwitch', () => {
  return () => <div data-testid="theme-switch">ThemeSwitch</div>;
});

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  X: () => <div data-testid="close-icon">X</div>,
}));

describe('BlogHeader', () => {
  const mockNavLinks: NavLink[] = [
    { href: '/blog', title: 'Blog' },
    { href: '/about', title: 'About' },
  ];
  const mockSiteTitle = 'My Awesome Blog';
  const mockSiteMetadata = {
    title: 'My Awesome Blog',
    author: 'Test Author',
    headerTitle: mockSiteTitle,
    description: 'A test blog description',
    language: 'en-us',
    theme: 'system' as const,
    siteUrl: 'https://example.com',
    locale: 'en-US',
  };

  it('renders site title without logo', () => {
    render(
      <BlogHeader siteMetadata={mockSiteMetadata} navLinks={mockNavLinks} />
    );

    expect(screen.getByText(mockSiteTitle)).toBeInTheDocument();
    expect(screen.queryByAltText('logo')).not.toBeInTheDocument();
  });

  it('renders navigation links on desktop', () => {
    render(
      <BlogHeader siteMetadata={mockSiteMetadata} navLinks={mockNavLinks} />
    );

    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      '/blog'
    );
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );
  });

  it('renders ThemeSwitch component', () => {
    render(
      <BlogHeader siteMetadata={mockSiteMetadata} navLinks={mockNavLinks} />
    );

    expect(screen.getByTestId('theme-switch')).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    render(
      <BlogHeader siteMetadata={mockSiteMetadata} navLinks={mockNavLinks} />
    );

    expect(screen.getByLabelText('Toggle Menu')).toBeInTheDocument();
  });

  it('toggles mobile menu on button click', () => {
    render(
      <BlogHeader siteMetadata={mockSiteMetadata} navLinks={mockNavLinks} />
    );

    const menuButton = screen.getByLabelText('Toggle Menu');

    fireEvent.click(menuButton);
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();

    fireEvent.click(menuButton);
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
  });

  it('displays mobile menu when opened', () => {
    render(
      <BlogHeader siteMetadata={mockSiteMetadata} navLinks={mockNavLinks} />
    );

    const menuButton = screen.getByLabelText('Toggle Menu');
    fireEvent.click(menuButton);

    expect(screen.getByTestId('close-icon')).toBeInTheDocument();

    const mobileNavLinks = screen.getAllByText('Blog');
    expect(mobileNavLinks.length).toBeGreaterThan(1);
  });
});
