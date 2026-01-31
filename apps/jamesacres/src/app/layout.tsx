import React from 'react';
import './globals.css';

import siteMetadata from '@/data/siteMetadata';
import { Inter } from 'next/font/google';
import BlogHeader from '@bubblyclouds-app/blog/components/BlogHeader';
import BlogFooter from '@bubblyclouds-app/blog/components/BlogFooter';
import { Providers } from './providers';
import headerNavLinks from '@/data/headerNavLinks';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.author}`,
  },
  description: siteMetadata.description,
  // TODO: Add other meta tags (openGraph, twitter, etc.)
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={siteMetadata.language}
      className={`${inter.className} scroll-smooth`}
      suppressHydrationWarning
    >
      <body className="bg-zinc-100 text-black antialiased dark:bg-gray-900 dark:text-white">
        <Providers>
          <div className="flex h-screen flex-col justify-between">
            <header className="px-4 sm:px-6 lg:px-8">
              <BlogHeader
                siteMetadata={siteMetadata}
                navLinks={headerNavLinks}
              />
            </header>
            <main className="mb-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl xl:max-w-5xl">{children}</div>
            </main>
            <footer className="px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-3xl xl:max-w-5xl">
                <BlogFooter
                  author={siteMetadata.author}
                  github={siteMetadata.github}
                  linkedin={siteMetadata.linkedin}
                />
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
