import React from 'react';
import { render, screen } from '@testing-library/react';
import PostList from './PostList';
import { BlogPostMeta } from '../types/blogTypes';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock Next.js Image component, as Card uses it
jest.mock('next/image', () => {
  return ({
    alt,
    src,
    width,
    height,
    className,
  }: {
    alt: string;
    src: string;
    width: number;
    height: number;
    className: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      src={src}
      width={width}
      height={height}
      className={className}
    />
  );
});

describe('PostList', () => {
  const mockPosts: BlogPostMeta[] = [
    {
      slug: 'post-a',
      filePath: 'path/to/post-a.mdx',
      title: 'Post A Title',
      date: '2025-01-03',
      tags: ['nextjs', 'typescript'],
      draft: false,
      summary: 'Summary for Post A.',
      authors: ['default'],
      readingTime: { text: '1 min read', minutes: 1, words: 100 },
      images: ['/static/images/image-a.jpg'],
    },
    {
      slug: 'post-b',
      filePath: 'path/to/post-b.mdx',
      title: 'Post B Title',
      date: '2025-01-01',
      tags: ['react', 'tailwindcss'],
      draft: false,
      summary: 'Summary for Post B.',
      authors: ['default'],
      readingTime: { text: '2 min read', minutes: 2, words: 200 },
      images: ['/static/images/image-b.jpg'],
    },
  ];

  it('renders a list of posts correctly', () => {
    render(<PostList posts={mockPosts} />);

    expect(screen.getByText('Post A Title')).toBeInTheDocument();
    expect(screen.getByText('Summary for Post A.')).toBeInTheDocument();
    expect(screen.getByText('Post B Title')).toBeInTheDocument();
    expect(screen.getByText('Summary for Post B.')).toBeInTheDocument();

    expect(screen.getByText('nextjs')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('tailwindcss')).toBeInTheDocument();

    expect(screen.getByText(/1 min read/)).toBeInTheDocument();
    expect(screen.getByText(/2 min read/)).toBeInTheDocument();
  });

  it('renders "No posts available." when the posts array is empty', () => {
    render(<PostList posts={[]} />);
    expect(screen.getByText('No posts available.')).toBeInTheDocument();
  });

  it('renders correctly without images', () => {
    render(<PostList posts={mockPosts} />);
    expect(screen.getByText('Post A Title')).toBeInTheDocument();
    expect(screen.queryByAltText('Post A Title')).not.toBeInTheDocument();
  });

  it('links to the correct post and tag pages', () => {
    render(<PostList posts={mockPosts} />);

    // Post links
    const postALink = screen.getByRole('link', { name: 'Post A Title' });
    expect(postALink).toHaveAttribute('href', '/post-a');
    const readingTimeLinks = screen.getAllByRole('link', {
      name: /min read/,
    });
    expect(readingTimeLinks[0]).toHaveAttribute('href', '/post-a');
    expect(readingTimeLinks[1]).toHaveAttribute('href', '/post-b');

    // Tag links
    const nextjsTagLink = screen.getByRole('link', { name: 'nextjs' });
    expect(nextjsTagLink).toHaveAttribute('href', '/tags/nextjs');
  });
});
