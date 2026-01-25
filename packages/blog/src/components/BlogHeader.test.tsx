import React from 'react';
import { render, screen } from '@testing-library/react';
import BlogHeader from './BlogHeader';
import { NavLink } from '../types';

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

describe('BlogHeader', () => {
  const mockNavLinks: NavLink[] = [
    { href: '/blog', title: 'Blog' },
    { href: '/about', title: 'About' },
  ];
  const mockSiteTitle = 'My Awesome Blog';
  const mockSiteLogo = '/static/images/logo.png';
  const mockSiteMetadata = {
    headerTitle: mockSiteTitle,
    siteLogo: mockSiteLogo,
  };

  it('renders site title and logo', () => {
    render(
      <BlogHeader siteMetadata={mockSiteMetadata} navLinks={mockNavLinks} />
    );

    expect(screen.getByText(mockSiteTitle)).toBeInTheDocument();
    expect(screen.getByAltText('logo')).toHaveAttribute('src', mockSiteLogo);
  });

  it('renders navigation links', () => {
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

  it('renders without logo if siteLogo is not provided', () => {
    const metadataNoLogo = { headerTitle: mockSiteTitle };
    render(
      <BlogHeader siteMetadata={metadataNoLogo} navLinks={mockNavLinks} />
    );
    expect(screen.queryByAltText('logo')).not.toBeInTheDocument();
    expect(screen.getByText(mockSiteTitle)).toBeInTheDocument();
  });

  it('renders without site title if headerTitle is not provided', () => {
    const metadataNoTitle = { siteLogo: mockSiteLogo };
    render(
      <BlogHeader siteMetadata={metadataNoTitle} navLinks={mockNavLinks} />
    );
    expect(screen.queryByText(mockSiteTitle)).not.toBeInTheDocument();
    expect(screen.getByAltText('logo')).toBeInTheDocument();
  });
});
