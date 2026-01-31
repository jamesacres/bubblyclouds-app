import { getAllPosts } from '@/lib/posts';
import {
  getTagCounts,
  slugifyTag,
} from '@bubblyclouds-app/blog/helpers/tagUtils';
import PostList from '@bubblyclouds-app/blog/components/PostList';
import TagList from '@bubblyclouds-app/blog/components/TagList';
import { notFound } from 'next/navigation';
import { PostListProps } from '@bubblyclouds-app/blog/types/componentProps';

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
  return {
    title: `${tagName}`,
    description: `Posts with tag ${tagName}`,
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

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl dark:text-gray-100">
            Posts Tagged: {foundTag.displayName}
          </h1>
        </div>
        <PostList posts={posts as PostListProps['posts']} />
      </div>
      <div className="flex flex-wrap pt-6">
        <TagList tags={tags} />
      </div>
    </>
  );
}
