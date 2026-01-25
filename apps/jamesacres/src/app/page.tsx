import siteMetadata from '@/data/siteMetadata';
import { getAllPosts } from '@/lib/posts';
import PostList from '@bubblyclouds-app/blog/components/PostList';
import Link from 'next/link';
import { PostListProps } from '@bubblyclouds-app/blog/types/componentProps';

const MAX_DISPLAY = 5;

export default async function Page() {
  const posts = await getAllPosts();
  const featuredPosts = posts.slice(0, MAX_DISPLAY);

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl dark:text-gray-100">
            Latest
          </h1>
          <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">
            {siteMetadata.description}
          </p>
        </div>
        <PostList posts={featuredPosts as PostListProps['posts']} />
      </div>
      {posts.length > MAX_DISPLAY && (
        <div className="flex justify-end text-base font-medium leading-6">
          <Link
            href="/blog"
            className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
            aria-label="All Posts"
          >
            All Posts &rarr;
          </Link>
        </div>
      )}
    </>
  );
}
