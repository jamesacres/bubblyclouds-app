import { BlogPost, BlogPostMeta } from '@bubblyclouds-app/blog/types/blogTypes';
import {
  calculateReadingTime,
  sortPostsByDate,
  filterDraftPosts,
} from '@bubblyclouds-app/blog/helpers/blogUtils';

export const POSTS_PER_PAGE = 5;

interface MockPostData {
  slug: string;
  filePath: string;
  title: string;
  date: string;
  tags: string[];
  draft: boolean;
  summary: string;
  authors: string[];
  content: string;
}

const mockPostsData: MockPostData[] = [
  {
    slug: '2025/01/20/mock-post-1',
    filePath: 'apps/jamesacres/data/blog/2025/01/20/mock-post-1.mdx',
    title: 'Mock Post One',
    date: '2025-01-20',
    tags: ['mock', 'testing'],
    draft: false,
    summary: 'This is a mock post for testing purposes.',
    authors: ['default'],
    content: '## Hello World\nThis is the content of mock post one.',
  },
  {
    slug: '2025/01/22/mock-post-2',
    filePath: 'apps/jamesacres/data/blog/2025/01/22/mock-post-2.mdx',
    title: 'Mock Post Two',
    date: '2025-01-22',
    tags: ['mock', 'nextjs'],
    draft: false,
    summary: 'Another mock post to test data loading.',
    authors: ['default'],
    content: '## Next.js Goodness\nThis is the content of mock post two.',
  },
  {
    slug: '2025/01/25/mock-post-3-draft',
    filePath: 'apps/jamesacres/data/blog/2025/01/25/mock-post-3-draft.mdx',
    title: 'Mock Post Three (Draft)',
    date: '2025-01-25',
    tags: ['mock', 'draft'],
    draft: true,
    summary: 'A draft mock post that should not be visible.',
    authors: ['default'],
    content: '## Draft Content\nThis post is a draft.',
  },
];

async function getPostData(post: MockPostData): Promise<BlogPost> {
  const readingTimeData = calculateReadingTime(post.content);
  return {
    ...post,
    readingTime: readingTimeData,
  };
}

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const posts = await Promise.all(mockPostsData.map(getPostData));
  return sortPostsByDate(filterDraftPosts(posts));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const postData = mockPostsData.find((post) => post.slug === slug);
  if (!postData) return null;

  // In a real scenario, this would read the MDX file and parse it.
  // For now, we simulate with existing content.
  // const processedContent = await remark().use(html).process(postData.content); // Removed
  // const contentHtml = String(processedContent); // Removed

  return {
    ...postData,
    readingTime: calculateReadingTime(postData.content),
    content: postData.content, // Changed to directly use postData.content
  } as BlogPost;
}
