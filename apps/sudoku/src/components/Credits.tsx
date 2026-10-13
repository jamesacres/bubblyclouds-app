'use client';

import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { Translate } from '@bubblyclouds-app/games/types/i18n';

interface CreditItem {
  name: string;
  description: string;
  url: string;
  license?: string;
}

const buildCredits = (t: Translate): CreditItem[] => [
  {
    name: 'Human Sudoku Solver',
    description: t('credits.items.humanSudokuSolver'),
    url: 'https://github.com/jamesacres/human-sudoku-solver',
    license: 'GPL-3.0',
  },
  {
    name: 'QQwing',
    description: t('credits.items.qqwing'),
    url: 'https://github.com/stephenostermiller/qqwing',
    license: 'GPL-2.0',
  },
  {
    name: 'Tdoku',
    description: t('credits.items.tdoku'),
    url: 'https://github.com/t-dillon/tdoku',
    license: 'BSD 2-Clause',
  },
  {
    name: 'AR Browser Sudoku',
    description: t('credits.items.arBrowserSudoku'),
    url: 'https://github.com/atomic14/ar-browser-sudoku',
    license: 'CC0-1.0',
  },
  {
    name: 'Sudoku Coach',
    description: t('credits.items.sudokuCoach'),
    url: 'https://sudoku.coach',
  },
  {
    name: 'Next.js',
    description: t('credits.items.nextjs'),
    url: 'https://nextjs.org',
  },
  {
    name: 'TypeScript',
    description: t('credits.items.typescript'),
    url: 'https://www.typescriptlang.org',
  },
  {
    name: 'Tailwind CSS',
    description: t('credits.items.tailwind'),
    url: 'https://tailwindcss.com',
  },
  {
    name: 'Capacitor',
    description: t('credits.items.capacitor'),
    url: 'https://capacitorjs.com',
  },
  {
    name: 'Electron',
    description: t('credits.items.electron'),
    url: 'https://www.electronjs.org',
  },
  {
    name: 'TensorFlow.js',
    description: t('credits.items.tensorflow'),
    url: 'https://www.tensorflow.org/js',
  },
  {
    name: 'RevenueCat',
    description: t('credits.items.revenuecat'),
    url: 'https://www.revenuecat.com',
  },
  {
    name: 'React',
    description: t('credits.items.react'),
    url: 'https://react.dev',
  },
  {
    name: 'Turborepo',
    description: t('credits.items.turborepo'),
    url: 'https://turbo.build/repo',
  },
];

interface CreditsProps {
  showTitle?: boolean;
  className?: string;
}

export const Credits: React.FC<CreditsProps> = ({
  showTitle = true,
  className = '',
}) => {
  const { t } = useTranslation('app');
  const credits = buildCredits(t);

  return (
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div>
          <h2 className="mb-2 text-2xl font-bold">{t('credits.title')}</h2>
          <p className="text-sm opacity-80">{t('credits.subtitle')}</p>
        </div>
      )}

      <div className="space-y-4">
        {credits.map((credit) => (
          <div
            key={credit.name}
            className="rounded-lg bg-black/10 p-4 dark:bg-white/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="mb-1 text-lg font-semibold">
                  <a
                    href={credit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {credit.name}
                  </a>
                </h3>
                <p className="mb-2 text-sm opacity-80">{credit.description}</p>
                <a
                  href={credit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-xs opacity-60 hover:opacity-100"
                >
                  {credit.url}
                </a>
              </div>
              {credit.license && (
                <span className="whitespace-nowrap rounded bg-black/10 px-2 py-1 text-xs dark:bg-white/10">
                  {credit.license}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-black/10 pt-4 dark:border-white/10">
        <p>{t('credits.copyright', { companyName: t('brand.companyName') })}</p>
        <p className="text-xs opacity-60">
          <Trans
            t={t}
            i18nKey="credits.license"
            components={{
              licenseLink: (
                <a
                  href="https://github.com/jamesacres/bubblyclouds-app/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-100"
                />
              ),
              creditsLink: (
                <a
                  href="https://github.com/jamesacres/bubblyclouds-app/blob/main/CREDITS.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-100"
                />
              ),
            }}
          />
        </p>
      </div>
    </div>
  );
};
