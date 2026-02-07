import {
  getAllPosts,
  getPostBySlug,
} from '@bubblyclouds-app/blog/helpers/posts';
import {
  extractMusicRatingData,
  stripMusicRatingExport,
  isMusicRatingData,
} from '@/lib/musicRating';
import { getAdjacentPosts } from '@bubblyclouds-app/blog/helpers/blogUtils';
import PostLayout from '@bubblyclouds-app/blog/components/PostLayout';
import { MDXRemote } from 'next-mdx-remote/rsc';
import siteMetadata from '@/data/siteMetadata';
import MDXComponentsBase from '@bubblyclouds-app/blog/components/MDXComponents';
import MusicRating from '@/components/MusicRating';
import { notFound } from 'next/navigation';
import { getAuthor } from '@bubblyclouds-app/blog/helpers/authors';
import { Author } from '@bubblyclouds-app/blog/types/authorTypes';
import rehypePrismPlus from 'rehype-prism-plus';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';
import React from 'react';

function remarkFigure() {
  return (tree: {
    type: string;
    children?: { type?: string; name?: string }[];
  }) => {
    visit(tree, (node, _index, _parent) => {
      if (
        node.type === 'paragraph' &&
        Array.isArray(node.children) &&
        node.children.length === 1 &&
        node.children[0].type === 'mdxJsxFlowElement' &&
        node.children[0].name === 'figcaption'
      ) {
        node.type = 'div';
      }
    });
  };
}

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
  const slug = resolvedParams.slug.map(decodeURIComponent).join('/');
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const publishedAt = new Date(post.date).toISOString();
  const modifiedAt = new Date(post.lastmod || post.date).toISOString();

  return {
    title: `${post.title} | ${siteMetadata.author}`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `${siteMetadata.siteUrl}/${post.slug}`,
      siteName: siteMetadata.title,
      publishedTime: publishedAt,
      modifiedTime: modifiedAt,
      type: 'article',
      images: [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [],
    },
  };
}

export default async function Page(props: { params: { slug: string[] } }) {
  const { params: rawParams } = props;
  const params = await rawParams;

  if (!params || !params.slug) {
    notFound();
  }
  const slug = params.slug.map(decodeURIComponent).join('/');
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const allPosts = await getAllPosts();
  const { prev, next } = getAdjacentPosts(allPosts, slug);

  const authors = await Promise.all(
    post.authors.map(async (authorSlug) => getAuthor(authorSlug))
  );
  const validAuthors = authors.filter(
    (author): author is Author => author !== null
  );

  // Extract music rating data and strip export from content
  const musicRatingData = extractMusicRatingData(post.content);
  const cleanContent = stripMusicRatingExport(post.content);

  // Create MDXComponents with MusicRating component available
  const MDXComponents = {
    ...MDXComponentsBase,
    MusicRating: ({ data }: { data: unknown }): React.JSX.Element | null => {
      if (isMusicRatingData(data)) {
        return <MusicRating data={data} />;
      }
      return null;
    },
  };

  return (
    <PostLayout post={post} authors={validAuthors} prev={prev} next={next}>
      {musicRatingData && (
        <div className="mb-8">
          <MusicRating data={musicRatingData} />
        </div>
      )}
      <MDXRemote
        source={cleanContent}
        components={MDXComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkFigure],
            rehypePlugins: [rehypePrismPlus, rehypeSlug],
          },
        }}
      />
    </PostLayout>
  );
}
