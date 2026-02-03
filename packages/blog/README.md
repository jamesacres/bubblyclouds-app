# `@bubblyclouds-app/blog`

Reusable blog components, types, and utilities for Next.js applications within the Bubbly Clouds monorepo.

## Installation

This package is part of the Bubbly Clouds monorepo and is typically consumed as a workspace dependency.

```bash
pnpm add @bubblyclouds-app/blog
```

## Usage

### Components

Import and use components directly:

```typescript
import { PostList, BlogHeader, BlogFooter } from '@bubblyclouds-app/blog/components';
// ...
<BlogHeader siteTitle="My Blog" links={[]} />
<PostList posts={myPosts} />
<BlogFooter author="Me" siteUrl="https://example.com" />
```

### Types

Import types for your blog data:

```typescript
import { BlogPost, Author, SiteMetadata } from '@bubblyclouds-app/blog/types';

const myPost: BlogPost = { /* ... */ };
```

### Helpers

Use helper functions for data manipulation:

```typescript
import { sortPostsByDate, calculateReadingTime } from '@bubblyclouds-app/blog/helpers';

const sortedPosts = sortPostsByDate(allPosts);
const readingTime = calculateReadingTime(postContent);
```

## Development

To develop this package, clone the Bubbly Clouds monorepo and follow the instructions in the main `README.md`.

## License

MIT