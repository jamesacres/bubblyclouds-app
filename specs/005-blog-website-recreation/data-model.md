# Data Model: Blog Website Recreation

**Branch**: `005-blog-website-recreation`
**Date**: 2026-01-25

## Entities

### BlogPost

Represents a blog article parsed from MDX files.

```typescript
interface BlogPost {
  // Identity
  slug: string;              // URL path (e.g., "2025/05/coding-with-serena")
  filePath: string;          // Relative path to MDX file

  // Frontmatter (from YAML)
  title: string;
  date: string;              // ISO date string (YYYY-MM-DD)
  lastmod?: string;          // ISO date string
  tags: string[];
  draft: boolean;
  summary?: string;
  authors: string[];         // Author references (e.g., ['default'])
  images?: string[];         // Featured images paths
  layout?: string;
  canonicalUrl?: string;

  // Computed
  readingTime: ReadingTime;

  // Content (loaded separately for performance)
  content?: string;          // Raw MDX content (without frontmatter)
}

interface ReadingTime {
  text: string;              // "4 min read"
  minutes: number;
  words: number;
}
```

**Validation Rules**:
- `title` is required
- `date` must be valid ISO date
- `tags` defaults to empty array
- `draft` defaults to false
- `authors` defaults to ['default']

### Author

Represents a content author parsed from MDX files in `/data/authors/`.

```typescript
interface Author {
  // Identity
  slug: string;              // Filename without extension (e.g., "default")

  // Frontmatter
  name: string;
  avatar?: string;           // Path to avatar image
  occupation?: string;
  company?: string;
  email?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  layout?: string;

  // Content
  bio?: string;              // MDX content (rendered for about page)
}
```

**Validation Rules**:
- `name` is required
- Other fields are optional

### Project

Represents a portfolio project for the projects page.

```typescript
interface Project {
  title: string;
  description: string;
  imgSrc?: string;           // Project image path
  href?: string;             // External link to project
}
```

### SiteMetadata

Global site configuration.

```typescript
interface SiteMetadata {
  title: string;
  author: string;
  headerTitle?: string;
  description: string;
  language: string;          // e.g., "en-gb"
  theme: 'system' | 'dark' | 'light';
  siteUrl: string;
  siteRepo?: string;
  siteLogo?: string;
  socialBanner?: string;
  email?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  locale: string;            // e.g., "en-GB"
}
```

### NavLink

Navigation link for header.

```typescript
interface NavLink {
  href: string;
  title: string;
}
```

### Tag

Computed from posts, not stored.

```typescript
interface TagCount {
  tag: string;               // Normalized tag slug
  displayName: string;       // Original tag name
  count: number;             // Number of posts with this tag
}
```

### PaginatedResult

Result of paginating posts.

```typescript
interface PaginatedResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

## Relationships

```
┌─────────────┐       ┌─────────────┐
│  BlogPost   │──────>│   Author    │
│             │ N:M   │             │
│ authors[]   │       │ slug        │
└─────────────┘       └─────────────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│    Tag      │
│ (computed)  │
└─────────────┘
```

- A BlogPost references Authors by slug (stored in `authors[]` array)
- A BlogPost has multiple Tags (stored in `tags[]` array)
- Tags and their counts are computed from all posts at runtime

## File System Mapping

```
data/
├── blog/
│   └── YYYY/MM/DD/slug.mdx     → BlogPost
├── authors/
│   └── {slug}.mdx              → Author
├── siteMetadata.ts             → SiteMetadata
├── headerNavLinks.ts           → NavLink[]
└── projectsData.ts             → Project[]

public/
├── content/images/             → BlogPost.images, Author.avatar
└── static/images/              → SiteMetadata.siteLogo, socialBanner
```

## State Transitions

### BlogPost.draft

```
┌──────────┐     publish      ┌───────────┐
│  draft   │ ────────────────>│ published │
│ (true)   │                  │ (false)   │
└──────────┘                  └───────────┘
```

- Draft posts are excluded from listings, RSS, and sitemap
- Draft status is controlled by frontmatter `draft: true/false`
- Only file edit can change draft status (no runtime state)

## Caching Strategy

Since all data is static MDX files:
- Posts are read at build time via `generateStaticParams`
- No runtime caching needed for static export
- Development mode re-reads files on each request (Next.js handles this)

## Package vs App Data Ownership

| Entity | Defined In | Loaded In | Provided To Components Via |
|--------|------------|-----------|----------------------------|
| BlogPost (type) | `@blog/types` | App | Props |
| BlogPost (data) | App `/data/blog/` | App | Props |
| Author (type) | `@blog/types` | App | Props |
| Author (data) | App `/data/authors/` | App | Props |
| SiteMetadata | `@blog/types` + App | App | Props/Context |
| Project | `@blog/types` + App | App | Props |
| NavLink | `@blog/types` + App | App | Props |
