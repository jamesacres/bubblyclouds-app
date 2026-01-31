import { getAllPosts } from '@/lib/posts';
import PostList from '@bubblyclouds-app/blog/components/PostList';
import Link from 'next/link';
import { PostListProps } from '@bubblyclouds-app/blog/types/componentProps';
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
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
            <div className="relative flex-1">
              <div className="animate-fade-in relative rounded-lg bg-pink-100 p-6 md:p-8 dark:bg-pink-900/30">
                <div className="absolute -right-2 top-1/2 h-0 w-0 border-b-[12px] border-l-[16px] border-t-[12px] border-b-transparent border-l-pink-100 border-t-transparent md:hidden dark:border-l-pink-900/30"></div>
                <div className="absolute -bottom-2 left-1/2 hidden h-0 w-0 border-l-[12px] border-r-[12px] border-t-[16px] border-l-transparent border-r-transparent border-t-pink-100 md:block dark:border-t-pink-900/30"></div>
                <p className="text-xl font-semibold leading-8 text-gray-900 dark:text-gray-100">
                  I'm creating awesome, here are some of my thoughts.
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/static/images/mascot.png"
                alt="avatar"
                width={192}
                height={192}
                className="h-48 w-48"
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-9 tracking-tight text-gray-900 md:text-3xl dark:text-gray-100">
              Recently Published
            </h1>
          </div>
        </div>
        <PostList posts={featuredPosts as PostListProps['posts']} />
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
