import React from 'react';
import { PostListProps } from '../types/componentProps';
import { formatDate } from '../helpers/dateUtils';
import { slugifyTag } from '../helpers/tagUtils';
import Link from 'next/link';
import Image from 'next/image';

const PostList = ({ posts }: PostListProps) => {
  if (!posts || posts.length === 0) {
    return <p>No posts available.</p>;
  }

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {posts.map((post) => {
          const { slug, date, title, summary, tags, readingTime, images } =
            post;
          const featuredImage = images && images.length > 0 ? images[0] : null;

          return (
            <li key={slug} className="py-12">
              <article>
                <div className="space-y-2 xl:grid xl:grid-cols-4 xl:items-baseline xl:space-y-0">
                  <div className="space-y-4">
                    <dl>
                      <dt className="sr-only">Published on</dt>
                      <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                        <time dateTime={date}>{formatDate(date)}</time>
                      </dd>
                    </dl>
                    {featuredImage && (
                      <div>
                        <Link href={`/${slug}`}>
                          <Image
                            src={featuredImage}
                            alt={title}
                            width={200}
                            height={200}
                            className="h-50 w-50 rounded-lg object-cover"
                          />
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="space-y-5 xl:col-span-3">
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold leading-8 tracking-tight">
                          <Link
                            href={`/${slug}`}
                            className="text-gray-900 dark:text-gray-100"
                          >
                            {title}
                          </Link>
                        </h2>
                        <div className="flex flex-wrap">
                          {tags.map((tag: string) => (
                            <Link
                              key={tag}
                              href={`/tags/${slugifyTag(tag)}`}
                              className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mr-3 text-sm font-medium uppercase"
                            >
                              {slugifyTag(tag)}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div className="prose max-w-none text-gray-500 dark:text-gray-400">
                        {summary}
                      </div>
                    </div>
                    <div className="text-base font-medium leading-6">
                      <Link
                        href={`/${slug}`}
                        className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                        aria-label={`Read more: "${title}"`}
                      >
                        Read more: {readingTime.text}→
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PostList;
