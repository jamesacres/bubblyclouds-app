/**
 * @jest-environment node
 */
import { createI18n } from '@bubblyclouds-app/ui/config/i18n';
import {
  DEFAULT_LOCALE,
  localeLoaders,
  resources,
  supportedLocales,
} from './i18n';

describe('i18n', () => {
  it('supports English plus only the registered loaders', () => {
    expect(DEFAULT_LOCALE).toBe('en');
    expect(supportedLocales).toEqual([
      DEFAULT_LOCALE,
      ...Object.keys(localeLoaders),
    ]);
  });

  it('registers the pseudo-locales outside production', () => {
    expect(Object.keys(localeLoaders)).toEqual(
      expect.arrayContaining(['ar-XB', 'en-XA'])
    );
  });

  it('does not register the pseudo-locales in production', () => {
    const replaced = jest.replaceProperty(
      process.env,
      'NODE_ENV',
      'production'
    );
    jest.isolateModules(() => {
      const production = require('./i18n');
      expect(production.supportedLocales).not.toContain('en-XA');
      expect(production.supportedLocales).not.toContain('ar-XB');
      expect(Object.keys(production.localeLoaders)).not.toContain('en-XA');
    });
    replaced.restore();
  });

  it.each(['en-XA', 'ar-XB'] as const)(
    'loads every namespace for %s',
    async (tag) => {
      const loader = localeLoaders[tag];
      expect(loader).toBeDefined();
      const bundles = await loader?.();
      expect(Object.keys(bundles ?? {}).sort()).toEqual(
        Object.keys(resources[DEFAULT_LOCALE]).sort()
      );
    }
  );

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
