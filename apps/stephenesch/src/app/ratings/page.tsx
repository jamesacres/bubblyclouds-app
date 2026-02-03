import { getAllPosts } from '@/lib/posts';
import { getTagCounts } from '@bubblyclouds-app/blog/helpers/tagUtils';
import Link from 'next/link';
import { StarsRating } from '@/lib/components/StarsRating';

export const metadata = {
  title: 'Ratings',
  description: 'Explore music ratings by stars, decade, and artist',
};

export default async function RatingsPage() {
  const posts = await getAllPosts();
  const tags = getTagCounts(posts);

  const tagCounts: Record<string, number> = {};
  tags.forEach((tag) => {
    tagCounts[tag.tag] = tag.count;
  });

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pb-8 pt-6 md:space-y-5">
        <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl dark:text-gray-100">
          Explore Ratings
        </h1>
        <div className="flex space-x-4">
          <div className="basis-1/2">
            <h2 className="text-2xl">Rating:</h2>
            <ul>
              {Array.from(Array(10)).map((_, i) => {
                const rating = 10 - i;
                const ratingOutOfFive = rating / 2;
                const tag = `rated-${`${ratingOutOfFive}`.replace('.', '')}`;
                const count = tagCounts[tag] || 0;
                return (
                  <li key={i}>
                    <Link href={`/tags/${tag}`} className="flex items-center">
                      <div>
                        <StarsRating rating={rating} />
                      </div>
                      ({count})
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl">Decade:</h2>
            <ul>
              {Array.from(Array(9)).map((_, i) => {
                const decade = 1940 + i * 10;
                const tag = `release-decade-${decade}`;
                const count = tagCounts[tag] || 0;
                return (
                  <li key={i}>
                    <Link
                      href={`/tags/${tag}`}
                      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {decade} ({count})
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div>
          <h2 className="text-2xl">Artist:</h2>
          <ul>
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
        </div>
      </div>
    </div>
  );
}
