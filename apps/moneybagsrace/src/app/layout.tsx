import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import React from 'react';
import { Providers } from './providers';
import ErrorBoundary from '@bubblyclouds-app/template/components/ErrorBoundary';
import GlobalErrorHandler from '@bubblyclouds-app/template/components/GlobalErrorHandler';
import HeaderWrapper from '@bubblyclouds-app/template/components/HeaderWrapper';
import MoneyBagsRacePlusModal from '../components/MoneyBagsRacePlusModal';
import { APP_CONFIG } from '../../app.config.js';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: APP_CONFIG.appName,
  description: APP_CONFIG.appDescription,
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
      <body className={`${outfit.variable} ${outfit.className}`}>
        <GlobalErrorHandler />
        <ErrorBoundary>
          <Providers>
            <HeaderWrapper
              app={APP_CONFIG.app}
              appName={APP_CONFIG.appName}
              apiUrl={APP_CONFIG.apiUrl}
              privacyUrl={APP_CONFIG.privacyUrl}
              termsUrl={APP_CONFIG.termsUrl}
              creditsUrl={APP_CONFIG.creditsUrl}
              companyUrl={APP_CONFIG.companyUrl}
              companyName={APP_CONFIG.companyName}
            />
            <div className="mb-24">{children}</div>
            <MoneyBagsRacePlusModal />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
