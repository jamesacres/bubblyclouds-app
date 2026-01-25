import { slugifyTag, getTagCounts } from './tagUtils';
import { BlogPostMeta, TagCount } from '../types';

describe('slugifyTag', () => {
  it('should convert a tag name to a slug', () => {
    expect(slugifyTag('Hello World')).toBe('hello-world');
    expect(slugifyTag('Next.js')).toBe('nextjs');
    expect(slugifyTag('C++')).toBe('c');
  });

  it('should handle special characters', () => {
    expect(slugifyTag('Tag with!@# special-chars')).toBe(
      'tag-with-special-chars'
    );
  });

  it('should return empty string for empty input', () => {
    expect(slugifyTag('')).toBe('');
  });
});

describe('getTagCounts', () => {
  const mockPosts: BlogPostMeta[] = [
    {
      slug: 'post-1',
      filePath: 'path/to/post-1.mdx',
      title: 'Post 1',
      date: '2025-01-01',
      tags: ['Next.js', 'TypeScript', 'Tailwind CSS'],
      draft: false,
      authors: ['default'],
      readingTime: { text: '1 min read', minutes: 1, words: 100 },
    },
    {
      slug: 'post-2',
      filePath: 'path/to/post-2.mdx',
      title: 'Post 2',
      date: '2025-01-02',
      tags: ['TypeScript', 'React'],
      draft: false,
      authors: ['default'],
      readingTime: { text: '2 min read', minutes: 2, words: 200 },
    },
    {
      slug: 'post-3',
      filePath: 'path/to/post-3.mdx',
      title: 'Post 3',
      date: '2025-01-03',
      tags: ['Next.js', 'Testing'],
      draft: false,
      authors: ['default'],
      readingTime: { text: '3 min read', minutes: 3, words: 300 },
    },
    {
      slug: 'post-4',
      filePath: 'path/to/post-4.mdx',
      title: 'Post 4',
      date: '2025-01-04',
      tags: ['Next.js', 'Draft'],
      draft: true, // Draft post should still contribute to tag counts if not filtered before
      authors: ['default'],
      readingTime: { text: '1 min read', minutes: 1, words: 100 },
    },
  ];

  it('should return correct tag counts', () => {
    const expectedTagCounts: TagCount[] = [
      { tag: 'nextjs', displayName: 'nextjs', count: 3 },
      { tag: 'typescript', displayName: 'typescript', count: 2 },
      { tag: 'tailwind-css', displayName: 'tailwind-css', count: 1 },
      { tag: 'react', displayName: 'react', count: 1 },
      { tag: 'testing', displayName: 'testing', count: 1 },
      { tag: 'draft', displayName: 'draft', count: 1 },
    ];

    const result = getTagCounts(mockPosts);
    // Sort both arrays for consistent comparison
    result.sort((a, b) => a.tag.localeCompare(b.tag));
    expectedTagCounts.sort((a, b) => a.tag.localeCompare(b.tag));

    expect(result).toEqual(expectedTagCounts);
  });

  it('should return empty array for no posts', () => {
    expect(getTagCounts([])).toEqual([]);
  });

  it('should return empty array for posts with no tags', () => {
    const postsNoTags: BlogPostMeta[] = [
      {
        slug: 'post-5',
        filePath: 'path/to/post-5.mdx',
        title: 'Post 5',
        date: '2025-01-05',
        tags: [],
        draft: false,
        authors: ['default'],
        readingTime: { text: '1 min read', minutes: 1, words: 100 },
      },
    ];
    expect(getTagCounts(postsNoTags)).toEqual([]);
  });
});
