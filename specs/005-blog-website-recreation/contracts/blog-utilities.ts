/**
 * Blog Package Utilities Contract
 *
 * This file defines the public API contract for @bubblyclouds-app/blog utilities.
 * All functions are pure (no side effects, no file system access).
 */

// =============================================================================
// Types (from @bubblyclouds-app/blog/types)
// =============================================================================

export interface ReadingTime {
  text: string; // "4 min read"
  minutes: number;
  words: number;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  lastmod?: string;
  tags: string[];
  draft: boolean;
  summary?: string;
  authors: string[];
  images?: string[];
  readingTime: ReadingTime;
}

export interface BlogPost extends BlogPostMeta {
  content: string; // Raw MDX content
}

export interface Author {
  slug: string;
  name: string;
  avatar?: string;
  occupation?: string;
  company?: string;
  email?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  bio?: string;
}

export interface Project {
  title: string;
  description: string;
  imgSrc?: string;
  href?: string;
}

export interface SiteMetadata {
  title: string;
  author: string;
  headerTitle?: string;
  description: string;
  language: string;
  theme: 'system' | 'dark' | 'light';
  siteUrl: string;
  siteRepo?: string;
  siteLogo?: string;
  socialBanner?: string;
  email?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  locale: string;
}

export interface NavLink {
  href: string;
  title: string;
}

export interface TagCount {
  tag: string;
  displayName: string;
  count: number;
}

export interface PaginatedResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// =============================================================================
// Utility Functions (from @bubblyclouds-app/blog/helpers)
// =============================================================================

/**
 * Sort posts by date (newest first)
 */
export function sortPostsByDate(posts: BlogPostMeta[]): BlogPostMeta[];

/**
 * Filter out draft posts
 */
export function filterDraftPosts(posts: BlogPostMeta[]): BlogPostMeta[];

/**
 * Get tag counts from posts
 */
export function getTagCounts(posts: BlogPostMeta[]): TagCount[];

/**
 * Filter posts by tag
 */
export function filterPostsByTag(posts: BlogPostMeta[], tag: string): BlogPostMeta[];

/**
 * Paginate posts
 */
export function paginatePosts<T>(
  items: T[],
  page: number,
  perPage: number
): PaginatedResult<T>;

/**
 * Calculate reading time from content
 */
export function calculateReadingTime(content: string): ReadingTime;

/**
 * Format date for display
 */
export function formatDate(date: string, locale?: string): string;

/**
 * Format date with day of week (e.g., "Sunday 4 May 2025")
 */
export function formatDateWithDay(date: string, locale?: string): string;

/**
 * Parse frontmatter from MDX content
 * Returns { data: frontmatter, content: mdxContent }
 */
export function parseFrontmatter(
  fileContent: string
): { data: Record<string, unknown>; content: string };

/**
 * Slugify a tag name for URL use
 */
export function slugifyTag(tag: string): string;

/**
 * Get previous and next posts for navigation
 */
export function getAdjacentPosts(
  posts: BlogPostMeta[],
  currentSlug: string
): { prev: BlogPostMeta | null; next: BlogPostMeta | null };

// =============================================================================
// Component Props (from @bubblyclouds-app/blog/components)
// =============================================================================

export interface BlogHeaderProps {
  links: NavLink[];
  siteTitle: string;
  siteLogo?: string;
}

export interface BlogFooterProps {
  author: string;
  github?: string;
  linkedin?: string;
  email?: string;
  siteUrl: string;
}

export interface PostListProps {
  posts: BlogPostMeta[];
  showImages?: boolean;
}

export interface PostLayoutProps {
  post: BlogPost;
  authors: Author[];
  prev: BlogPostMeta | null;
  next: BlogPostMeta | null;
  children: React.ReactNode; // Rendered MDX content
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string; // e.g., "/blog" or "/tags/retrospect"
}

export interface TagProps {
  tag: string;
  count?: number;
}

export interface TagListProps {
  tags: TagCount[];
}

export interface CardProps {
  title: string;
  description: string;
  imgSrc?: string;
  href?: string;
}
