import { getAllPosts } from '@/lib/posts';
import PostList from '@bubblyclouds-app/blog/components/PostList';
import Link from 'next/link';
import Image from 'next/image';

const MAX_DISPLAY = 5;

export const metadata = {
  title: 'James Acres',
};

export default async function Page() {
  const posts = await getAllPosts();
  const featuredPosts = posts.slice(0, MAX_DISPLAY);

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-8 pb-8 pt-6 md:space-y-10">
          <div className="flex flex-row items-start justify-end gap-4">
            <div className="relative mt-20 max-w-lg">
              <div className="animate-fade-in relative rounded-lg bg-pink-400 p-4 dark:bg-pink-500">
                <div className="absolute -right-2 top-1/2 h-0 w-0 border-b-[12px] border-l-[16px] border-t-[12px] border-b-transparent border-l-pink-400 border-t-transparent dark:border-l-pink-500"></div>
                <p className="whitespace-nowrap text-lg font-semibold leading-7 text-white">
                  I'm creating awesome, here are some of my thoughts.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/static/images/mascot.png"
                alt="avatar"
                width={150}
                height={300}
                className="h-auto w-36 object-cover object-right"
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-9 tracking-tight text-gray-900 md:text-3xl dark:text-gray-100">
              Recently Published
            </h1>
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
