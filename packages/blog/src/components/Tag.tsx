import Link from 'next/link';
import { TagProps } from '../types/componentProps';
import { slugifyTag } from '../helpers/tagUtils';

const Tag = ({ tag, count }: TagProps) => {
  const slug = slugifyTag(tag);
  return (
    <Link
      href={`/tags/${slug}`}
      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 text-base font-medium"
    >
      {tag}{' '}
      <span className="text-gray-600 dark:text-gray-400">
        {count && `(${count})`}
      </span>
    </Link>
  );
};

export default Tag;
