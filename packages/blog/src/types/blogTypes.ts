// Identity
export interface ReadingTime {
  text: string; // "4 min read"
  minutes: number;
  words: number;
}

export interface BlogPostMeta {
  slug: string; // URL path (e.g., "2025/05/coding-with-serena")
  filePath: string; // Relative path to MDX file

  // Frontmatter (from YAML)
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  lastmod?: string; // ISO date string
  tags: string[];
  draft: boolean;
  summary?: string;
  authors: string[]; // Author references (e.g., ['default'])
  images?: string[]; // Featured images paths
  layout?: string;
  canonicalUrl?: string;

  // Added based on usage in PostList.tsx
  imgSrc?: string; // Optional image source path

  // Computed
  readingTime: ReadingTime;
}

export interface BlogPost extends BlogPostMeta {
  // Content (loaded separately for performance)
  content: string; // Raw MDX content (without frontmatter)
}
