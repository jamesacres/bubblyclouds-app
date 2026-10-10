/**
 * @jest-environment node
 */
import { createI18n } from './i18n';

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
});
