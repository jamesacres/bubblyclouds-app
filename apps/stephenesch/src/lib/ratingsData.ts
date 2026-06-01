import { BlogPostMeta } from '@bubblyclouds-app/blog/types/blogTypes';

export interface HistogramBucket {
  label: string;
  rating: number;
  count: number;
}

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface RatingsData {
  histogram: HistogramBucket[];
  heatmap: HeatmapDay[];
  total: number;
}

function getRatingFromTags(tags: string[]): number | null {
  for (const tag of tags) {
    const match = tag.match(/^Rated (\d+(?:\.\d+)?)$/);
    if (match) return parseFloat(match[1]);
  }
  return null;
}

export function computeRatingsData(posts: BlogPostMeta[]): RatingsData {
  const ratingPosts = posts.filter(
    (p) => p.tags && getRatingFromTags(p.tags) !== null
  );

  const ratingCounts: Record<number, number> = {};
  for (let r = 0.5; r <= 5; r += 0.5) {
    ratingCounts[r] = 0;
  }

  const dayCounts: Record<string, number> = {};

  for (const post of ratingPosts) {
    const rating = getRatingFromTags(post.tags);
    if (rating !== null) {
      ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
    }
    const day = post.date.slice(0, 10);
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  const histogram: HistogramBucket[] = Object.entries(ratingCounts)
    .map(([r, count]) => ({
      label: `${r}★`,
      rating: parseFloat(r),
      count,
    }))
    .sort((a, b) => a.rating - b.rating);

  const heatmap: HeatmapDay[] = Object.entries(dayCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { histogram, heatmap, total: ratingPosts.length };
}

export function computeDecadeRatingsData(
  posts: BlogPostMeta[],
  decade: number
): RatingsData {
  const tag = `Release Decade ${decade}`;
  const filtered = posts.filter((p) => p.tags && p.tags.includes(tag));
  return computeRatingsData(filtered);
}
