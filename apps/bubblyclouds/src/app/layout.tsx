import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import React from 'react';
import Link from 'next/link';
import { Providers } from './providers';
import Footer from '@bubblyclouds-app/ui/components/Footer';
import HeaderWrapper from '@bubblyclouds-app/template/components/HeaderWrapper';
import { APP_CONFIG } from '../../app.config.js';
import { LogoWrapper } from './components/LogoWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bubbly Clouds',
  description: 'Web Services',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <Providers>
          <HeaderWrapper
            app={APP_CONFIG.app}
            appName={APP_CONFIG.appName}
            apiUrl={APP_CONFIG.apiUrl}
            privacyUrl={APP_CONFIG.privacyUrl}
            termsUrl={APP_CONFIG.termsUrl}
            companyUrl={APP_CONFIG.companyUrl}
            companyName={APP_CONFIG.companyName}
          />
          <main className="flex flex-col items-center px-6 pb-24 pt-10 sm:px-12">
            <div className="mb-8">
              <LogoWrapper />
            </div>
            {children}

            <Footer>
              <div className="flex items-center gap-6">
                <Link
                  href="/terms"
                  className="text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                >
                  Privacy
                </Link>
              </div>
            </Footer>
          </main>
        </Providers>
      </body>
    </html>
  );
}
