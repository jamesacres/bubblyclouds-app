import Link from 'next/link';
import { PostLayoutProps } from '../types/componentProps';
import { formatDate } from '../helpers/dateUtils';
import Tag from './Tag';
import Image from 'next/image';

const PostLayout = ({
  post,
  authors,
  prev,
  next,
  children,
}: PostLayoutProps) => {
  const { slug, date, title, tags, readingTime } = post;
  const author = authors[0]; // Assuming single author for simplicity, or find by slug if multiple

  return (
    <article>
      <div className="xl:divide-y xl:divide-gray-200 xl:dark:divide-gray-700">
        <header className="pt-6 xl:pb-6">
          <div className="space-y-1 text-center">
            <dl className="space-y-10">
              <div>
                <dt className="sr-only">Published on</dt>
                <dd className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400">
                  <time dateTime={date}>{formatDate(date)}</time>
                </dd>
              </div>
            </dl>
            <div>
              <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-5xl dark:text-gray-100">
                {title}
              </h1>
            </div>
          </div>
        </header>
        <div className="grid-rows-2 divide-y divide-gray-200 pb-8 xl:grid xl:grid-cols-4 xl:gap-x-6 xl:divide-y-0 dark:divide-gray-700">
          <dl className="pb-10 pt-6 xl:border-b xl:border-gray-200 xl:pt-11 xl:dark:border-gray-700">
            <dt className="sr-only">Authors</dt>
            <dd>
              <ul className="flex flex-wrap justify-center gap-4 sm:space-x-12 xl:block xl:space-x-0 xl:space-y-8">
                <li className="flex items-center space-x-2">
                  {author.avatar && (
                    <Image
                      src={author.avatar}
                      width={38}
                      height={38}
                      alt="avatar"
                      className="h-10 w-10 rounded-full"
                    />
                  )}
                  <dl className="whitespace-nowrap text-sm font-medium leading-5">
                    <dt className="sr-only">Name</dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      {author.name}
                    </dd>
                    <dt className="sr-only">Twitter</dt>
                    <dd>
                      {author.twitter && (
                        <Link
                          href={author.twitter}
                          className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                        >
                          {author.twitter.replace('https://twitter.com/', '@')}
                        </Link>
                      )}
                    </dd>
                  </dl>
                </li>
              </ul>
            </dd>
          </dl>
          <div className="divide-y divide-gray-200 xl:col-span-3 xl:row-span-2 xl:pb-0 dark:divide-gray-700">
            <div className="prose dark:prose-invert max-w-none pb-8 pt-10">
              {children}
            </div>
            <div className="pb-6 pt-6 text-sm text-gray-700 dark:text-gray-300">
              Reading time: {readingTime.text}
            </div>
            {tags && (
              <div className="py-4 xl:py-8">
                <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tags
                </h2>
                <div className="flex flex-wrap">
                  {tags.map((tag: string) => (
                    <Tag key={tag} tag={tag} />
                  ))}
                </div>
              </div>
            )}
            {(next || prev) && (
              <div className="flex justify-between py-4 xl:block xl:space-y-8 xl:py-8">
                {prev && (
                  <div>
                    <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Previous Article
                    </h2>
                    <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                      <Link href={`/${prev.slug}`}>{prev.title}</Link>
                    </div>
                  </div>
                )}
                {next && (
                  <div>
                    <h2 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Next Article
                    </h2>
                    <div className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">
                      <Link href={`/${next.slug}`}>{next.title}</Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <footer className="divide-y divide-gray-200 text-sm font-medium leading-5 xl:col-start-1 xl:row-start-2 xl:border-t xl:border-gray-200 dark:divide-gray-700 xl:dark:border-gray-700">
            <div className="pt-4 xl:pt-8">
              <Link
                href="/blog"
                className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                aria-label="Back to the blog"
              >
                &larr; Back to the blog
              </Link>
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
};

export default PostLayout;
