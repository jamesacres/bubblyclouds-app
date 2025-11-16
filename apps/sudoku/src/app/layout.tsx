import type { Metadata, Viewport } from 'next';
import { Inter, Orbitron, Pacifico } from 'next/font/google';
import './globals.css';
import React from 'react';
import { Providers } from './providers';
import ErrorBoundary from '@sudoku-web/template/components/ErrorBoundary';
import GlobalErrorHandler from '@sudoku-web/template/components/GlobalErrorHandler';
import SudokuPlusModal from '@sudoku-web/template/components/SudokuPlusModal';
import HeaderWrapper from '@sudoku-web/template/components/HeaderWrapper';

const inter = Inter({ subsets: ['latin'] });
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

export const metadata: Metadata = {
  title: 'Sudoku Race',
  description:
    'Play and share to race sudoku with friends. Daily challenges & cross-device!',
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Pacifico&family=Orbitron:wght@400;700&family=Creepster&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.className} ${orbitron.variable} ${pacifico.variable}`}
      >
        <GlobalErrorHandler />
        <ErrorBoundary>
          <Providers>
            <HeaderWrapper />
            <div className="mb-24">{children}</div>
            <SudokuPlusModal />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
