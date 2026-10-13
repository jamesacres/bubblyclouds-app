import { Translate } from '@bubblyclouds-app/games/types/i18n';

interface MonthlyCollectionTheme {
  icon: string;
  background: string;
  shadow: string;
  titleGlow: string;
  animationClass: string;
  kicker: string;
}

type MonthTheme = Omit<MonthlyCollectionTheme, 'kicker'> & {
  kicker: (t: Translate) => string;
};

// Same spirit as Sudoku's BookCover month table (packages/sudoku/src/
// components/BookCover.tsx) — a distinct look per month so the collection
// feels fresh — but built from Unblock Race's own blue/cyan/amber/lime/rose/
// orange/teal piece palette (pieceColors.ts), never violet/fuchsia, which is
// Sudoku Race's identity (see unblockrace-gridlock-identity memory).
const MONTH_THEMES: Record<string, MonthTheme> = {
  January: {
    icon: '❄️',
    background:
      'linear-gradient(160deg, #061231 0%, #0b3a8f 55%, #0e7490 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(56,189,248,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(103,232,249,0.8)',
    animationClass: 'animate-rotate',
    kicker: (t) => t('collection.theme.january'),
  },
  February: {
    icon: '🧊',
    background:
      'linear-gradient(160deg, #0c1a3d 0%, #164e63 55%, #0e7490 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(94,234,212,0.8)',
    animationClass: 'animate-heartBeat',
    kicker: (t) => t('collection.theme.february'),
  },
  March: {
    icon: '🌬️',
    background:
      'linear-gradient(160deg, #052e2b 0%, #0f766e 55%, #65a30d 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(163,230,53,0.3), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(190,242,100,0.8)',
    animationClass: 'animate-sway',
    kicker: (t) => t('collection.theme.march'),
  },
  April: {
    icon: '🌦️',
    background:
      'linear-gradient(160deg, #0b2447 0%, #155e75 55%, #0891b2 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(34,211,238,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(103,232,249,0.8)',
    animationClass: 'animate-aprilShowers',
    kicker: (t) => t('collection.theme.april'),
  },
  May: {
    icon: '🌻',
    background:
      'linear-gradient(160deg, #1a1406 0%, #92400e 55%, #ca8a04 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(245,158,11,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(253,224,71,0.8)',
    animationClass: 'animate-gentleGlow',
    kicker: (t) => t('collection.theme.may'),
  },
  June: {
    icon: '☀️',
    background:
      'linear-gradient(160deg, #061231 0%, #1d4ed8 55%, #0891b2 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(56,189,248,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(147,197,253,0.85)',
    animationClass: 'animate-pulse',
    kicker: (t) => t('collection.theme.june'),
  },
  July: {
    icon: '🏁',
    background:
      'linear-gradient(160deg, #042f2e 0%, #0e7490 55%, #38bdf8 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(56,189,248,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(125,211,252,0.85)',
    animationClass: 'animate-wave',
    kicker: (t) => t('collection.theme.july'),
  },
  August: {
    icon: '🔥',
    background:
      'linear-gradient(160deg, #1a0f06 0%, #9a3412 55%, #ea580c 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(251,146,60,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(253,186,116,0.85)',
    animationClass: 'animate-blaze',
    kicker: (t) => t('collection.theme.august'),
  },
  September: {
    icon: '🚦',
    background:
      'linear-gradient(160deg, #0b1f14 0%, #166534 55%, #65a30d 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(132,204,22,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(190,242,100,0.8)',
    animationClass: 'animate-wiggle',
    kicker: (t) => t('collection.theme.september'),
  },
  October: {
    icon: '🎃',
    background:
      'linear-gradient(160deg, #1c0a26 0%, #7c2d12 55%, #ea580c 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(251,146,60,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(251,146,60,0.85)',
    animationClass: 'animate-spooky',
    kicker: (t) => t('collection.theme.october'),
  },
  November: {
    icon: '🍂',
    background:
      'linear-gradient(160deg, #170f07 0%, #92400e 55%, #b45309 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(217,119,6,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(252,211,77,0.8)',
    animationClass: 'animate-fall',
    kicker: (t) => t('collection.theme.november'),
  },
  December: {
    icon: '🎄',
    background:
      'linear-gradient(160deg, #051123 0%, #0f4c3a 45%, #9f1239 100%)',
    shadow:
      '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(45,212,191,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
    titleGlow: 'rgba(94,234,212,0.85)',
    animationClass: 'animate-twinkle',
    kicker: (t) => t('collection.theme.december'),
  },
};

const DEFAULT_THEME: MonthTheme = {
  icon: '🧩',
  background: 'linear-gradient(160deg, #061231 0%, #0b3a8f 55%, #0e7490 100%)',
  shadow:
    '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(56,189,248,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
  titleGlow: 'rgba(103,232,249,0.8)',
  animationClass: '',
  kicker: (t) => t('collection.theme.default'),
};

// `month` is a bare month name ("August") for real callers; anything else
// (a test fixture, an unrecognised locale string) falls back to the
// default Unblock Race identity rather than guessing.
export const getMonthlyCollectionTheme = (
  month: string,
  t: Translate
): MonthlyCollectionTheme => {
  const theme = MONTH_THEMES[month] || DEFAULT_THEME;
  return { ...theme, kicker: theme.kicker(t) };
};

export type { MonthlyCollectionTheme };
