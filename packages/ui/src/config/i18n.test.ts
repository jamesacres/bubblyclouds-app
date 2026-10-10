/**
 * @jest-environment node
 */
import {
  addLocaleBundles,
  buildFallbackMap,
  createI18n,
  createLocaleLoader,
} from './i18n';

describe('createI18n', () => {
  const resources = {
    en: { app: { greeting: 'Hello {{name}}' }, ui: { close: 'Close' } },
    fr: { app: { greeting: 'Bonjour {{name}}' }, ui: { close: 'Fermer' } },
  };

  it('works without a DOM', () => {
    expect(typeof document).toBe('undefined');
    const i18n = createI18n(resources);
    expect(i18n.t('greeting', { name: 'Ada' })).toBe('Hello Ada');
  });

  it('is synchronous', () => {
    const i18n = createI18n(resources);
    expect(i18n.isInitialized).toBe(true);
  });

  it('reads from namespaces', () => {
    const i18n = createI18n(resources);
    expect(i18n.t('close', { ns: 'ui' })).toBe('Close');
  });

  it('honours the requested locale', () => {
    const i18n = createI18n(resources, { locale: 'fr' });
    expect(i18n.t('greeting', { name: 'Ada' })).toBe('Bonjour Ada');
  });

  it('falls back to the default locale for missing keys', () => {
    const i18n = createI18n(
      { en: { app: { only: 'English only' } }, fr: { app: {} } },
      { locale: 'fr' }
    );
    expect(i18n.t('only')).toBe('English only');
  });

  it('does not escape interpolated values', () => {
    const i18n = createI18n(resources);
    expect(i18n.t('greeting', { name: '<b>' })).toBe('Hello <b>');
  });

  it('returns the key for unknown keys', () => {
    const i18n = createI18n(resources);
    expect(i18n.t('missing')).toBe('missing');
  });

  it('creates independent instances', () => {
    const first = createI18n(resources, { locale: 'fr' });
    const second = createI18n(resources);
    expect(first).not.toBe(second);
    expect(second.language).toBe('en');
  });

  it('adds locale bundles after init', () => {
    const i18n = createI18n(resources, {
      supportedLocales: ['en', 'fr', 'de'],
    });
    addLocaleBundles(i18n, 'de', {
      app: { greeting: 'Hallo {{name}}' },
      ui: { close: 'Schliessen' },
    });
    i18n.changeLanguage('de');
    expect(i18n.t('greeting', { name: 'Ada' })).toBe('Hallo Ada');
    expect(i18n.t('close', { ns: 'ui' })).toBe('Schliessen');
  });

  it('follows the regional fallback chain before English', () => {
    const i18n = createI18n(
      {
        en: { app: { a: 'en a', b: 'en b', c: 'en c' } },
        es: { app: { a: 'es a', b: 'es b' } },
        'es-MX': { app: { a: 'mx a' } },
      },
      { locale: 'es-MX', supportedLocales: ['en', 'es', 'es-MX'] }
    );
    expect(i18n.t('a')).toBe('mx a');
    expect(i18n.t('b')).toBe('es b');
    expect(i18n.t('c')).toBe('en c');
  });

  it('only supports the listed locales', () => {
    const i18n = createI18n(resources, { supportedLocales: ['en'] });
    expect(i18n.options.supportedLngs).toContain('en');
    expect(i18n.options.supportedLngs).not.toContain('fr');
  });
});

describe('buildFallbackMap', () => {
  it('ends every chain with the default locale', () => {
    expect(
      buildFallbackMap(
        ['en', 'es', 'es-MX', 'fr-CA', 'fr', 'zh-Hant', 'zh-Hans', 'nb'],
        'en'
      )
    ).toEqual({
      default: ['en'],
      es: ['en'],
      'es-MX': ['es', 'en'],
      'fr-CA': ['fr', 'en'],
      fr: ['en'],
      'zh-Hant': ['en'],
      'zh-Hans': ['en'],
      nb: ['en'],
    });
  });

  it('skips unsupported intermediate tags', () => {
    expect(buildFallbackMap(['en', 'pt-PT'], 'en')['pt-PT']).toEqual(['en']);
  });
});

describe('createLocaleLoader', () => {
  it('assembles bundles from the default exports of the modules', async () => {
    const loader = createLocaleLoader({
      ui: () => Promise.resolve({ default: { close: 'Fermer' } }),
      app: () => Promise.resolve({ default: { greeting: 'Bonjour' } }),
    });
    await expect(loader()).resolves.toEqual({
      ui: { close: 'Fermer' },
      app: { greeting: 'Bonjour' },
    });
  });

  it('rejects when a module fails to load', async () => {
    const loader = createLocaleLoader({
      ui: () => Promise.reject(new Error('chunk failed')),
    });
    await expect(loader()).rejects.toThrow('chunk failed');
  });
});
