import { BlogPostMeta } from '../types/blogTypes';
import { TagCount } from '../types/tagTypes';

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getTagCounts(posts: BlogPostMeta[]): TagCount[] {
  const tagCounts: { [key: string]: number } = {};
  const tagDisplayNames: { [key: string]: string } = {};

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const slug = slugifyTag(tag);
      tagCounts[slug] = (tagCounts[slug] || 0) + 1;
      // Store the original tag name for display
      if (!tagDisplayNames[slug]) {
        tagDisplayNames[slug] = tag;
      }
    });
  });

  return Object.keys(tagCounts).map((tag) => ({
    tag: tag,
    displayName: tagDisplayNames[tag],
    count: tagCounts[tag],
  }));
}
