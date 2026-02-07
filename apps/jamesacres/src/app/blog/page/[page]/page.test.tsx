import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import BlogPageNumber, { generateStaticParams } from './page';
import * as postsModule from '@bubblyclouds-app/blog/helpers/posts';
import * as blogUtils from '@bubblyclouds-app/blog/helpers/blogUtils';

jest.mock('next/navigation');
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

describe('BlogPageNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateStaticParams', () => {
    it('should generate params for all blog pages', async () => {
      const mockPosts = Array.from({ length: 12 }, (_, i) => ({
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

      const params = await generateStaticParams();

      expect(params).toEqual([{ page: '1' }, { page: '2' }, { page: '3' }]);
    });

    it('should handle no posts', async () => {
      (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);

      const params = await generateStaticParams();

      expect(params).toEqual([]);
    });

    it('should handle single page of posts', async () => {
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

      const params = await generateStaticParams();

      expect(params).toEqual([{ page: '1' }]);
    });

    it('should calculate correct page numbers', async () => {
      const mockPosts = Array.from({ length: 15 }, (_, i) => ({
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

      const params = await generateStaticParams();

      expect(params).toEqual([{ page: '1' }, { page: '2' }, { page: '3' }]);
    });
  });

  describe('BlogPageNumber component', () => {
    it('should render blog page with correct page number', async () => {
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
        items: mockPosts.slice(5, 10),
        totalPages: 2,
        currentPage: 2,
      });

      const result = await BlogPageNumber({
        params: Promise.resolve({ page: '2' }),
      });
      const { container } = render(result);

      expect(container.textContent).toContain('All Posts');
    });

    it('should call notFound for invalid page', async () => {
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
      (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
        items: [],
        totalPages: 1,
        currentPage: 99,
      });
      (notFound as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND');
      });

      await expect(
        BlogPageNumber({
          params: Promise.resolve({ page: '99' }),
        })
      ).rejects.toThrow();

      expect(notFound).toHaveBeenCalled();
    });

    it('should display posts for current page', async () => {
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

      const pageItems = mockPosts.slice(5, 10);

      (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
      (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
        items: pageItems,
        totalPages: 2,
        currentPage: 2,
      });

      const result = await BlogPageNumber({
        params: Promise.resolve({ page: '2' }),
      });
      render(result);

      expect(screen.getByTestId('post-list')).toHaveTextContent('5 posts');
    });

    it('should render pagination with correct info', async () => {
      const mockPosts = Array.from({ length: 15 }, (_, i) => ({
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
        items: mockPosts.slice(5, 10),
        totalPages: 3,
        currentPage: 2,
      });

      const result = await BlogPageNumber({
        params: Promise.resolve({ page: '2' }),
      });
      render(result);

      expect(screen.getByTestId('pagination')).toHaveTextContent('Page 2 of 3');
    });

    it('should handle page 1 correctly', async () => {
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

      const result = await BlogPageNumber({
        params: Promise.resolve({ page: '1' }),
      });
      render(result);

      expect(screen.getByTestId('post-list')).toBeInTheDocument();
    });

    it('should pass correct basePath to Pagination', async () => {
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
        items: mockPosts.slice(5, 10),
        totalPages: 2,
        currentPage: 2,
      });

      const result = await BlogPageNumber({
        params: Promise.resolve({ page: '2' }),
      });
      render(result);

      const pagination = screen.getByTestId('pagination');
      expect(pagination).toHaveTextContent('Page 2 of 2');
    });

    it('should have correct styling classes', async () => {
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
        items: mockPosts.slice(5, 10),
        totalPages: 2,
        currentPage: 2,
      });

      const result = await BlogPageNumber({
        params: Promise.resolve({ page: '2' }),
      });
      const { container } = render(result);

      const divideDiv = container.querySelector('.divide-y');
      expect(divideDiv).toBeInTheDocument();
    });

    it('should handle empty page results', async () => {
      (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
      (blogUtils.paginatePosts as jest.Mock).mockReturnValue({
        items: [],
        totalPages: 0,
        currentPage: 1,
      });

      const result = await BlogPageNumber({
        params: Promise.resolve({ page: '2' }),
      });
      render(result);

      expect(screen.getByTestId('post-list')).toHaveTextContent('0 posts');
    });
  });
});
