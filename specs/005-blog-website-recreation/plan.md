# Implementation Plan: Blog Website Recreation

**Branch**: `005-blog-website-recreation` | **Date**: 2026-01-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-blog-website-recreation/spec.md`

## Summary

Recreate jamesacres.co.uk blog website using the bubblyclouds-app monorepo structure. Creates a reusable `@bubblyclouds-app/blog` package (L1) with blog components and utilities, plus an `apps/jamesacres` application consuming it. Uses `next-mdx-remote` for MDX rendering, keeping markdown files exactly as-is. No authentication required.

## Technical Context

**Language/Version**: TypeScript 5, React 19, Next.js 16
**Primary Dependencies**: next-mdx-remote, gray-matter, reading-time, github-slugger, remark-gfm, rehype-prism-plus
**Storage**: Static MDX files in `data/`, images in `public/`
**Testing**: Jest + React Testing Library
**Target Platform**: Web only
**Project Type**: Turborepo monorepo
**Package Boundaries**: New `@bubblyclouds-app/blog` package (L1), new `apps/jamesacres` app (L6)
**Performance Goals**: <3s page load, static generation for all pages
**Constraints**: Keep markdown files unchanged, minimal dependencies
**Scale/Scope**: 17 blog posts, 5 projects, 1 author

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First Development | PASS | Tests required for utilities and components |
| II. Full TypeScript Type Safety | PASS | All types defined in contracts |
| III. Modular Package Architecture | PASS | Package (L1) + App (L6), follows dependency rules |
| IV. Multi-Platform Compatibility | N/A | Web only, no Capacitor/Electron |
| V. User-Centric Design & Accessibility | PASS | WCAG 2.1 AA, keyboard nav, dark mode |

**Package Dependency Compliance**:
- `@bubblyclouds-app/blog` depends on: `@types` (L0) only - VALID (L1 → L0)
- `apps/jamesacres` depends on: `@blog` (L1), `@ui` (L1), `@types` (L0) - VALID (L6 → L1, L0)
- No circular dependencies introduced

## Project Structure

### Documentation (this feature)

```
specs/005-blog-website-recreation/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Research findings
├── data-model.md        # Entity definitions
├── quickstart.md        # Development guide
├── contracts/           # API contracts
│   └── blog-utilities.ts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```
packages/blog/                          # @bubblyclouds-app/blog (L1)
├── src/
│   ├── components/
│   │   ├── BlogHeader.tsx
│   │   ├── BlogHeader.test.tsx
│   │   ├── BlogFooter.tsx
│   │   ├── BlogFooter.test.tsx
│   │   ├── PostList.tsx
│   │   ├── PostList.test.tsx
│   │   ├── PostLayout.tsx
│   │   ├── PostLayout.test.tsx
│   │   ├── Pagination.tsx
│   │   ├── Pagination.test.tsx
│   │   ├── Tag.tsx
│   │   ├── Tag.test.tsx
│   │   ├── TagList.tsx
│   │   ├── TagList.test.tsx
│   │   ├── Card.tsx
│   │   ├── Card.test.tsx
│   │   └── MDXComponents.tsx
│   ├── helpers/
│   │   ├── blogUtils.ts
│   │   ├── blogUtils.test.ts
│   │   ├── dateUtils.ts
│   │   ├── dateUtils.test.ts
│   │   ├── tagUtils.ts
│   │   └── tagUtils.test.ts
│   ├── types/
│   │   ├── blogTypes.ts
│   │   ├── authorTypes.ts
│   │   ├── siteTypes.ts
│   │   └── componentProps.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md

apps/jamesacres/                        # Blog application (L6)
├── data/
│   ├── blog/                           # Copy from jamesacres-blog-nextjs
│   │   └── YYYY/MM/DD/*.mdx
│   ├── authors/
│   │   └── default.mdx
│   ├── siteMetadata.ts
│   ├── headerNavLinks.ts
│   └── projectsData.ts
├── public/
│   ├── content/images/                 # Copy from jamesacres-blog-nextjs
│   └── static/images/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Homepage
│   │   ├── providers.tsx
│   │   ├── globals.css
│   │   ├── blog/
│   │   │   ├── page.tsx                # /blog
│   │   │   └── page/[page]/page.tsx    # /blog/page/2
│   │   ├── tags/
│   │   │   ├── page.tsx                # /tags
│   │   │   └── [tag]/page.tsx          # /tags/[tag]
│   │   ├── projects/page.tsx           # /projects
│   │   ├── about/page.tsx              # /about
│   │   ├── [...slug]/page.tsx          # Blog posts at root
│   │   └── feed.xml/route.ts           # RSS feed
│   └── lib/
│       ├── posts.ts                    # Data loading functions
│       └── authors.ts
├── package.json
├── tsconfig.json
├── next.config.mjs
└── postcss.config.js
```

**Structure Decision**: Turborepo monorepo with new package at L1 (Foundation Layer alongside @ui) and new app at L6 (Application Layer). Package provides reusable blog components/utilities; app provides data loading and Next.js pages. This enables future blog apps to reuse the package.

## Implementation Phases

### Phase 1: Package Setup

1. Create `packages/blog/package.json` with dependencies
2. Create `packages/blog/tsconfig.json` extending root
3. Add `@bubblyclouds-app/blog` path to root `tsconfig.json`
4. Create package directory structure

### Phase 2: Package Types

5. Create `src/types/blogTypes.ts` - BlogPost, ReadingTime interfaces
6. Create `src/types/authorTypes.ts` - Author interface
7. Create `src/types/siteTypes.ts` - SiteMetadata, NavLink, Project interfaces
8. Create `src/types/componentProps.ts` - Component prop interfaces

### Phase 3: Package Helpers

9. Create `src/helpers/dateUtils.ts` + tests - formatDate, formatDateWithDay
10. Create `src/helpers/tagUtils.ts` + tests - slugifyTag, getTagCounts
11. Create `src/helpers/blogUtils.ts` + tests - sortPosts, filterDrafts, paginate, readingTime

### Phase 4: Package Components

12. Create `src/components/Tag.tsx` + test
13. Create `src/components/TagList.tsx` + test
14. Create `src/components/Card.tsx` + test
15. Create `src/components/Pagination.tsx` + test
16. Create `src/components/PostList.tsx` + test
17. Create `src/components/PostLayout.tsx` + test
18. Create `src/components/BlogHeader.tsx` + test
19. Create `src/components/BlogFooter.tsx` + test
20. Create `src/components/MDXComponents.tsx`
21. Create `src/index.ts` with exports
22. Create `packages/blog/README.md`

### Phase 5: App Setup

23. Create `apps/jamesacres/package.json` with dependencies
24. Create `apps/jamesacres/tsconfig.json`
25. Create `apps/jamesacres/next.config.mjs`
26. Create `apps/jamesacres/postcss.config.js`
27. Update root `turbo.json` for new app scripts
28. Update root `package.json` for dev:jamesacres script

### Phase 6: App Data

29. Copy `data/blog/` from jamesacres-blog-nextjs (unchanged)
30. Copy `data/authors/` from jamesacres-blog-nextjs (unchanged)
31. Create `data/siteMetadata.ts` with types
32. Copy `data/headerNavLinks.ts`
33. Copy `data/projectsData.ts`
34. Copy `public/content/images/` (unchanged)
35. Copy `public/static/images/` (unchanged)

### Phase 7: App Library

36. Create `src/lib/posts.ts` - getAllPosts, getPostBySlug
37. Create `src/lib/authors.ts` - getAuthor

### Phase 8: App Layout

38. Create `src/app/globals.css` with Tailwind + Prism styles
39. Create `src/app/providers.tsx` - ThemeProvider wrapper
40. Create `src/app/layout.tsx` - Root layout with header/footer

### Phase 9: App Pages

41. Create `src/app/page.tsx` - Homepage
42. Create `src/app/blog/page.tsx` - Blog listing page 1
43. Create `src/app/blog/page/[page]/page.tsx` - Blog pagination
44. Create `src/app/[...slug]/page.tsx` - Blog post pages
45. Create `src/app/tags/page.tsx` - All tags
46. Create `src/app/tags/[tag]/page.tsx` - Posts by tag
47. Create `src/app/projects/page.tsx` - Projects grid
48. Create `src/app/about/page.tsx` - About page
49. Create `src/app/feed.xml/route.ts` - RSS feed

### Phase 10: Verification

50. Run `pnpm install` to link packages
51. Run `pnpm run dev:jamesacres` - verify dev server
52. Run `pnpm run build` - verify build
53. Run `pnpm run test` - verify tests pass
54. Run `pnpm run lint:fix` - fix lint issues
55. Run `pnpm run type-check` - verify types
56. Run `pnpm run circular` - verify no circular deps
57. Manual testing of all pages and features

## Complexity Tracking

*No constitution violations requiring justification*

| Aspect | Complexity | Justification |
|--------|------------|---------------|
| New Package | Necessary | Multiple blog apps will reuse (user confirmed) |
| MDX Processing | Standard | next-mdx-remote is well-supported |
| Catch-all Routing | Standard | Required for date-based URLs at root |

## Key Files Summary

| File | Purpose | Priority |
|------|---------|----------|
| `packages/blog/src/helpers/blogUtils.ts` | Core blog utilities | P1 |
| `packages/blog/src/types/blogTypes.ts` | Type definitions | P1 |
| `packages/blog/src/components/PostList.tsx` | Post listing component | P1 |
| `apps/jamesacres/src/lib/posts.ts` | Data loading | P1 |
| `apps/jamesacres/src/app/[...slug]/page.tsx` | Blog post routing | P1 |
| `apps/jamesacres/src/app/layout.tsx` | Root layout | P1 |
