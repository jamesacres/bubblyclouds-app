import { BlogPostMeta } from './blogTypes';
import { Author } from './authorTypes';
import { NavLink, SiteMetadata } from './siteTypes';
import { TagCount } from './tagTypes';
import React from 'react';

export interface BlogHeaderProps {
  siteMetadata: SiteMetadata;
  navLinks: NavLink[];
}

export interface BlogFooterProps {
  author: string;
  github?: string;
  linkedin?: string;
}

export interface PostListProps {
  posts: BlogPostMeta[];
}

export interface PostLayoutProps {
  post: BlogPostMeta & { content: string }; // Assuming content is part of BlogPost and BlogPostMeta is a subset
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
