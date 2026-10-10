import { resolveLocale } from './resolveLocale';

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
});
