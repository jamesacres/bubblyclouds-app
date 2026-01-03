import React from 'react';

interface CreditItem {
  name: string;
  description: string;
  url: string;
  license?: string;
}

const credits: CreditItem[] = [
  {
    name: 'QQwing',
    description: 'Sudoku of the Day puzzle generation',
    url: 'https://github.com/stephenostermiller/qqwing',
    license: 'GPL-2.0',
  },
  {
    name: 'Tdoku',
    description: 'Fast Sudoku solver for scanned puzzles',
    url: 'https://github.com/t-dillon/tdoku',
    license: 'BSD 2-Clause',
  },
  {
    name: 'AR Browser Sudoku',
    description: 'Augmented reality scanner technology',
    url: 'https://github.com/atomic14/ar-browser-sudoku',
    license: 'CC0-1.0',
  },
  {
    name: 'Sudoku Coach',
    description: 'Inspiration for difficulty calculation algorithms',
    url: 'https://sudoku.coach',
  },
  {
    name: 'Next.js',
    description: 'React framework for production',
    url: 'https://nextjs.org',
  },
  {
    name: 'TypeScript',
    description: 'Typed superset of JavaScript',
    url: 'https://www.typescriptlang.org',
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework',
    url: 'https://tailwindcss.com',
  },
  {
    name: 'Capacitor',
    description: 'Native mobile app runtime',
    url: 'https://capacitorjs.com',
  },
  {
    name: 'Electron',
    description: 'Desktop app framework',
    url: 'https://www.electronjs.org',
  },
  {
    name: 'TensorFlow.js',
    description: 'Machine learning for AR features',
    url: 'https://www.tensorflow.org/js',
  },
  {
    name: 'RevenueCat',
    description: 'Subscription management',
    url: 'https://www.revenuecat.com',
  },
  {
    name: 'React',
    description: 'UI component library',
    url: 'https://react.dev',
  },
  {
    name: 'Turborepo',
    description: 'Monorepo build system',
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
  return (
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div>
          <h2 className="mb-2 text-2xl font-bold">Credits & Attribution</h2>
          <p className="text-sm opacity-80">
            This app is built upon several excellent projects
          </p>
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
                  className="text-xs break-all opacity-60 hover:opacity-100"
                >
                  {credit.url}
                </a>
              </div>
              {credit.license && (
                <span className="rounded bg-black/10 px-2 py-1 text-xs whitespace-nowrap dark:bg-white/10">
                  {credit.license}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-black/10 pt-4 dark:border-white/10">
        <p className="text-xs opacity-60">
          This app is licensed under the MIT License. See our{' '}
          <a
            href="https://github.com/jamesacres/bubblyclouds-app/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-100"
          >
            LICENSE
          </a>{' '}
          and{' '}
          <a
            href="https://github.com/jamesacres/bubblyclouds-app/blob/main/CREDITS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-100"
          >
            CREDITS
          </a>{' '}
          for details.
        </p>
      </div>
    </div>
  );
};
