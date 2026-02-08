import { getAllPosts } from '@bubblyclouds-app/blog/helpers/posts';
import siteMetadata from '@/data/siteMetadata';
import { Feed } from 'feed';

export const dynamic = 'force-static';

export async function GET() {
  const allPosts = await getAllPosts();

  const feed = new Feed({
    title: siteMetadata.title,
    description: siteMetadata.description,
    id: siteMetadata.siteUrl,
    link: siteMetadata.siteUrl,
    language: siteMetadata.language,
    copyright: `© ${new Date().getFullYear()} ${siteMetadata.title}`,
  });

  allPosts.forEach((post) => {
    feed.addItem({
      title: post.title,
      description: post.summary || '',
      id: `${siteMetadata.siteUrl}/${post.slug}`,
      link: `${siteMetadata.siteUrl}/${post.slug}`,
      date: new Date(post.date),
      author: post.authors.map((author) => ({ name: author })),
    });
  });

  return new Response(feed.rss2(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
