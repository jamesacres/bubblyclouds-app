import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { getAdjacentPosts } from '@bubblyclouds-app/blog/helpers/blogUtils';
import PostLayout from '@bubblyclouds-app/blog/components/PostLayout';
import { MDXRemote } from 'next-mdx-remote/rsc';
import siteMetadata from '@/data/siteMetadata';
import MDXComponents from '@bubblyclouds-app/blog/components/MDXComponents';
import { notFound } from 'next/navigation';
import { getAuthor } from '@/lib/authors';

export async function generateStaticParams() {
  const posts = await getAllPosts();
  const params = posts.map((post) => ({ slug: post.slug.split('/') }));
  return params;
}

export async function generateMetadata(props: { params: { slug: string[] } }) {
  const { params: rawParams } = props;
  const resolvedParams = await Promise.resolve(rawParams);

  if (!resolvedParams || !resolvedParams.slug) {
    return {};
  }
  const slug = resolvedParams.slug.join('/');
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const publishedAt = new Date(post.date).toISOString();
  const modifiedAt = new Date(post.lastmod || post.date).toISOString();

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `${siteMetadata.siteUrl}/${post.slug}`,
      siteName: siteMetadata.title,
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      type: 'article',
      images: [], // Explicitly empty array
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [], // Explicitly empty array
    },
  };
}

export default async function Page(props: { params: { slug: string[] } }) {
  const { params: rawParams } = props;
  const params = await rawParams;

  if (!params || !params.slug) {
    notFound();
  }
  const slug = params.slug.join('/');
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = await getAllPosts();
  const { prev, next } = getAdjacentPosts(allPosts, slug);

  const authors = await Promise.all(
    post.authors.map(async (authorSlug) => getAuthor(authorSlug))
  );
  const validAuthors = authors.filter(Boolean);

  return (
    <PostLayout post={post} authors={validAuthors} prev={prev} next={next}>
      <MDXRemote source={post.content} components={MDXComponents} />
    </PostLayout>
  );
}
