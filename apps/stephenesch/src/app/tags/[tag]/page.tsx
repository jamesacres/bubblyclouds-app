import { getAllPosts, POSTS_PER_PAGE } from '@/lib/posts';
import {
  getTagCounts,
  slugifyTag,
} from '@bubblyclouds-app/blog/helpers/tagUtils';
import { paginatePosts } from '@bubblyclouds-app/blog/helpers/blogUtils';
import PostList from '@bubblyclouds-app/blog/components/PostList';
import Pagination from '@bubblyclouds-app/blog/components/Pagination';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const allPosts = await getAllPosts();
  const tags = getTagCounts(allPosts);
  return tags.map((tag) => ({ tag: tag.tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: tagName } = await params;
  const allPosts = await getAllPosts();
  const tags = getTagCounts(allPosts);
  const foundTag = tags.find((tag) => tag.tag === tagName);

  if (!foundTag) {
    return {};
  }

  return {
    title: `${foundTag.displayName}`,
    description: `Posts with tag ${foundTag.displayName}`,
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag: tagName } = await params;
  const allPosts = await getAllPosts();
  const tags = getTagCounts(allPosts);

  const foundTag = tags.find((tag) => tag.tag === tagName);
  if (!foundTag) {
    notFound();
  }

  const posts = allPosts.filter((post) =>
    post.tags.map((t) => slugifyTag(t)).includes(tagName)
  );

  const sortedPosts = posts.sort((a, b) => {
    const aReleaseYear = Number(
      a.tags
        .find((tag) => tag.startsWith('Release Year '))
        ?.replace('Release Year ', '') || '0'
    );
    const bReleaseYear = Number(
      b.tags
        .find((tag) => tag.startsWith('Release Year '))
        ?.replace('Release Year ', '') || '0'
    );
    return bReleaseYear - aReleaseYear;
  });

  const {
    items: paginatedPosts,
    totalPages,
    currentPage,
  } = paginatePosts(sortedPosts, 1, POSTS_PER_PAGE);

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl dark:text-gray-100">
            {foundTag.displayName}
          </h1>
        </div>
        <PostList posts={paginatedPosts} />
      </div>
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        basePath={`/tags/${tagName}`}
      />
    </>
  );
}
