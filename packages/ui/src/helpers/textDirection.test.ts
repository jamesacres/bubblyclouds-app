import { getTextDirection } from './textDirection';

describe('getTextDirection', () => {
  it.each([
    ['en', 'ltr'],
    ['de', 'ltr'],
    ['ja', 'ltr'],
    ['zh-Hans', 'ltr'],
    ['ar', 'rtl'],
    ['he', 'rtl'],
    ['ur', 'rtl'],
    ['fa', 'rtl'],
    ['ar-XB', 'rtl'],
    ['en-XA', 'ltr'],
  ])('%s is %s', (tag, expected) => {
    expect(getTextDirection(tag)).toBe(expected);
  });

  describe('without Intl.Locale text info', () => {
    const original = Intl.Locale;

    beforeEach(() => {
      Object.defineProperty(Intl, 'Locale', {
        value: class {
          constructor() {
            throw new RangeError('unsupported');
          }
        },
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(Intl, 'Locale', {
        value: original,
        configurable: true,
      });
    });

    it.each([
      ['ar', 'rtl'],
      ['he-IL', 'rtl'],
      ['ur_PK', 'rtl'],
      ['fa', 'rtl'],
      ['en', 'ltr'],
      ['ja', 'ltr'],
    ])('falls back to the static list for %s', (tag, expected) => {
      expect(getTextDirection(tag)).toBe(expected);
    });
  });
});
