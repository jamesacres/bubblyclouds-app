import React from 'react';
import { render, screen } from '@testing-library/react';
import BlogFooter from './BlogFooter';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('BlogFooter', () => {
  const mockProps = {
    author: 'Test Author',
    github: 'https://github.com/test',
    linkedin: 'https://www.linkedin.com/in/test',
    email: 'test@example.com',
    siteUrl: 'https://example.com',
  };

  it('renders author and current year', () => {
    render(<BlogFooter {...mockProps} />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(mockProps.author)).toBeInTheDocument();
    expect(screen.getByText(`© ${currentYear}`)).toBeInTheDocument();
  });

  it('renders social media links correctly', () => {
    render(<BlogFooter {...mockProps} />);

    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      `mailto:${mockProps.email}`
    );
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      mockProps.github
    );
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      mockProps.linkedin
    );
  });

  it('renders site URL correctly', () => {
    render(<BlogFooter {...mockProps} />);
    expect(screen.getByRole('link', { name: 'example.com' })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('does not render missing social links', () => {
    const propsWithoutGithub = { ...mockProps, github: undefined };
    render(<BlogFooter {...propsWithoutGithub} />);
    expect(
      screen.queryByRole('link', { name: 'GitHub' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email' })).toBeInTheDocument();
  });
});
