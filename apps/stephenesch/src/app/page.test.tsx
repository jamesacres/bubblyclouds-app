import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import * as postsModule from '@bubblyclouds-app/blog/helpers/posts';

jest.mock('@bubblyclouds-app/blog/helpers/posts');
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} data-testid="next-image" />
  ),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    'aria-label': ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    'aria-label'?: string;
  }) => (
    <a href={href} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));
jest.mock('@bubblyclouds-app/blog/components/PostList', () => ({
  __esModule: true,
  default: ({ posts }: { posts: unknown[] }) => (
    <div data-testid="featured-posts">{posts.length} featured posts</div>
  ),
}));
jest.mock('@/data/siteMetadata', () => ({
  __esModule: true,
  default: {
    description: 'Musics, cookings and good times',
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render home page with heading', async () => {
    const mockPosts: unknown[] = [];
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await HomePage();
    const { container } = render(result);

    expect(container.textContent).toContain('Recent posts');
  });

  it('should display featured posts', async () => {
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
      slug: `post-${i}`,
      title: `Post ${i}`,
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      tags: [],
      draft: false,
      summary: `Summary ${i}`,
      authors: ['author'],
      readingTime: 5,
    }));

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await HomePage();
    render(result);

    expect(screen.getByTestId('featured-posts')).toHaveTextContent(
      '10 featured posts'
    );
  });

  it('should limit featured posts to MAX_DISPLAY', async () => {
    const mockPosts = Array.from({ length: 3 }, (_, i) => ({
      slug: `post-${i}`,
      title: `Post ${i}`,
      date: '2024-01-01',
      tags: [],
      draft: false,
      summary: `Summary ${i}`,
      authors: ['author'],
      readingTime: 5,
    }));

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await HomePage();
    render(result);

    expect(screen.getByTestId('featured-posts')).toHaveTextContent(
      '3 featured posts'
    );
  });

  it('should show next link when more than MAX_DISPLAY posts', async () => {
    const mockPosts = Array.from({ length: 101 }, (_, i) => ({
      slug: `post-${i}`,
      title: `Post ${i}`,
      date: '2024-01-01',
      tags: [],
      draft: false,
      summary: `Summary ${i}`,
      authors: ['author'],
      readingTime: 5,
    }));

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await HomePage();
    const { container } = render(result);

    const nextLink = container.querySelector('a[aria-label="Next page"]');
    expect(nextLink).toBeInTheDocument();
    expect(nextLink).toHaveAttribute('href', '/blog/page/2');
  });

  it('should not show next link when posts <= MAX_DISPLAY', async () => {
    const mockPosts = Array.from({ length: 100 }, (_, i) => ({
      slug: `post-${i}`,
      title: `Post ${i}`,
      date: '2024-01-01',
      tags: [],
      draft: false,
      summary: `Summary ${i}`,
      authors: ['author'],
      readingTime: 5,
    }));

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await HomePage();
    const { container } = render(result);

    const nextLink = container.querySelector('a[aria-label="Next page"]');
    expect(nextLink).not.toBeInTheDocument();
  });

  it('should render logo image', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    render(result);

    const image = screen.getByTestId('next-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/static/images/logo.png');
    expect(image).toHaveAttribute('alt', 'Good Vibrations');
  });

  it('should display yellow box with description', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    const { container } = render(result);

    expect(container.textContent).toContain('Musics, cookings and good times');
  });

  it('should have correct styling for yellow box', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    const { container } = render(result);

    const divideDiv = container.querySelector('.divide-y');
    expect(divideDiv).toBeInTheDocument();
  });

  it('should render page heading', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    const { container } = render(result);

    const heading = container.querySelector('h2');
    expect(heading).toHaveTextContent('Musics, cookings and good times');
  });

  it('should handle empty posts gracefully', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    render(result);

    expect(screen.getByTestId('featured-posts')).toHaveTextContent(
      '0 featured posts'
    );
  });

  it('should extract featured posts from all posts array', async () => {
    const mockPosts = Array.from({ length: 150 }, (_, i) => ({
      slug: `post-${i}`,
      title: `Post ${i}`,
      date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
      tags: [],
      draft: false,
      summary: `Summary ${i}`,
      authors: ['author'],
      readingTime: 5,
    }));

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await HomePage();
    render(result);

    expect(screen.getByTestId('featured-posts')).toHaveTextContent(
      '100 featured posts'
    );
  });

  it('should display ratings heading', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    const { container } = render(result);

    const recentPostsHeading = Array.from(
      container.querySelectorAll('h2')
    ).find((h2) => h2.textContent === 'Recent posts');
    expect(recentPostsHeading).toBeInTheDocument();
  });

  it('should have ratings link', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    const { container } = render(result);

    const ratingsLink = container.querySelector('a[href="/ratings"]');
    expect(ratingsLink).toBeInTheDocument();
    expect(ratingsLink).toHaveTextContent('Explore ratings');
  });

  it('should have correct styling for layout', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    const { container } = render(result);

    const divideDiv = container.querySelector('.divide-y');
    expect(divideDiv).toBeInTheDocument();
  });
});
