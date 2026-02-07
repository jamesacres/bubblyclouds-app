import { getAllPosts } from '@bubblyclouds-app/blog/helpers/posts';
import PostList from '@bubblyclouds-app/blog/components/PostList';
import Link from 'next/link';
import siteMetadata from '@/data/siteMetadata';
import Image from 'next/image';

const MAX_DISPLAY = 100;

export const metadata = {
  title: 'Good Vibrations',
};

export default async function Page() {
  const posts = await getAllPosts();
  const featuredPosts = posts.slice(0, MAX_DISPLAY);

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-8 pb-8 pt-6 md:space-y-10">
          <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
            <div className="flex flex-col items-start gap-4">
              <Image
                src="/static/images/logo.png"
                alt="Good Vibrations"
                width={120}
                height={120}
                className="h-auto w-auto"
              />
              <div>
                <h2 className="text-2xl font-bold leading-9 tracking-tight text-gray-900 md:text-3xl dark:text-gray-100">
                  Ratings
                </h2>
                <Link
                  href="/ratings"
                  className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700"
                >
                  <span className="text-white">Explore ratings</span>
                </Link>
              </div>
            </div>
            <div className="h-fit rounded-lg bg-yellow-400 px-6 py-4 dark:bg-yellow-500">
              <p className="font-medium text-gray-900">
                {siteMetadata.description}
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-9 tracking-tight text-gray-900 md:text-3xl dark:text-gray-100">
              Recently Published
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
