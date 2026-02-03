# Quickstart: Blog Website Recreation

**Branch**: `005-blog-website-recreation`
**Date**: 2026-01-25

## Prerequisites

- Node.js 24+
- pnpm 10+
- Repository cloned and dependencies installed (`pnpm install`)

## Quick Test After Implementation

### 1. Start Development Server

```bash
# From repo root
pnpm run dev:jamesacres
```

### 2. Verify Core Pages

| URL | Expected Result |
|-----|-----------------|
| http://localhost:3000 | Homepage with author intro + 5 recent posts |
| http://localhost:3000/blog | Blog listing with pagination |
| http://localhost:3000/tags | All tags with post counts |
| http://localhost:3000/projects | Project cards grid |
| http://localhost:3000/about | Author bio page |
| http://localhost:3000/2025/05/coding-with-serena-and-claude-desktop-via-mcp | Individual blog post |
| http://localhost:3000/feed.xml | RSS feed |

### 3. Verify Theme Toggle

1. Click the sun/moon icon in header
2. Theme should switch between light and dark
3. Preference should persist on page reload

### 4. Verify Blog Post Rendering

Open any blog post and check:
- [ ] Title and date display correctly
- [ ] Author avatar and name shown
- [ ] Reading time displayed
- [ ] Markdown renders correctly (headers, lists, links)
- [ ] Code blocks have syntax highlighting
- [ ] Images display with captions
- [ ] Tags link to tag pages
- [ ] Previous Article navigation works

### 5. Run Build & Tests

```bash
# From repo root
pnpm run build
pnpm run test
pnpm run lint:fix
pnpm run type-check
```

All commands should complete without errors.

## Development Commands

```bash
# Run jamesacres app in dev mode
pnpm run dev:jamesacres

# Build jamesacres app
pnpm run build:jamesacres

# Run all tests
pnpm run test

# Run tests for blog package only
pnpm --filter @bubblyclouds-app/blog test

# Type check all packages
pnpm run type-check

# Fix linting issues
pnpm run lint:fix

# Check for circular dependencies
pnpm run circular
```

## File Locations

### Package (`@bubblyclouds-app/blog`)
```
packages/blog/
├── src/
│   ├── components/     # Reusable blog components
│   ├── helpers/        # Utility functions
│   └── types/          # TypeScript interfaces
├── package.json
└── README.md
```

### App (`apps/jamesacres`)
```
apps/jamesacres/
├── data/
│   ├── blog/           # MDX blog posts
│   ├── authors/        # Author MDX files
│   ├── siteMetadata.ts
│   ├── headerNavLinks.ts
│   └── projectsData.ts
├── public/
│   ├── content/images/ # Blog images
│   └── static/images/  # Static assets
└── src/
    ├── app/            # Next.js pages
    └── lib/            # App-specific utilities
```

## Adding a New Blog Post

1. Create MDX file in `apps/jamesacres/data/blog/YYYY/MM/DD/slug.mdx`
2. Add frontmatter:
   ```yaml
   ---
   title: 'Post Title'
   date: 'YYYY-MM-DD'
   tags: ['tag1', 'tag2']
   summary: 'Brief summary'
   authors: ['default']
   ---
   ```
3. Write content in Markdown below frontmatter
4. Post automatically appears in listings (unless `draft: true`)

## Troubleshooting

### MDX Not Rendering
- Check frontmatter YAML syntax
- Ensure `gray-matter` is parsing correctly
- Check browser console for errors

### Images Not Loading
- Verify image path starts with `/content/images/`
- Check file exists in `public/content/images/`

### Theme Not Persisting
- Clear localStorage and try again
- Check `next-themes` provider is wrapping app

### Build Errors
- Run `pnpm run type-check` to find type issues
- Run `pnpm run lint:fix` to auto-fix lint errors
- Check `pnpm run circular` for dependency issues
