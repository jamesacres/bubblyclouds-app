import { getAllPosts } from '@bubblyclouds-app/blog/helpers/posts';
import { getTagCounts } from '@bubblyclouds-app/blog/helpers/tagUtils';
import Link from 'next/link';
import { StarsRating } from '@/components/StarsRating';
import { ReviewHeatmap } from '@/components/ReviewHeatmap';
import { RatingHistogram } from '@/components/RatingHistogram';
import {
  computeRatingsData,
  computeDecadeRatingsData,
} from '@/lib/ratingsData';

export const metadata = {
  title: 'Ratings',
  description: 'Explore music ratings by stars, decade, and artist',
};

const DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];

export default async function RatingsPage() {
  const posts = await getAllPosts();
  const tags = getTagCounts(posts);

  const tagCounts: Record<string, number> = {};
  tags.forEach((tag) => {
    tagCounts[tag.tag] = tag.count;
  });

  const allData = computeRatingsData(posts);
  const decadeData = DECADES.map((decade) => ({
    decade,
    data: computeDecadeRatingsData(posts, decade),
  })).filter(({ data }) => data.total > 0);

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pb-8 pt-6 md:space-y-5">
        <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl dark:text-gray-100">
          Explore Ratings
        </h1>

        {/* All-time visualisations */}
        <section className="pt-4">
          <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
            All time — {allData.total} reviews
          </h2>
          <div className="mb-4">
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
              Rating distribution
            </p>
            <RatingHistogram data={allData.histogram} />
          </div>
          <div className="mb-6">
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
              Review activity
            </p>
            <ReviewHeatmap data={allData.heatmap} />
          </div>
          <ul className="flex flex-wrap gap-2">
            {Array.from(Array(10)).map((_, i) => {
              const rating = 10 - i;
              const ratingOutOfFive = rating / 2;
              const tag = `rated-${`${ratingOutOfFive}`.replace('.', '')}`;
              const count = tagCounts[tag] || 0;
              return (
                <li key={i}>
                  <Link
                    href={`/tags/${tag}`}
                    className="flex items-center gap-1"
                  >
                    <StarsRating rating={rating} size={16} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({count})
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Per-decade visualisations */}
        <section className="space-y-10 pt-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            By decade
          </h2>
          <ul className="flex flex-wrap gap-2">
            {Array.from(Array(9)).map((_, i) => {
              const decade = 1940 + i * 10;
              const tag = `release-decade-${decade}`;
              const count = tagCounts[tag] || 0;
              return (
                <li key={i}>
                  <Link
                    href={`/tags/${tag}`}
                    className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1"
                  >
                    <span>{decade}s</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({count})
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {decadeData.map(({ decade, data }) => (
            <div
              key={decade}
              className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
            >
              <h3 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-300">
                <Link
                  href={`/tags/release-decade-${decade}`}
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  {decade}s
                </Link>{' '}
                <span className="text-sm font-normal text-gray-400">
                  {data.total} reviews
                </span>
              </h3>
              <div className="mb-4">
                <p className="mb-1 text-xs text-gray-400">
                  Rating distribution
                </p>
                <RatingHistogram data={data.histogram} />
              </div>
              <div>
                <p className="mb-1 text-xs text-gray-400">Review activity</p>
                <ReviewHeatmap data={data.heatmap} />
              </div>
            </div>
          ))}
        </section>

        <section className="pt-4">
          <h2 className="mb-3 text-xl font-semibold text-gray-800 dark:text-gray-200">
            Filter by artist
          </h2>
          <ul className="columns-2 sm:columns-3">
            {Object.entries(tagCounts)
              .filter(([tag]) => tag.startsWith('artist'))
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([tag, count]) => {
                return (
                  <li key={tag}>
                    <Link
                      href={`/tags/${tag}`}
                      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {tag
                        .replace('artist-', '')
                        .replace(/-/g, ' ')
                        .toUpperCase()}{' '}
                      ({count})
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      </div>
    </div>
  );
}
