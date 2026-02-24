import React from 'react';
import { render, screen } from '@testing-library/react';
import PostLayout from './PostLayout';
import { BlogPostMeta, ReadingTime } from '../types/blogTypes';
import { Author } from '../types/authorTypes';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock Next.js Image component
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

describe('PostLayout', () => {
  const mockReadingTime: ReadingTime = {
    text: '5 min read',
    minutes: 5,
    words: 1000,
  };

  const mockPost: BlogPostMeta & { content: string } = {
    slug: 'test-post',
    filePath: 'path/to/test-post.mdx',
    title: 'Test Post Title',
    date: '2025-01-26',
    tags: ['Next.js', 'React', 'TypeScript'],
    draft: false,
    summary: 'Summary of the test post.',
    authors: ['default'],
    readingTime: mockReadingTime,
    content: 'This is the content of the test post.',
  };

  const mockAuthor: Author = {
    slug: 'default',
    name: 'Test Author',
    avatar: '/static/images/avatar.png',
    twitter: 'https://twitter.com/testauthor',
  };

  const mockPrevPost: BlogPostMeta = {
    slug: 'previous-post',
    filePath: 'path/to/previous-post.mdx',
    title: 'Previous Post',
    date: '2025-01-25',
    tags: [],
    draft: false,
    authors: ['default'],
    readingTime: mockReadingTime,
  };

  const mockNextPost: BlogPostMeta = {
    slug: 'next-post',
    filePath: 'path/to/next-post.mdx',
    title: 'Next Post',
    date: '2025-01-27',
    tags: [],
    draft: false,
    authors: ['default'],
    readingTime: mockReadingTime,
  };

  it('renders post title, date, and content', () => {
    render(
      <PostLayout
        post={mockPost}
        authors={[mockAuthor]}
        prev={null}
        next={null}
      >
        <div>{mockPost.content}</div>
      </PostLayout>
    );

    expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    expect(screen.getByText('Sunday 26 January 2025')).toBeInTheDocument();
    expect(
      screen.getByText('This is the content of the test post.')
    ).toBeInTheDocument();
  });

  it('renders author information', () => {
    render(
      <PostLayout
        post={mockPost}
        authors={[mockAuthor]}
        prev={null}
        next={null}
      >
        <div>{mockPost.content}</div>
      </PostLayout>
    );

    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByAltText('Test Author')).toHaveAttribute(
      'src',
      mockAuthor.avatar
    );
    expect(screen.queryByText('@testauthor')).not.toBeInTheDocument();
  });

  it('renders tags', () => {
    render(
      <PostLayout
        post={mockPost}
        authors={[mockAuthor]}
        prev={null}
        next={null}
      >
        <div>{mockPost.content}</div>
      </PostLayout>
    );

    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('renders previous and next post links when available', () => {
    render(
      <PostLayout
        post={mockPost}
        authors={[mockAuthor]}
        prev={mockPrevPost}
        next={mockNextPost}
      >
        <div>{mockPost.content}</div>
      </PostLayout>
    );

    expect(screen.getByText('Previous Article')).toBeInTheDocument();
    expect(screen.getByText('Previous Post')).toHaveAttribute(
      'href',
      `/${mockPrevPost.slug}`
    );
    expect(screen.getByText('Next Article')).toBeInTheDocument();
    expect(screen.getByText('Next Post')).toHaveAttribute(
      'href',
      `/${mockNextPost.slug}`
    );
  });

  it('does not render previous link if prev is null', () => {
    render(
      <PostLayout
        post={mockPost}
        authors={[mockAuthor]}
        prev={null}
        next={mockNextPost}
      >
        <div>{mockPost.content}</div>
      </PostLayout>
    );

    expect(screen.queryByText('Previous Article')).not.toBeInTheDocument();
    expect(screen.getByText('Next Article')).toBeInTheDocument();
  });

  it('does not render next link if next is null', () => {
    render(
      <PostLayout
        post={mockPost}
        authors={[mockAuthor]}
        prev={mockPrevPost}
        next={null}
      >
        <div>{mockPost.content}</div>
      </PostLayout>
    );

    expect(screen.getByText('Previous Article')).toBeInTheDocument();
    expect(screen.queryByText('Next Article')).not.toBeInTheDocument();
  });

  it('renders back to homepage link', () => {
    render(
      <PostLayout
        post={mockPost}
        authors={[mockAuthor]}
        prev={null}
        next={null}
      >
        <div>{mockPost.content}</div>
      </PostLayout>
    );

    expect(screen.getByText('← Back to homepage')).toHaveAttribute('href', '/');
  });

  it('renders reading time in header', () => {
    render(
      <PostLayout
        post={mockPost}
        authors={[mockAuthor]}
        prev={null}
        next={null}
      >
        <div>{mockPost.content}</div>
      </PostLayout>
    );

    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });
});
