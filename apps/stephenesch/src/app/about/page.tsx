import siteMetadata from '@/data/siteMetadata';
import { getAuthor } from '@bubblyclouds-app/blog/helpers/authors';
import { MDXRemote } from 'next-mdx-remote/rsc';
import MDXComponents from '@bubblyclouds-app/blog/components/MDXComponents';
import Image from 'next/image';
import { Github, Linkedin } from 'lucide-react';
import rehypePrismPlus from 'rehype-prism-plus';
import rehypeSlug from 'rehype-slug';

export const metadata = {
  title: 'About',
  description: `About me - ${siteMetadata.author}`,
};

export default async function AboutPage() {
  const author = await getAuthor('default');

  if (!author) {
    return <div>Author not found.</div>;
  }

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <div className="space-y-2 pb-8 pt-6 md:space-y-5">
          <h1 className="md:leading-14 text-3xl font-extrabold leading-9 tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl dark:text-gray-100">
            About
          </h1>
        </div>
        <div className="items-start space-y-2 xl:grid xl:grid-cols-3 xl:gap-x-8 xl:space-y-0">
          <div className="flex flex-col items-center pt-8">
            {author.avatar && (
              <Image
                src={author.avatar}
                alt={author.name}
                width={192}
                height={192}
                className="h-48 w-48 rounded-full object-cover object-right"
              />
            )}
            <h3 className="pb-2 pt-4 text-2xl font-bold leading-8 tracking-tight">
              {author.name}
            </h3>
            <div className="text-gray-500 dark:text-gray-400">
              {author.occupation}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              {author.company}
            </div>
            <div className="mt-4 flex space-x-4">
              {author.github && (
                <a
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={author.github}
                >
                  <span className="sr-only">GitHub</span>
                  <Github size={24} />
                </a>
              )}
              {author.linkedin && (
                <a
                  className="text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={author.linkedin}
                >
                  <span className="sr-only">LinkedIn</span>
                  <Linkedin size={24} />
                </a>
              )}
            </div>
          </div>
          <div className="prose dark:prose-invert max-w-none pb-8 pt-8 xl:col-span-2">
            {author.bio && (
              <MDXRemote
                source={author.bio}
                components={MDXComponents}
                options={{
                  mdxOptions: {
                    rehypePlugins: [rehypePrismPlus, rehypeSlug],
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
