# Research: Blog Website Recreation

**Branch**: `005-blog-website-recreation`
**Date**: 2026-01-25

## Research Topics

### 1. Package vs App Decision (ARCHITECTURE.md Compliance)

**Decision**: Create BOTH `packages/blog` AND `apps/jamesacres`

**Rationale**:
User has confirmed another blog app will be added after this one. Per ARCHITECTURE.md Decision Tree:
- "Reusable?" → goes in `packages/` directory
- Blog components, utilities, and types are reusable across multiple blog apps

**Architecture**:
- `@bubblyclouds-app/blog` (L1) - Reusable blog package containing:
  - Blog components (PostList, Pagination, Tag, Card, etc.)
  - Blog utilities (MDX processing, post loading, tag utilities)
  - Blog types (BlogPost, Author, SiteMetadata interfaces)

- `apps/jamesacres` (L6) - First blog app containing:
  - App-specific data (blog posts, images, authors)
  - App-specific configuration (siteMetadata)
  - Next.js pages consuming `@blog` components

**Layer Placement**:
`@bubblyclouds-app/blog` fits at L1 (Foundation Layer) alongside `@ui`:
- Has no dependencies on higher layers (auth, template, games, sudoku)
- Depends only on `@types` and `@ui` (for theme support)
- Can be consumed by any app

```
L6: apps/jamesacres, apps/[future-blog]
         ↓
L1: @blog, @ui
         ↓
L0: @types
```

### 2. MDX Processing Without Contentlayer

**Decision**: Use `next-mdx-remote` + `gray-matter`

**Rationale**:
- `next-mdx-remote` provides server-side MDX compilation in Next.js 16 App Router
- `gray-matter` parses YAML frontmatter from MDX files
- No build-time code generation (simpler than Contentlayer)
- Supports all required remark/rehype plugins
- Minimal dependency footprint

**Alternatives Considered**:
- Contentlayer - Rejected: abandoned project, complex setup, unnecessary build step
- @next/mdx - Rejected: doesn't support frontmatter parsing
- mdx-bundler - Rejected: more complex, unnecessary features

### 3. Required Dependencies (Minimal Set)

**Decision**: Split dependencies between package and app

**Package (`@bubblyclouds-app/blog`) dependencies**:
```
- gray-matter: ^4.0.3 (frontmatter parsing)
- reading-time: ^1.5.0 (read time calculation)
- github-slugger: ^2.0.0 (tag slugification)
```

**App (`apps/jamesacres`) dependencies**:
```
- @bubblyclouds-app/blog: workspace:*
- @bubblyclouds-app/types: workspace:*
- @bubblyclouds-app/ui: workspace:*
- next: ^16.1.1
- next-mdx-remote: ^5.0.0 (MDX compilation - app handles rendering)
- next-themes: ^0.4.6
- react: ^19.2.3
- react-dom: ^19.2.3
- react-feather: ^2.0.10
- remark-gfm: ^4.0.0
- rehype-slug: ^6.0.0
- rehype-prism-plus: ^2.0.0
```

**Rationale**:
- Package contains pure utilities and types (no React/Next.js coupling for utilities)
- App handles MDX rendering (next-mdx-remote is Next.js specific)
- Remark/rehype plugins stay in app (rendering concern)

### 4. Existing UI Components Reusability

**Decision**: Reuse `@bubblyclouds-app/ui` ThemeSwitch, create blog-specific components in `@blog` package

**Rationale**:
After reviewing existing `@bubblyclouds-app/ui` components:
- `ThemeSwitch` - CAN be reused (Capacitor code is conditional, works on web)
- `Footer` - Fixed bottom nav (app-style) - create blog-specific version in `@blog`
- `Header` - App-style header - create blog-specific version in `@blog`

**Components in `@bubblyclouds-app/blog` package**:
- `BlogHeader.tsx` - Blog navigation (configurable links)
- `BlogFooter.tsx` - Traditional website footer with social links
- `PostList.tsx` - List of blog post previews
- `PostLayout.tsx` - Single post layout wrapper
- `Pagination.tsx` - Page navigation
- `Tag.tsx` - Tag link component
- `Card.tsx` - Project/content card
- `MDXComponents.tsx` - Custom MDX component mappings

### 5. URL Routing Strategy

**Decision**: Use Next.js catch-all route `[...slug]` at root level

**Rationale**:
- Blog posts need URLs like `/2025/05/slug` (at root, not under /blog)
- Catch-all `app/[...slug]/page.tsx` handles variable path depth
- Explicit routes (`/blog`, `/tags`, `/projects`, `/about`) take precedence
- `generateStaticParams` enables static generation of all posts

**Route Structure** (in each blog app):
```
app/
├── page.tsx              → /
├── blog/page.tsx         → /blog
├── blog/page/[page]/     → /blog/page/2, /blog/page/3
├── tags/page.tsx         → /tags
├── tags/[tag]/page.tsx   → /tags/retrospect
├── projects/page.tsx     → /projects
├── about/page.tsx        → /about
├── feed.xml/route.ts     → /feed.xml
└── [...slug]/page.tsx    → /2025/05/slug (catch-all for posts)
```

### 6. Data File Strategy

**Decision**: Copy data files unchanged to app, convert JS to TS where beneficial

**Rationale**:
- MDX blog posts: Copy exactly as-is (no content changes)
- Author MDX files: Copy exactly as-is
- Images: Copy exactly as-is
- siteMetadata.js → siteMetadata.ts (add types from `@blog` package)
- projectsData.ts: Already TypeScript, copy as-is
- headerNavLinks.ts: Already TypeScript, copy as-is

### 7. Package/App Boundary Design

**Decision**: Package provides utilities and components, app provides data and configuration

**Package (`@bubblyclouds-app/blog`) provides**:
```typescript
// Types
export interface BlogPost { ... }
export interface Author { ... }
export interface SiteMetadata { ... }
export interface Project { ... }

// Utilities (pure functions, no file system access)
export function sortPostsByDate(posts: BlogPost[]): BlogPost[]
export function filterDraftPosts(posts: BlogPost[]): BlogPost[]
export function getTagCounts(posts: BlogPost[]): Record<string, number>
export function paginatePosts(posts: BlogPost[], page: number, perPage: number): PaginatedResult
export function calculateReadingTime(content: string): ReadingTime
export function formatDate(date: string, format?: string): string

// Components (React, reusable)
export function BlogHeader({ links, siteTitle }: BlogHeaderProps)
export function BlogFooter({ social, copyright }: BlogFooterProps)
export function PostList({ posts }: PostListProps)
export function Pagination({ currentPage, totalPages }: PaginationProps)
export function Tag({ tag, count }: TagProps)
```

**App (`apps/jamesacres`) provides**:
```typescript
// Data loading (file system access, app-specific)
export async function getAllPosts(): Promise<BlogPost[]>
export async function getPostBySlug(slug: string): Promise<BlogPost | null>
export async function getAuthor(name: string): Promise<Author | null>

// Configuration (app-specific)
export const siteMetadata: SiteMetadata = { ... }
export const headerNavLinks: NavLink[] = [ ... ]
export const projectsData: Project[] = [ ... ]

// Pages (Next.js App Router)
// Uses @blog components with app-specific data
```

**Rationale**:
- Package has no file system dependencies (portable, testable)
- App handles data loading (Next.js specific, file paths vary per app)
- Components receive data as props (dependency injection)
- Second blog app can reuse all components/utilities, just provide its own data

## Summary

| Topic | Decision |
|-------|----------|
| Architecture | Package (`@blog` L1) + App (`apps/jamesacres` L6) |
| MDX Processing | `next-mdx-remote` + `gray-matter` |
| UI Components | Reuse `@ui` ThemeSwitch, create blog components in `@blog` |
| Package Dependencies | `@blog` → `@types`, `@ui` |
| App Dependencies | `apps/jamesacres` → `@blog`, `@types`, `@ui` |
| URL Routing | Catch-all `[...slug]` for posts at root level |
| Data Migration | Copy unchanged to app, convert siteMetadata to TS |
| Reusability | Package provides components/utilities, app provides data/config |
