import { fallbackTags, resolveLocale } from './resolveLocale';

describe('resolveLocale', () => {
  const supported = ['en', 'fr', 'zh-CN', 'pt-PT'];

  it.each([
    [['fr'], 'fr'],
    [['FR'], 'fr'],
    [['zh_cn'], 'zh-CN'],
    [['zh-cn'], 'zh-CN'],
    [['en-GB'], 'en'],
    [['fr-CA', 'en'], 'fr'],
    [['de', 'fr'], 'fr'],
    [['zh-Hans-CN'], 'zh-CN'],
    [['pt-BR'], 'pt-PT'],
    [['de', 'es'], 'en'],
    [[], 'en'],
    [['', '  '], 'en'],
  ])('resolves %j to %s', (candidates, expected) => {
    expect(resolveLocale(candidates, supported, 'en')).toBe(expected);
  });

  it('prefers the exact tag over a same-language sibling', () => {
    expect(resolveLocale(['zh-TW'], ['zh-CN', 'zh-TW'], 'en')).toBe('zh-TW');
  });

  it('prefers the shared region among same-language locales', () => {
    expect(resolveLocale(['zh-Hant-TW'], ['zh-CN', 'zh-TW'], 'en')).toBe(
      'zh-TW'
    );
  });

  it('prefers the bare language over a regional sibling', () => {
    expect(resolveLocale(['en-AU'], ['en-US', 'en'], 'xx')).toBe('en');
  });

  it('honours candidate preference order before falling back', () => {
    expect(resolveLocale(['it', 'fr-FR', 'en'], supported, 'en')).toBe('fr');
  });

  it('returns the fallback when nothing matches', () => {
    expect(resolveLocale(['ja'], supported, 'fr')).toBe('fr');
  });

  describe('with the app locale set', () => {
    const appLocales = [
      'en',
      'es',
      'es-MX',
      'fr',
      'fr-CA',
      'nb',
      'pt',
      'pt-PT',
      'zh-Hans',
      'zh-Hant',
      'he',
      'id',
    ];

    it.each([
      ['no', 'nb'],
      ['NO', 'nb'],
      ['nn', 'nb'],
      ['nb', 'nb'],
      ['nb-NO', 'nb'],
      ['no_NO', 'nb'],
      ['nn-NO', 'nb'],
      ['zh', 'zh-Hans'],
      ['zh-CN', 'zh-Hans'],
      ['zh_cn', 'zh-Hans'],
      ['zh-SG', 'zh-Hans'],
      ['zh-Hans', 'zh-Hans'],
      ['zh-Hans-CN', 'zh-Hans'],
      ['zh-TW', 'zh-Hant'],
      ['zh-HK', 'zh-Hant'],
      ['zh-MO', 'zh-Hant'],
      ['zh-Hant', 'zh-Hant'],
      ['zh-Hant-HK', 'zh-Hant'],
      ['zh-hant-tw', 'zh-Hant'],
      ['es', 'es'],
      ['es-ES', 'es'],
      ['es-MX', 'es-MX'],
      ['es_mx', 'es-MX'],
      ['es-419', 'es'],
      ['es-AR', 'es'],
      ['fr', 'fr'],
      ['fr-FR', 'fr'],
      ['fr-CA', 'fr-CA'],
      ['fr-BE', 'fr'],
      ['pt', 'pt'],
      ['pt-BR', 'pt'],
      ['pt-PT', 'pt-PT'],
      ['pt-AO', 'pt'],
      ['en-GB', 'en'],
      ['en-US', 'en'],
      ['iw', 'he'],
      ['iw-IL', 'he'],
      ['in', 'id'],
      ['in-ID', 'id'],
      ['de', 'en'],
    ])('resolves %s to %s', (candidate, expected) => {
      expect(resolveLocale([candidate], appLocales, 'en')).toBe(expected);
    });

    it('falls to the base locale when the regional file is not supported', () => {
      const withoutRegional = appLocales.filter(
        (tag) => !['es-MX', 'fr-CA', 'pt-PT', 'zh-Hant'].includes(tag)
      );
      expect(resolveLocale(['es-MX'], withoutRegional, 'en')).toBe('es');
      expect(resolveLocale(['fr-CA'], withoutRegional, 'en')).toBe('fr');
      expect(resolveLocale(['pt-PT'], withoutRegional, 'en')).toBe('pt');
      expect(resolveLocale(['zh-TW'], withoutRegional, 'en')).toBe('zh-Hans');
    });

    it('maps no to a supported no when nb is not available', () => {
      expect(resolveLocale(['no'], ['en', 'no'], 'en')).toBe('no');
    });
  });
});

describe('fallbackTags', () => {
  it.each([
    ['es-MX', ['es-mx', 'es']],
    ['pt', ['pt']],
    ['zh-TW', ['zh-tw', 'zh-hant', 'zh']],
    ['zh-Hant-HK', ['zh-hant-hk', 'zh-hant', 'zh']],
    ['no', ['no', 'nb']],
    ['', []],
  ])('chains %s', (tag, expected) => {
    expect(fallbackTags(tag)).toEqual(expected);
  });
});
