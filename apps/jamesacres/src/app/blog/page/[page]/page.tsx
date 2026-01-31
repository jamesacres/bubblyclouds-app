import { getAllPosts, POSTS_PER_PAGE } from '@/lib/posts';
import PostList from '@bubblyclouds-app/blog/components/PostList';
import Pagination from '@bubblyclouds-app/blog/components/Pagination';
import { paginatePosts } from '@bubblyclouds-app/blog/helpers/blogUtils';
import { PostListProps } from '@bubblyclouds-app/blog/types/componentProps';
import { notFound } from 'next/navigation';
import siteMetadata from '@/data/siteMetadata';

export const metadata = {
  title: 'Blog',
  description: siteMetadata.description,
};

export async function generateStaticParams() {
  const allPosts = await getAllPosts();
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
  const paths = Array.from({ length: totalPages }, (_, i) => ({
    page: (i + 1).toString(),
  }));
  return paths;
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const allPosts = await getAllPosts();
  const pageNumber = parseInt(page);

  if (isNaN(pageNumber) || pageNumber <= 0) {
    notFound();
  }

  const {
    items: posts,
    totalPages,
    currentPage,
  } = paginatePosts(allPosts, pageNumber, POSTS_PER_PAGE);

  if (currentPage > totalPages && totalPages > 0) {
    notFound();
  }

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl dark:text-gray-100">
            All Posts
          </h1>
        </div>
        <PostList posts={posts as PostListProps['posts']} />
      </div>
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        basePath="/blog"
      />
    </>
  );
}
