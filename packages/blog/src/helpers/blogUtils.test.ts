import {
  sortPostsByDate,
  filterDraftPosts,
  paginatePosts,
  calculateReadingTime,
  parseFrontmatter,
  getAdjacentPosts,
} from './blogUtils';
import { BlogPostMeta, ReadingTime, PaginatedResult } from '../types';

// Mock BlogPostMeta data for testing
const mockPosts: BlogPostMeta[] = [
  {
    slug: 'post-a',
    filePath: 'path/to/post-a.mdx',
    title: 'Post A',
    date: '2025-01-03',
    tags: ['tag1'],
    draft: false,
    authors: ['default'],
    readingTime: { text: '1 min read', minutes: 1, words: 100 },
  },
  {
    slug: 'post-b',
    filePath: 'path/to/post-b.mdx',
    title: 'Post B',
    date: '2025-01-01',
    tags: ['tag2'],
    draft: false,
    authors: ['default'],
    readingTime: { text: '2 min read', minutes: 2, words: 200 },
  },
  {
    slug: 'post-c',
    filePath: 'path/to/post-c.mdx',
    title: 'Post C',
    date: '2025-01-02',
    tags: ['tag1', 'tag2'],
    draft: true,
    authors: ['default'],
    readingTime: { text: '3 min read', minutes: 3, words: 300 },
  },
  {
    slug: 'post-d',
    filePath: 'path/to/post-d.mdx',
    title: 'Post D',
    date: '2025-01-04',
    tags: ['tag3'],
    draft: false,
    authors: ['default'],
    readingTime: { text: '1 min read', minutes: 1, words: 100 },
  },
];

describe('sortPostsByDate', () => {
  it('should sort posts by date in descending order (newest first)', () => {
    const sorted = sortPostsByDate(mockPosts);
    expect(sorted.map((p) => p.slug)).toEqual([
      'post-d',
      'post-a',
      'post-c',
      'post-b',
    ]);
  });

  it('should not modify the original array', () => {
    const original = [...mockPosts];
    sortPostsByDate(mockPosts);
    expect(mockPosts).toEqual(original);
  });
});

describe('filterDraftPosts', () => {
  it('should filter out posts marked as draft', () => {
    const published = filterDraftPosts(mockPosts);
    expect(published.map((p) => p.slug)).toEqual([
      'post-a',
      'post-b',
      'post-d',
    ]);
  });

  it('should return all posts if none are drafts', () => {
    const noDrafts: BlogPostMeta[] = mockPosts.filter((p) => !p.draft);
    expect(filterDraftPosts(noDrafts)).toEqual(noDrafts);
  });
});

describe('paginatePosts', () => {
  it('should paginate items correctly', () => {
    const items = Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`);
    const page1 = paginatePosts(items, 1, 3);
    expect(page1).toEqual({
      items: ['Item 1', 'Item 2', 'Item 3'],
      currentPage: 1,
      totalPages: 4,
      totalItems: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    });

    const page2 = paginatePosts(items, 2, 3);
    expect(page2).toEqual({
      items: ['Item 4', 'Item 5', 'Item 6'],
      currentPage: 2,
      totalPages: 4,
      totalItems: 10,
      hasNextPage: true,
      hasPreviousPage: true,
    });

    const page4 = paginatePosts(items, 4, 3);
    expect(page4).toEqual({
      items: ['Item 10'],
      currentPage: 4,
      totalPages: 4,
      totalItems: 10,
      hasNextPage: false,
      hasPreviousPage: true,
    });
  });

  it('should handle empty array', () => {
    const emptyPage = paginatePosts([], 1, 5);
    expect(emptyPage).toEqual({
      items: [],
      currentPage: 1,
      totalPages: 0,
      totalItems: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  it('should return correct total pages even if items length is a multiple of perPage', () => {
    const items = Array.from({ length: 9 }, (_, i) => `Item ${i + 1}`);
    const page3 = paginatePosts(items, 3, 3);
    expect(page3.totalPages).toBe(3);
    expect(page3.hasNextPage).toBe(false);
  });
});

describe('calculateReadingTime', () => {
  it('should calculate reading time for a short content', () => {
    const content = 'This is a short sentence.';
    const result = calculateReadingTime(content);
    expect(result.text).toMatch(/1 min read/);
    expect(result.minutes).toBe(1);
  });

  it('should calculate reading time for a longer content', () => {
    const longContent = 'word '.repeat(300); // 300 words
    const result = calculateReadingTime(longContent);
    expect(result.text).toMatch(/2 min read/); // Assuming 200 words per minute
    expect(result.minutes).toBe(2);
  });

  it('should handle empty content', () => {
    const content = '';
    const result = calculateReadingTime(content);
    expect(result.text).toMatch(/0 min read/);
    expect(result.minutes).toBe(0);
  });
});

describe('parseFrontmatter', () => {
  it('should parse frontmatter and content correctly', () => {
    const mdxContent = `---
title: My Title
date: 2025-01-01
---
# Hello World\nThis is some content.\n`;
    const result = parseFrontmatter(mdxContent);
    expect(result.data.title).toBe('My Title');
    expect(result.data.date).toEqual(new Date('2025-01-01T00:00:00.000Z'));
    expect(result.content.trim()).toBe('# Hello World\nThis is some content.');
  });

  it('should handle content without frontmatter', () => {
    const mdxContent = '# Just content\nNo frontmatter here.';
    const result = parseFrontmatter(mdxContent);
    expect(result.data).toEqual({});
    expect(result.content.trim()).toBe('# Just content\nNo frontmatter here.');
  });

  it('should handle empty content', () => {
    const mdxContent = '';
    const result = parseFrontmatter(mdxContent);
    expect(result.data).toEqual({});
    expect(result.content.trim()).toBe('');
  });
});

describe('getAdjacentPosts', () => {
  it('should return null for prev if current post is the first', () => {
    const { prev, next } = getAdjacentPosts(mockPosts, 'post-d'); // 'post-d' is newest
    expect(prev).toBeNull();
    expect(next).toEqual(mockPosts[0]); // 'post-a' is next oldest
  });

  it('should return null for next if current post is the last', () => {
    const { prev, next } = getAdjacentPosts(mockPosts, 'post-b'); // 'post-b' is oldest
    expect(prev).toEqual(mockPosts[2]); // 'post-c' is next newest
    expect(next).toBeNull();
  });

  it('should return previous and next posts correctly', () => {
    const { prev, next } = getAdjacentPosts(mockPosts, 'post-a'); // 'post-a' is in middle
    expect(prev).toEqual(mockPosts[3]); // 'post-d'
    expect(next).toEqual(mockPosts[2]); // 'post-c'
  });

  it('should return null for both if only one post exists', () => {
    const singlePost: BlogPostMeta[] = [mockPosts[0]];
    const { prev, next } = getAdjacentPosts(singlePost, 'post-a');
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });

  it('should return null for both if current post is not found', () => {
    const { prev, next } = getAdjacentPosts(mockPosts, 'non-existent-post');
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});
