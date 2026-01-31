import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { BlogPost, BlogPostMeta } from '@bubblyclouds-app/blog/types/blogTypes';
import {
  calculateReadingTime,
  sortPostsByDate,
  filterDraftPosts,
} from '@bubblyclouds-app/blog/helpers/blogUtils';

export const POSTS_PER_PAGE = 5;

const POSTS_DIRECTORY = path.join(process.cwd(), 'data', 'blog');

function getMdxFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getMdxFiles(fullPath));
    } else if (item.name.endsWith('.mdx') || item.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function getSlugFromPath(filePath: string): string {
  const relativePath = path.relative(POSTS_DIRECTORY, filePath);
  const slug = relativePath
    .replace(/\.(mdx|md)$/, '')
    .split(path.sep)
    .join('/');
  return slug;
}

interface Frontmatter {
  title: string;
  date: string;
  lastmod?: string;
  tags?: string[];
  draft?: boolean;
  summary?: string;
  authors?: string[];
  images?: string[];
}

function parsePost(filePath: string): BlogPost {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const frontmatter = data as Frontmatter;

  const slug = getSlugFromPath(filePath);
  const readingTime = calculateReadingTime(content);

  return {
    slug,
    filePath: path.relative(process.cwd(), filePath),
    title: frontmatter.title || 'Untitled',
    date: frontmatter.date || new Date().toISOString().split('T')[0],
    lastmod: frontmatter.lastmod,
    tags: frontmatter.tags || [],
    draft: frontmatter.draft || false,
    summary: frontmatter.summary || '',
    authors: frontmatter.authors || ['default'],
    images: frontmatter.images,
    readingTime,
    content,
  };
}

let cachedPosts: BlogPost[] | null = null;

function loadAllPosts(): BlogPost[] {
  if (cachedPosts) {
    return cachedPosts;
  }

  const mdxFiles = getMdxFiles(POSTS_DIRECTORY);
  cachedPosts = mdxFiles.map(parsePost);
  return cachedPosts;
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const posts = loadAllPosts();
  const filteredPosts = filterDraftPosts(posts);
  return sortPostsByDate(filteredPosts);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = loadAllPosts();
  const post = posts.find((p) => p.slug === slug);
  return post || null;
}

export async function getAllSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map((post) => post.slug);
}
