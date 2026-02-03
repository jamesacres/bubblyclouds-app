import { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from './page';
import * as postsModule from '@/lib/posts';

jest.mock('@/lib/posts');
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
    children: ReactNode;
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

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render home page with heading', async () => {
    const mockPosts: unknown[] = [];
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);

    const result = await HomePage();
    const { container } = render(result);

    expect(container.textContent).toContain('Recently Published');
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
      '5 featured posts'
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
    const mockPosts = Array.from({ length: 6 }, (_, i) => ({
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
    const mockPosts = Array.from({ length: 5 }, (_, i) => ({
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

  it('should render mascot image', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    render(result);

    const image = screen.getByTestId('next-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/static/images/mascot.png');
    expect(image).toHaveAttribute('alt', 'avatar');
  });

  it('should display welcome message bubble', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

    const result = await HomePage();
    const { container } = render(result);

    expect(container.textContent).toContain(
      "I'm creating awesome, here are some of my thoughts."
    );
  });

  it('should have correct styling for layout', async () => {
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

    const heading = container.querySelector('h1');
    expect(heading).toHaveTextContent('Recently Published');
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
    const mockPosts = Array.from({ length: 15 }, (_, i) => ({
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
      '5 featured posts'
    );
  });
});
