import { getAllPosts } from '@/lib/posts';
import { getTagCounts } from '@bubblyclouds-app/blog/helpers/tagUtils';
import TagList from '@bubblyclouds-app/blog/components/TagList';
import { TagCount } from '@bubblyclouds-app/blog/types/tagTypes';

export const metadata = {
  title: 'Tags',
  description: 'All tags used in the blog',
};

export default async function TagsPage() {
  const allPosts = await getAllPosts();
  const tags: TagCount[] = getTagCounts(allPosts);

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl dark:text-gray-100">
            Tags
          </h1>
        </div>
        <div className="flex flex-col items-start justify-start divide-y divide-gray-200 md:mt-24 md:flex-row md:items-center md:justify-center md:space-x-6 md:divide-y-0 dark:divide-gray-700">
          <div className="flex max-w-lg flex-wrap">
            <TagList tags={tags} />
          </div>
        </div>
      </div>
    </>
  );
}
