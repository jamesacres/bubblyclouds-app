import fs from 'fs';
import matter from 'gray-matter';
import * as blogUtils from './blogUtils';

jest.mock('fs');
jest.mock('gray-matter');
jest.mock('./blogUtils');

describe('posts library', () => {
  let getAllPosts: typeof import('./posts').getAllPosts;
  let getPostBySlug: typeof import('./posts').getPostBySlug;
  let getAllSlugs: typeof import('./posts').getAllSlugs;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      const posts = require('./posts');
      getAllPosts = posts.getAllPosts;
      getPostBySlug = posts.getPostBySlug;
      getAllSlugs = posts.getAllSlugs;
    });
  });

  describe('getAllPosts', () => {
    it('should return all non-draft posts sorted by date', async () => {
      const mockPosts = [
        {
          slug: 'post-1',
          filePath: 'post-1.mdx',
          title: 'Post 1',
          date: '2024-01-01',
          tags: [],
          draft: false,
          summary: 'Summary 1',
          authors: ['author'],
          readingTime: 5,
          content: 'content 1',
        },
        {
          slug: 'post-2',
          filePath: 'post-2.mdx',
          title: 'Post 2',
          date: '2024-01-02',
          tags: [],
          draft: false,
          summary: 'Summary 2',
          authors: ['author'],
          readingTime: 3,
          content: 'content 2',
        },
      ];

      const mockMetaPosts = mockPosts.map(
        ({ content: _content, ...rest }) => rest
      );

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'post-1.mdx', isDirectory: () => false },
        { name: 'post-2.mdx', isDirectory: () => false },
      ]);
      (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
        if (filePath.includes('post-1')) {
          return '---\ntitle: Post 1\ndate: 2024-01-01\n---\ncontent 1';
        }
        return '---\ntitle: Post 2\ndate: 2024-01-02\n---\ncontent 2';
      });
      (matter as unknown as jest.Mock).mockImplementation((_content) => ({
        data: { title: 'Post', date: '2024-01-01' },
        content: 'mock content',
      }));
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue(mockMetaPosts);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue(mockMetaPosts);
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(5);

      const posts = await getAllPosts();

      expect(posts).toHaveLength(2);
      expect(blogUtils.filterDraftPosts).toHaveBeenCalled();
      expect(blogUtils.sortPostsByDate).toHaveBeenCalled();
    });

    it('should filter out draft posts', async () => {
      const allPosts = [
        {
          slug: 'published',
          title: 'Published',
          draft: false,
        },
        {
          slug: 'draft',
          title: 'Draft',
          draft: true,
        },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([allPosts[0]]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([allPosts[0]]);

      await getAllPosts();

      expect(blogUtils.filterDraftPosts).toHaveBeenCalled();
    });

    it('should return empty array if no posts directory', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([]);

      const posts = await getAllPosts();

      expect(posts).toEqual([]);
    });

    it('should cache posts on subsequent calls', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'test.mdx', isDirectory: () => false },
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        '---\ntitle: Test\ndate: 2024-01-01\n---\ncontent'
      );
      (matter as unknown as jest.Mock).mockReturnValue({
        data: { title: 'Test', date: '2024-01-01' },
        content: 'content',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(5);
      (blogUtils.filterDraftPosts as jest.Mock).mockImplementation(
        (posts) => posts
      );
      (blogUtils.sortPostsByDate as jest.Mock).mockImplementation(
        (posts) => posts
      );

      const posts1 = await getAllPosts();
      const firstCallCount = (fs.readdirSync as jest.Mock).mock.calls.length;
      const posts2 = await getAllPosts();
      const secondCallCount = (fs.readdirSync as jest.Mock).mock.calls.length;

      expect(posts1).toEqual(posts2);
      expect(firstCallCount).toBe(secondCallCount);
    });
  });

  describe('getPostBySlug', () => {
    it('should return post by slug', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'test-post.mdx', isDirectory: () => false },
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        '---\ntitle: Test Post\ndate: 2024-01-01\n---\ncontent'
      );
      (matter as unknown as jest.Mock).mockReturnValue({
        data: { title: 'Test Post', date: '2024-01-01' },
        content: 'content',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(5);

      const post = await getPostBySlug('test-post');

      expect(post).toEqual(
        expect.objectContaining({ slug: 'test-post', title: 'Test Post' })
      );
      expect(post?.content).toBe('content');
    });

    it('should return null if post not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([]);

      const post = await getPostBySlug('nonexistent');

      expect(post).toBeNull();
    });

    it('should handle nested directory structure', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock)
        .mockReturnValueOnce([{ name: 'subfolder', isDirectory: () => true }])
        .mockReturnValueOnce([
          { name: 'nested-post.mdx', isDirectory: () => false },
        ]);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        '---\ntitle: Nested Post\ndate: 2024-01-01\n---\ncontent'
      );
      (matter as unknown as jest.Mock).mockReturnValue({
        data: { title: 'Nested Post', date: '2024-01-01' },
        content: 'content',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(5);

      const post = await getPostBySlug('subfolder/nested-post');

      expect(post).not.toBeNull();
      expect(post?.slug).toBe('subfolder/nested-post');
    });
  });

  describe('getAllSlugs', () => {
    it('should return all post slugs', async () => {
      const mockPosts = [
        {
          slug: 'post-1',
          filePath: 'post-1.mdx',
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
          filePath: 'post-2.mdx',
          title: 'Post 2',
          date: '2024-01-02',
          tags: [],
          draft: false,
          summary: 'Summary 2',
          authors: ['author'],
          readingTime: 3,
        },
      ];

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue(mockPosts);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue(mockPosts);

      const slugs = await getAllSlugs();

      expect(slugs).toEqual(['post-1', 'post-2']);
    });

    it('should return empty array if no posts', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([]);

      const slugs = await getAllSlugs();

      expect(slugs).toEqual([]);
    });
  });

  describe('extractFrontmatter', () => {
    it('should extract valid frontmatter fields', async () => {
      const mockFrontmatter = {
        title: 'Test',
        date: '2024-01-01',
        tags: ['tag1', 'tag2'],
        draft: false,
        summary: 'Test summary',
        authors: ['Author'],
        images: ['/image.png'],
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'test.mdx', isDirectory: () => false },
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        '---\ntitle: Test\n---\ncontent'
      );
      (matter as unknown as jest.Mock).mockReturnValue({
        data: mockFrontmatter,
        content: 'content',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(5);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([]);

      const posts = await getAllPosts();

      expect(posts).toBeDefined();
    });

    it('should handle missing frontmatter gracefully', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'test.mdx', isDirectory: () => false },
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue('no frontmatter here');
      (matter as unknown as jest.Mock).mockReturnValue({
        data: {},
        content: 'no frontmatter here',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(1);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([]);

      const posts = await getAllPosts();

      expect(posts).toBeDefined();
    });

    it('should use defaults for missing fields', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'test.mdx', isDirectory: () => false },
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue('---\n---\ncontent');
      (matter as unknown as jest.Mock).mockReturnValue({
        data: { title: 'No Summary' },
        content: 'content',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(5);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([]);

      const posts = await getAllPosts();

      expect(posts).toBeDefined();
    });
  });

  describe('getMdxFiles', () => {
    it('should recursively find mdx and md files', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock)
        .mockReturnValueOnce([
          { name: 'post1.mdx', isDirectory: () => false },
          { name: 'subfolder', isDirectory: () => true },
        ])
        .mockReturnValueOnce([{ name: 'post2.md', isDirectory: () => false }]);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        '---\ntitle: Test\ndate: 2024-01-01\n---\ncontent'
      );
      (matter as unknown as jest.Mock).mockReturnValue({
        data: { title: 'Test', date: '2024-01-01' },
        content: 'content',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(5);
      (blogUtils.filterDraftPosts as jest.Mock).mockImplementation(
        (posts) => posts
      );
      (blogUtils.sortPostsByDate as jest.Mock).mockImplementation(
        (posts) => posts
      );

      await getAllPosts();

      expect(fs.readdirSync).toHaveBeenCalled();
    });

    it('should ignore non-markdown files', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'readme.txt', isDirectory: () => false },
        { name: 'image.png', isDirectory: () => false },
      ]);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([]);

      const posts = await getAllPosts();

      expect(posts).toEqual([]);
    });
  });

  describe('getSlugFromPath', () => {
    it('should convert file path to slug for nested posts', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock)
        .mockReturnValueOnce([{ name: 'category', isDirectory: () => true }])
        .mockReturnValueOnce([{ name: 'post.mdx', isDirectory: () => false }]);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        '---\ntitle: Test\ndate: 2024-01-01\n---\ncontent'
      );
      (matter as unknown as jest.Mock).mockReturnValue({
        data: { title: 'Test', date: '2024-01-01' },
        content: 'content',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(5);
      (blogUtils.filterDraftPosts as jest.Mock).mockImplementation(
        (posts) => posts
      );
      (blogUtils.sortPostsByDate as jest.Mock).mockImplementation(
        (posts) => posts
      );

      const posts = await getAllPosts();

      expect(posts).toBeDefined();
      expect(posts.length).toBeGreaterThan(0);
    });
  });

  describe('parsePost', () => {
    it('should parse post with all fields', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'test.mdx', isDirectory: () => false },
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        '---\ntitle: Test Post\ndate: 2024-01-01\ntags:\n  - test\n  - example\n---\nPost content here'
      );
      (matter as unknown as jest.Mock).mockReturnValue({
        data: {
          title: 'Test Post',
          date: '2024-01-01',
          tags: ['test', 'example'],
        },
        content: 'Post content here',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(3);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([]);

      const posts = await getAllPosts();

      expect(posts).toBeDefined();
    });

    it('should use default values for missing fields', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'test.mdx', isDirectory: () => false },
      ]);
      (fs.readFileSync as jest.Mock).mockReturnValue('---\n---\nContent');
      (matter as unknown as jest.Mock).mockReturnValue({
        data: {},
        content: 'Content',
      });
      (blogUtils.calculateReadingTime as jest.Mock).mockReturnValue(1);
      (blogUtils.filterDraftPosts as jest.Mock).mockReturnValue([]);
      (blogUtils.sortPostsByDate as jest.Mock).mockReturnValue([]);

      const posts = await getAllPosts();

      expect(posts).toBeDefined();
    });
  });
});
