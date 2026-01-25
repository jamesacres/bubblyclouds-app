import Link from 'next/link';
import { TagProps } from '../types/componentProps';
import { slugifyTag } from '../helpers/tagUtils';

const Tag = ({ tag, count }: TagProps) => {
  const slug = slugifyTag(tag);
  return (
    <Link
      href={`/tags/${slug}`}
      className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mr-3 text-sm font-medium uppercase"
    >
      {tag} {count && `(${count})`}
    </Link>
  );
};

export default Tag;
