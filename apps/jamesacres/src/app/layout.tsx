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
    template: `%s | ${siteMetadata.title}`,
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
      <body className="bg-white text-black antialiased dark:bg-gray-950 dark:text-white">
        <Providers>
          <div className="flex h-screen flex-col justify-between">
            <header className="flex items-center justify-between py-10">
              <BlogHeader
                siteMetadata={siteMetadata}
                navLinks={headerNavLinks}
              />
            </header>
            <main className="mb-auto">{children}</main>
            <BlogFooter
              author={siteMetadata.author}
              github={siteMetadata.github}
              linkedin={siteMetadata.linkedin}
              email={siteMetadata.email}
              siteUrl={siteMetadata.siteUrl}
            />
          </div>
        </Providers>
      </body>
    </html>
  );
}
