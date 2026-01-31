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
  };

  it('renders author and copyright year 2025', () => {
    render(<BlogFooter {...mockProps} />);
    expect(screen.getByText(/Test Author/)).toBeInTheDocument();
    expect(screen.getByText(/© 2025/)).toBeInTheDocument();
  });

  it('renders social media links correctly', () => {
    render(<BlogFooter {...mockProps} />);

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      mockProps.github
    );
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      mockProps.linkedin
    );
  });

  it('renders Tailwind Nextjs Theme attribution link', () => {
    render(<BlogFooter {...mockProps} />);
    expect(
      screen.getByRole('link', { name: 'Tailwind Nextjs Theme' })
    ).toHaveAttribute(
      'href',
      'https://github.com/timlrx/tailwind-nextjs-starter-blog'
    );
  });

  it('does not render missing social links', () => {
    const propsWithoutGithub = { ...mockProps, github: undefined };
    render(<BlogFooter {...propsWithoutGithub} />);
    expect(
      screen.queryByRole('link', { name: 'GitHub' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument();
  });
});
