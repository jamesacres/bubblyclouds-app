import type { Metadata, Viewport } from 'next';
import { Outfit, Orbitron, Pacifico } from 'next/font/google';
import './globals.css';
import React from 'react';
import { Providers } from './providers';
import { createI18n } from '@bubblyclouds-app/ui/config/i18n';
import AppHeader from '../components/AppHeader';
import SudokuPlusModal from '../components/SudokuPlusModal';
import { DEFAULT_LOCALE, resources, supportedLocales } from '../i18n';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
});
const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-orbitron',
});
const pacifico = Pacifico({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pacifico',
});

export function generateMetadata(): Metadata {
  const i18n = createI18n(resources, {
    defaultLocale: DEFAULT_LOCALE,
    supportedLocales,
  });
  const t = i18n.getFixedT(DEFAULT_LOCALE, 'app');

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    icons: [
      {
        url: '/icons/icon-48.webp',
        type: 'image/png',
        sizes: '48x48',
      },
      {
        url: '/icons/icon-72.webp',
        type: 'image/png',
        sizes: '72x72',
      },
      {
        url: '/icons/icon-96.webp',
        type: 'image/png',
        sizes: '96x96',
      },
      {
        url: '/icons/icon-128.webp',
        type: 'image/png',
        sizes: '128x128',
      },
      {
        url: '/icons/icon-192.webp',
        type: 'image/png',
        sizes: '192x192',
      },
      {
        url: '/icons/icon-256.webp',
        type: 'image/png',
        sizes: '256x256',
      },
      {
        url: '/icons/icon-512.webp',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
  };
}

export const viewport: Viewport = {
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&family=Orbitron:wght@400;700&family=Creepster&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${outfit.variable} ${outfit.className} ${orbitron.variable} ${pacifico.variable}`}
      >
        <Providers>
          <AppHeader />
          <div className="mb-24">{children}</div>
          <SudokuPlusModal />
        </Providers>
      </body>
    </html>
  );
}
