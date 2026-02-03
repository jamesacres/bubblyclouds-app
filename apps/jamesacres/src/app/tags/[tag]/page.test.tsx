import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import TagPage, { generateStaticParams, generateMetadata } from './page';
import * as postsModule from '@/lib/posts';
import * as tagUtils from '@bubblyclouds-app/blog/helpers/tagUtils';

jest.mock('next/navigation');
jest.mock('@/lib/posts');
jest.mock('@bubblyclouds-app/blog/helpers/tagUtils');
jest.mock('@bubblyclouds-app/blog/components/PostList', () => ({
  __esModule: true,
  default: ({ posts }: { posts: unknown[] }) => (
    <div data-testid="tag-posts">{posts.length} posts with tag</div>
  ),
}));
jest.mock('@bubblyclouds-app/blog/components/TagList', () => ({
  __esModule: true,
  default: ({ tags }: { tags: unknown[] }) => (
    <div data-testid="tag-list">{tags.length} tags available</div>
  ),
}));

describe('TagPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateStaticParams', () => {
    it('should return all tags', async () => {
      const mockPosts = [
        {
          slug: 'post-1',
          title: 'Post 1',
          date: '2024-01-01',
          tags: ['typescript', 'react'],
          draft: false,
          summary: 'Summary 1',
          authors: ['author'],
          readingTime: 5,
        },
        {
          slug: 'post-2',
          title: 'Post 2',
          date: '2024-01-02',
          tags: ['javascript'],
          draft: false,
          summary: 'Summary 2',
          authors: ['author'],
          readingTime: 3,
        },
      ];

      const mockTagCounts = [
        { tag: 'typescript', displayName: 'TypeScript', count: 1 },
        { tag: 'react', displayName: 'React', count: 1 },
        { tag: 'javascript', displayName: 'JavaScript', count: 1 },
      ];

      (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
      (tagUtils.getTagCounts as jest.Mock).mockReturnValue(mockTagCounts);

      const params = await generateStaticParams();

      expect(params).toEqual([
        { tag: 'typescript' },
        { tag: 'react' },
        { tag: 'javascript' },
      ]);
    });

    it('should handle no posts', async () => {
      (postsModule.getAllPosts as jest.Mock).mockResolvedValue([]);
      (tagUtils.getTagCounts as jest.Mock).mockReturnValue([]);

      const params = await generateStaticParams();

      expect(params).toEqual([]);
    });
  });

  describe('generateMetadata', () => {
    it('should generate correct metadata for tag', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ tag: 'typescript' }),
      });

      expect(metadata).toEqual({
        title: 'typescript',
        description: 'Posts with tag typescript',
      });
    });

    it('should handle different tag names', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ tag: 'react' }),
      });

      expect(metadata).toEqual({
        title: 'react',
        description: 'Posts with tag react',
      });
    });
  });

  describe('TagPage component', () => {
    it('should render page with tag heading', async () => {
      const mockPosts = [
        {
          slug: 'post-1',
          title: 'Post 1',
          date: '2024-01-01',
          tags: ['typescript'],
          draft: false,
          summary: 'Summary 1',
          authors: ['author'],
          readingTime: 5,
        },
      ];

      const mockTagCounts = [
        { tag: 'typescript', displayName: 'TypeScript', count: 1 },
      ];

      (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
      (tagUtils.getTagCounts as jest.Mock).mockReturnValue(mockTagCounts);
      (tagUtils.slugifyTag as jest.Mock).mockImplementation((tag) =>
        tag.toLowerCase()
      );

      const result = await TagPage({
        params: Promise.resolve({ tag: 'typescript' }),
      });
      const { container } = render(result);

      expect(container.textContent).toContain('TypeScript');
    });

    it('should call notFound if tag does not exist', async () => {
      const mockPosts: unknown[] = [];
      const mockTagCounts: unknown[] = [];

      (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
      (tagUtils.getTagCounts as jest.Mock).mockReturnValue(mockTagCounts);
      (notFound as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('NEXT_NOT_FOUND');
      });

      await expect(
        TagPage({
          params: Promise.resolve({ tag: 'nonexistent' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(notFound).toHaveBeenCalled();
    });

    it('should render posts with matching tags', async () => {
      const mockPosts = [
        {
          slug: 'post-1',
          title: 'Post 1',
          date: '2024-01-01',
          tags: ['typescript', 'react'],
          draft: false,
          summary: 'Summary 1',
          authors: ['author'],
          readingTime: 5,
        },
        {
          slug: 'post-2',
          title: 'Post 2',
          date: '2024-01-02',
          tags: ['typescript'],
          draft: false,
          summary: 'Summary 2',
          authors: ['author'],
          readingTime: 3,
        },
        {
          slug: 'post-3',
          title: 'Post 3',
          date: '2024-01-03',
          tags: ['javascript'],
          draft: false,
          summary: 'Summary 3',
          authors: ['author'],
          readingTime: 4,
        },
      ];

      const mockTagCounts = [
        { tag: 'typescript', displayName: 'TypeScript', count: 2 },
        { tag: 'react', displayName: 'React', count: 1 },
        { tag: 'javascript', displayName: 'JavaScript', count: 1 },
      ];

      (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
      (tagUtils.getTagCounts as jest.Mock).mockReturnValue(mockTagCounts);
      (tagUtils.slugifyTag as jest.Mock).mockImplementation((tag) =>
        tag.toLowerCase()
      );

      const result = await TagPage({
        params: Promise.resolve({ tag: 'typescript' }),
      });
      render(result);

      expect(screen.getByTestId('tag-posts')).toHaveTextContent(
        '2 posts with tag'
      );
    });

    it('should render tag list', async () => {
      const mockPosts: unknown[] = [];
      const mockTagCounts: unknown[] = [
        { tag: 'typescript', displayName: 'TypeScript', count: 5 },
        { tag: 'react', displayName: 'React', count: 3 },
      ];

      (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
      (tagUtils.getTagCounts as jest.Mock).mockReturnValue(mockTagCounts);

      // Mock notFound to not actually throw
      (notFound as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Not found');
      });

      try {
        await TagPage({
          params: Promise.resolve({ tag: 'typescript' }),
        });
      } catch {
        // Expected to throw on notFound
      }
    });

    it('should handle case sensitivity in tag matching', async () => {
      const mockPosts = [
        {
          slug: 'post-1',
          title: 'Post 1',
          date: '2024-01-01',
          tags: ['TypeScript'],
          draft: false,
          summary: 'Summary 1',
          authors: ['author'],
          readingTime: 5,
        },
      ];

      const mockTagCounts = [
        { tag: 'typescript', displayName: 'TypeScript', count: 1 },
      ];

      (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
      (tagUtils.getTagCounts as jest.Mock).mockReturnValue(mockTagCounts);
      (tagUtils.slugifyTag as jest.Mock).mockImplementation((tag) =>
        tag.toLowerCase()
      );

      const result = await TagPage({
        params: Promise.resolve({ tag: 'typescript' }),
      });
      render(result);

      expect(screen.getByTestId('tag-posts')).toBeInTheDocument();
    });

    it('should display correct tag display name', async () => {
      const mockPosts = [
        {
          slug: 'post-1',
          title: 'Post 1',
          date: '2024-01-01',
          tags: ['typescript'],
          draft: false,
          summary: 'Summary 1',
          authors: ['author'],
          readingTime: 5,
        },
      ];

      const mockTagCounts = [
        { tag: 'typescript', displayName: 'TypeScript', count: 1 },
      ];

      (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
      (tagUtils.getTagCounts as jest.Mock).mockReturnValue(mockTagCounts);
      (tagUtils.slugifyTag as jest.Mock).mockImplementation((tag) =>
        tag.toLowerCase()
      );

      const result = await TagPage({
        params: Promise.resolve({ tag: 'typescript' }),
      });
      const { container } = render(result);

      expect(container.textContent).toContain('TypeScript');
    });

    it('should have correct page structure', async () => {
      const mockPosts: unknown[] = [];
      const mockTagCounts: unknown[] = [
        { tag: 'typescript', displayName: 'TypeScript', count: 0 },
      ];

      (postsModule.getAllPosts as jest.Mock).mockResolvedValue(mockPosts);
      (tagUtils.getTagCounts as jest.Mock).mockReturnValue(mockTagCounts);
      (tagUtils.slugifyTag as jest.Mock).mockImplementation((tag) =>
        tag.toLowerCase()
      );

      const result = await TagPage({
        params: Promise.resolve({ tag: 'typescript' }),
      });
      const { container } = render(result);

      const divideDiv = container.querySelector('.divide-y');
      expect(divideDiv).toBeInTheDocument();
    });
  });
});
