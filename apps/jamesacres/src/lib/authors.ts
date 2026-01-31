import { Author } from '@bubblyclouds-app/blog/types/authorTypes';
// In a real scenario, this would read from apps/jamesacres/data/authors/default.mdx

export async function getAuthor(slug: string): Promise<Author | null> {
  if (slug === 'default') {
    return {
      slug: 'default',
      name: 'James Acres',
      avatar: '/static/images/avatar.jpg',
      occupation: 'Technical Lead',
      company: 'NatWest Rooster Money',
      email: 'hello@jamesacres.co.uk',
      twitter: 'https://twitter.com/JamesAcres',
      linkedin: 'https://www.linkedin.com/in/jamesacres/',
      github: 'https://github.com/JamesAcres',
      bio: `At work I'm a hands on tech lead at NatWest Rooster Money, giving children a head start with financial education. I'm a backend specialist building card, subscription and payment systems with Node.js and Typescript. In previous roles I have worked full stack with Node, AngularJS, PHP, Perl and native Objective C iOS and Java Android applications.

Outside of work I am writing this blog and have side projects using React with serverside rendering using Next.js, and NestJS for backend APIs.

I enjoy and excel at designing and developing secure, usable and creative web + mobile applications and the APIs which power them.

I am experienced at transforming complex big picture visions into achievable, incremental development roadmaps.

I have lead several integrations with third parties and can communicate systems in a way which is understood by non-technical clients.

I have mentored both graduates and senior developers, conducted one-to-one catch-ups and code reviews.`,
    };
  }
  return null;
}
