import { render, screen } from '@testing-library/react';
import BlogPage from './page';
import * as postsModule from '@bubblyclouds-app/blog/helpers/posts';
import * as blogUtils from '@bubblyclouds-app/blog/helpers/blogUtils';

jest.mock('@bubblyclouds-app/blog/helpers/posts');
jest.mock('@/lib/posts', () => ({
  POSTS_PER_PAGE: 5,
}));
jest.mock('@bubblyclouds-app/blog/helpers/blogUtils');
jest.mock('@bubblyclouds-app/blog/components/PostList', () => ({
  __esModule: true,
  default: ({ posts }: { posts: unknown[] }) => (
    <div data-testid="post-list">{posts.length} posts</div>
  ),
}));
jest.mock('@bubblyclouds-app/blog/components/Pagination', () => ({
  __esModule: true,
  default: ({
    totalPages,
    currentPage,
  }: {
    totalPages: number;
    currentPage: number;
    basePath: string;
  }) => (
    <div data-testid="pagination">
      Page {currentPage} of {totalPages}
    </div>
  ),
}));

describe('BlogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render blog page heading', async () => {
    const mockPosts = [
      {
        slug: 'post-1',
        title: 'Post 1',
        date: '2024-01-01',
        tags: [],
        draft: false,
        summary: 'Summary 1',
        authors: ['author'],
        readingTime: 5,
      },
      {
        slug: 'post-2',
        title: 'Post 2',
        date: '2024-01-02',
        tags: [],
        draft: false,
        summary: 'Summary 2',
        authors: ['author'],
        readingTime: 3,
      },
    ];

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
    (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
      items: mockPosts,
      totalPages: 1,
      currentPage: 1,
    });

    const result = await BlogPage();
    const { container } = render(result);

    expect(container.textContent).toContain('All Posts');
  });

  it('should display paginated posts', async () => {
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
      slug: `post-${i}`,
      title: `Post ${i}`,
      date: '2024-01-01',
      tags: [],
      draft: false,
      summary: `Summary ${i}`,
      authors: ['author'],
      readingTime: 5,
    }));

    const paginatedPosts = mockPosts.slice(0, 5);

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
    (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
      items: paginatedPosts,
      totalPages: 2,
      currentPage: 1,
    });

    const result = await BlogPage();
    render(result);

    expect(blogUtils.paginatePosts).toHaveBeenCalledWith(mockPosts, 1, 5);
  });

  it('should render PostList component with paginated posts', async () => {
    const mockPosts = [
      {
        slug: 'post-1',
        title: 'Post 1',
        date: '2024-01-01',
        tags: [],
        draft: false,
        summary: 'Summary 1',
        authors: ['author'],
        readingTime: 5,
      },
    ];

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
    (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
      items: mockPosts,
      totalPages: 1,
      currentPage: 1,
    });

    const result = await BlogPage();
    render(result);

    expect(screen.getByTestId('post-list')).toBeInTheDocument();
  });

  it('should render Pagination component', async () => {
    const mockPosts = Array.from({ length: 10 }, (_, i) => ({
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
    (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
      items: mockPosts.slice(0, 5),
      totalPages: 2,
      currentPage: 1,
    });

    const result = await BlogPage();
    render(result);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('should handle empty posts list', async () => {
    (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
    (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
      items: [],
      totalPages: 0,
      currentPage: 1,
    });

    const result = await BlogPage();
    render(result);

    expect(screen.getByTestId('post-list')).toBeInTheDocument();
  });

  it('should pass correct basePath to Pagination', async () => {
    const mockPosts = [
      {
        slug: 'post-1',
        title: 'Post 1',
        date: '2024-01-01',
        tags: [],
        draft: false,
        summary: 'Summary 1',
        authors: ['author'],
        readingTime: 5,
      },
    ];

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
    (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
      items: mockPosts,
      totalPages: 1,
      currentPage: 1,
    });

    const result = await BlogPage();
    render(result);

    const pagination = screen.getByTestId('pagination');
    expect(pagination).toHaveTextContent('Page 1 of 1');
  });

  it('should have correct styling classes', async () => {
    const mockPosts: unknown[] = [];

    (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
    (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
      items: [],
      totalPages: 0,
      currentPage: 1,
    });

    const result = await BlogPage();
    const { container } = render(result);

    const divideDiv = container.querySelector('.divide-y');
    expect(divideDiv).toBeInTheDocument();
  });
});
