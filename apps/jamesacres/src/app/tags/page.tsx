import { getAllPosts } from '@bubblyclouds-app/blog/helpers/posts';
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
          <h1 className="text-6xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100">
            Tags
          </h1>
        </div>
        <div className="py-12">
          <TagList tags={tags} />
        </div>
      </div>
    </>
  );
}
