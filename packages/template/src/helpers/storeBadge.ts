import { resolveLocale } from '@bubblyclouds-app/ui/helpers/resolveLocale';

const APP_STORE_LOCALES = [
  'ar',
  'bn',
  'ca',
  'cs',
  'da',
  'de',
  'el',
  'en',
  'es',
  'es-MX',
  'fi',
  'fr',
  'fr-CA',
  'gu',
  'he',
  'hi',
  'hr',
  'hu',
  'id',
  'it',
  'ja',
  'kn',
  'ko',
  'ml',
  'mr',
  'ms',
  'nb',
  'nl',
  'or',
  'pa',
  'pl',
  'pt',
  'pt-PT',
  'ro',
  'ru',
  'sk',
  'sl',
  'sv',
  'ta',
  'te',
  'th',
  'tr',
  'uk',
  'ur',
  'vi',
  'zh-Hans',
  'zh-Hant',
] as const;

const GOOGLE_PLAY_LOCALES = APP_STORE_LOCALES.filter((tag) => tag !== 'or');

type StoreBadge = 'app-store' | 'google-play';

const BADGE_LOCALES: Record<StoreBadge, readonly string[]> = {
  'app-store': APP_STORE_LOCALES,
  'google-play': GOOGLE_PLAY_LOCALES,
};

export function getStoreBadgeSrc(store: StoreBadge, language: string): string {
  const locale = resolveLocale([language], BADGE_LOCALES[store], 'en');
  return `/badges/${store}/${locale}.svg`;
}
