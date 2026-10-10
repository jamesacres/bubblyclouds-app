/**
 * @jest-environment node
 */
import { createI18n } from '@bubblyclouds-app/ui/config/i18n';
import { DEFAULT_LOCALE, resources, supportedLocales } from './i18n';

describe('i18n', () => {
  it('declares English as the only supported locale', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(supportedLocales).toEqual(['en']);
  });

  it('assembles every namespace for the default locale', () => {
    expect(Object.keys(resources[DEFAULT_LOCALE]).sort()).toEqual(
      ['app', 'auth', 'games', 'template', 'ui', 'unblockrace'].sort()
    );
  });

  it('creates an instance without a DOM', () => {
    expect(typeof document).toBe('undefined');
    const i18n = createI18n(resources, {
      defaultLocale: DEFAULT_LOCALE,
      supportedLocales,
    });
    expect(i18n.language).toBe(DEFAULT_LOCALE);
    expect(i18n.hasResourceBundle(DEFAULT_LOCALE, 'ui')).toBe(true);
  });
});
