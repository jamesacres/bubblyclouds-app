import { BlogPostMeta } from '../types/blogTypes';
import { TagCount } from '../types/tagTypes';
import Slugger from 'github-slugger';

const slugger = new Slugger();

export function slugifyTag(tag: string): string {
  return slugger.slug(tag);
}

export function getTagCounts(posts: BlogPostMeta[]): TagCount[] {
  const tagCounts: { [key: string]: number } = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const slug = slugifyTag(tag);
      tagCounts[slug] = (tagCounts[slug] || 0) + 1;
    });
  });

  return Object.keys(tagCounts).map((tag) => ({
    tag: tag,
    displayName: tag, // For now, display name is the same as slug
    count: tagCounts[tag],
  }));
}
