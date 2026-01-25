import React from 'react';
import { render, screen } from '@testing-library/react';
import Pagination from './Pagination';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Pagination', () => {
  it('renders correctly for the first page', () => {
    render(<Pagination totalPages={5} currentPage={1} basePath="/blog" />);

    expect(screen.getByText('1 of 5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Next →' })).toHaveAttribute(
      'href',
      '/blog/page/2'
    );
  });

  it('renders correctly for a middle page', () => {
    render(<Pagination totalPages={5} currentPage={3} basePath="/blog" />);

    expect(screen.getByText('3 of 5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Previous' })).toHaveAttribute(
      'href',
      '/blog/page/2'
    );
    expect(screen.getByRole('link', { name: 'Next →' })).toHaveAttribute(
      'href',
      '/blog/page/4'
    );
  });

  it('renders correctly for the last page', () => {
    render(<Pagination totalPages={5} currentPage={5} basePath="/blog" />);

    expect(screen.getByText('5 of 5')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← Previous' })).toHaveAttribute(
      'href',
      '/blog/page/4'
    );
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('renders correctly when there is only one page', () => {
    render(<Pagination totalPages={1} currentPage={1} basePath="/blog" />);

    expect(screen.getByText('1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('correctly handles basePath for the first page to be just basePath', () => {
    render(
      <Pagination totalPages={2} currentPage={1} basePath="/tags/nextjs" />
    );
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Next →' })).toHaveAttribute(
      'href',
      '/tags/nextjs/page/2'
    );
  });

  it('correctly handles basePath for subsequent pages', () => {
    render(
      <Pagination totalPages={3} currentPage={2} basePath="/tags/nextjs" />
    );
    expect(screen.getByRole('link', { name: '← Previous' })).toHaveAttribute(
      'href',
      '/tags/nextjs/page/1'
    );
    expect(screen.getByRole('link', { name: 'Next →' })).toHaveAttribute(
      'href',
      '/tags/nextjs/page/3'
    );
  });
});
