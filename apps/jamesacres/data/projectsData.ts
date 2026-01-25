import { Project } from '@bubblyclouds-app/blog/types/siteTypes';

const projectsData: Project[] = [
  {
    title: 'A Search Engine',
    description: 'A search engine built with Next.js and Tailwind CSS',
    imgSrc: '/static/images/google.png',
    href: 'https://www.google.com',
  },
  {
    title: 'The Time Machine',
    description:
      'Imagine being able to travel back in time or to the future. Simple turn the knob and you are there.',
    imgSrc: '/static/images/time-machine.jpg',
    href: '/blog/the-time-machine',
  },
  {
    title: 'Moonwalkers',
    description:
      'The Moonwalkers is a fictional story about a group of astronauts who embark on a perilous mission to the Moon.',
    imgSrc: '/static/images/moonwalkers.jpg',
    href: '/blog/moonwalkers',
  },
];

export default projectsData;
