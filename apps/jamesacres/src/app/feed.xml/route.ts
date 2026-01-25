import { getAllPosts } from '@/lib/posts';
import siteMetadata from '@/data/siteMetadata';
import RSS from 'rss';

export async function GET() {
  const allPosts = await getAllPosts();

  const feed = new RSS({
    title: siteMetadata.title,
    description: siteMetadata.description,
    feed_url: `${siteMetadata.siteUrl}/feed.xml`,
    site_url: siteMetadata.siteUrl,
    language: siteMetadata.language,
    pubDate: new Date().toUTCString(),
    ttl: 60, // 60 minutes
  });

  allPosts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.summary || '',
      url: `${siteMetadata.siteUrl}/${post.slug}`,
      date: post.date,
      author: post.authors.map((author) => author).join(', '), // Assuming authors are strings
    });
  });

  return new Response(feed.xml(), {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
