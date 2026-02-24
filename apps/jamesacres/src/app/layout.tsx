import { ReactNode } from 'react';
import './globals.css';

import { Metadata } from 'next';
import siteMetadata from '@/data/siteMetadata';
import { Geist } from 'next/font/google';
import BlogHeader from '@bubblyclouds-app/blog/components/BlogHeader';
import BlogFooter from '@bubblyclouds-app/blog/components/BlogFooter';
import { Providers } from '@bubblyclouds-app/blog/components/Providers';
import headerNavLinks from '@/data/headerNavLinks';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.title,
    template: `%s | ${siteMetadata.author}`,
  },
  description: siteMetadata.description,
  openGraph: {
    title: siteMetadata.title,
    description: siteMetadata.description,
    url: './',
    siteName: siteMetadata.title,
    locale: 'en_GB',
    type: 'website',
  },
  alternates: {
    canonical: './',
    types: {
      'application/rss+xml': `${siteMetadata.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    title: siteMetadata.title,
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang={siteMetadata.language}
      className={`${geist.className} scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon-16x16.png"
      />
      <link rel="manifest" href="/site.webmanifest" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
      <meta name="msapplication-TileColor" content="#da532c" />
      <meta name="theme-color" content="#ffffff" />
      <meta
        name="theme-color"
        media="(prefers-color-scheme: light)"
        content="#fff"
      />
      <meta
        name="theme-color"
        media="(prefers-color-scheme: dark)"
        content="#000"
      />
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      <body className="bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
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
