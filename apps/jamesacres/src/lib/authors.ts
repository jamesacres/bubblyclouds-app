import { Author } from '@bubblyclouds-app/blog/types/authorTypes';
// In a real scenario, this would read from apps/jamesacres/data/authors/default.mdx

export async function getAuthor(slug: string): Promise<Author | null> {
  if (slug === 'default') {
    return {
      slug: 'default',
      name: 'James Acres',
      avatar: '/static/images/avatar.png',
      occupation: 'Software Engineer',
      company: 'Bubbly Clouds',
      email: 'hello@jamesacres.co.uk',
      twitter: 'https://twitter.com/JamesAcres',
      linkedin: 'https://www.linkedin.com/in/jamesacres/',
      github: 'https://github.com/JamesAcres',
      bio: `Hi, I'm James Acres. I'm a software engineer at Bubbly Clouds. I love building things with Next.js, React, and TypeScript.`,
    };
  }
  return null;
}
