import { BlogPostMeta, ReadingTime } from '../types/blogTypes';
import { PaginatedResult } from '../types/tagTypes';
import matter from 'gray-matter';
import readingTime from 'reading-time';

export function sortPostsByDate(posts: BlogPostMeta[]): BlogPostMeta[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function filterDraftPosts(posts: BlogPostMeta[]): BlogPostMeta[] {
  return posts.filter((post) => !post.draft);
}

export function paginatePosts<T>(
  items: T[],
  page: number,
  perPage: number
): PaginatedResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const offset = (page - 1) * perPage;
  const paginatedItems = items.slice(offset, offset + perPage);

  return {
    items: paginatedItems,
    currentPage: page,
    totalPages,
    totalItems,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export function calculateReadingTime(content: string): ReadingTime {
  const stats = readingTime(content);
  return {
    text: stats.text,
    minutes: Math.ceil(stats.minutes),
    words: stats.words,
  };
}

export function parseFrontmatter(fileContent: string): {
  data: Record<string, unknown>;
  content: string;
} {
  const { data, content } = matter(fileContent);
  return { data, content };
}

export function getAdjacentPosts(
  posts: BlogPostMeta[],
  currentSlug: string
): { prev: BlogPostMeta | null; next: BlogPostMeta | null } {
  const sortedPosts = sortPostsByDate(posts);
  const currentIndex = sortedPosts.findIndex(
    (post) => post.slug === currentSlug
  );

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  // In descending date order: prev = older post (index + 1), next = newer post (index - 1)
  const prev =
    currentIndex < sortedPosts.length - 1
      ? sortedPosts[currentIndex + 1]
      : null;
  const next = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;

  return { prev, next };
}
