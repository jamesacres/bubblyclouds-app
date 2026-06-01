import { getAllPosts } from '@bubblyclouds-app/blog/helpers/posts';
import { getTagCounts } from '@bubblyclouds-app/blog/helpers/tagUtils';
import PostList from '@bubblyclouds-app/blog/components/PostList';
import Link from 'next/link';
import siteMetadata from '@/data/siteMetadata';
import Image from 'next/image';
import { RatingHistogram } from '@/components/RatingHistogram';
import { ReviewHeatmap } from '@/components/ReviewHeatmap';
import { StarsRating } from '@/components/StarsRating';
import { computeRatingsData } from '@/lib/ratingsData';

const MAX_DISPLAY = 100;

export const metadata = {
  title: 'Good Vibrations',
};

export default async function Page() {
  const posts = await getAllPosts();
  const featuredPosts = posts.slice(0, MAX_DISPLAY);

  const tags = getTagCounts(posts);
  const tagCounts: Record<string, number> = {};
  tags.forEach((tag) => {
    tagCounts[tag.tag] = tag.count;
  });
  const allData = computeRatingsData(posts);

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-8 pb-8 pt-6 md:space-y-10">
          <div className="flex items-center gap-3">
            <Image
              src="/static/images/logo.png"
              alt="Good Vibrations"
              width={40}
              height={40}
              className="h-10 w-10 flex-shrink-0"
            />
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {siteMetadata.description}
            </h2>
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Rating distribution — {allData.total} reviews
              </p>
              <Link
                href="/ratings"
                className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 text-sm"
              >
                Explore ratings →
              </Link>
            </div>
            <RatingHistogram data={allData.histogram} />
          </div>

          <div>
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

          <ul className="flex flex-wrap gap-2">
            {[1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map(
              (decade) => {
                const tag = `release-decade-${decade}`;
                const count = tagCounts[tag] || 0;
                return (
                  <li key={decade}>
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
              }
            )}
          </ul>

          <div>
            <h2 className="text-xl font-semibold leading-9 tracking-tight text-gray-900 dark:text-gray-100">
              Recent posts
            </h2>
          </div>
        </div>
        <PostList posts={featuredPosts} />
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base font-medium leading-6">
          <Link
            href="/blog/page/2"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="Next page"
          >
            Next &rarr;
          </Link>
        </div>
      )}
    </>
  );
}
