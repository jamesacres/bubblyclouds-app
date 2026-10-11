import { describe, it, expect } from '@jest/globals';
import { existsSync } from 'fs';
import { join } from 'path';
import { getStoreBadgeSrc } from './storeBadge';

describe('getStoreBadgeSrc', () => {
  it('returns the badge for an exact locale', () => {
    expect(getStoreBadgeSrc('app-store', 'de')).toBe(
      '/badges/app-store/de.svg'
    );
    expect(getStoreBadgeSrc('google-play', 'ja')).toBe(
      '/badges/google-play/ja.svg'
    );
  });

  it('resolves regional tags to the closest badge', () => {
    expect(getStoreBadgeSrc('app-store', 'pt-BR')).toBe(
      '/badges/app-store/pt.svg'
    );
    expect(getStoreBadgeSrc('google-play', 'zh-TW')).toBe(
      '/badges/google-play/zh-Hant.svg'
    );
    expect(getStoreBadgeSrc('app-store', 'de-AT')).toBe(
      '/badges/app-store/de.svg'
    );
  });

  it('falls back to English when no badge exists', () => {
    expect(getStoreBadgeSrc('google-play', 'or')).toBe(
      '/badges/google-play/en.svg'
    );
    expect(getStoreBadgeSrc('app-store', 'xx')).toBe(
      '/badges/app-store/en.svg'
    );
  });

  it('only references badge files that exist in each app', () => {
    const apps = ['sudoku', 'unblockrace'];
    const languages = ['ar', 'he', 'or', 'pt-PT', 'zh-Hans', 'es-MX', 'nb'];
    for (const app of apps) {
      for (const store of ['app-store', 'google-play'] as const) {
        for (const language of languages) {
          const src = getStoreBadgeSrc(store, language);
          expect(
            existsSync(join(__dirname, '../../../../apps', app, 'public', src))
          ).toBe(true);
        }
      }
    }
  });
});
