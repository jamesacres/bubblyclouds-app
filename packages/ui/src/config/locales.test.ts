import { LOCALE_TAGS, PSEUDO_LOCALE_TAGS } from './locales';

describe('locale tags', () => {
  it('lists each planned locale once', () => {
    expect(new Set(LOCALE_TAGS).size).toBe(LOCALE_TAGS.length);
    expect(LOCALE_TAGS).toHaveLength(46);
  });

  it('uses nb for Norwegian and keeps English out of the lazy set', () => {
    expect(LOCALE_TAGS).toContain('nb');
    expect(LOCALE_TAGS).not.toContain('no');
    expect(LOCALE_TAGS).not.toContain('en');
  });

  it('keeps pseudo-locales separate', () => {
    expect(PSEUDO_LOCALE_TAGS).toEqual(['en-XA', 'ar-XB']);
  });
});
