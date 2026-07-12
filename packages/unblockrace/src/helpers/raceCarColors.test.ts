import { CURRENT_PLAYER_CAR_COLOR, getRaceCarColor } from './raceCarColors';

describe('getRaceCarColor', () => {
  it('gives the current player the theme colour', () => {
    expect(getRaceCarColor('me', ['me', 'them'], true)).toBe(
      CURRENT_PLAYER_CAR_COLOR
    );
  });

  it('never gives an opponent the theme colour class', () => {
    const allUserIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (const userId of allUserIds) {
      expect(getRaceCarColor(userId, allUserIds, false, 'blue')).not.toBe(
        CURRENT_PLAYER_CAR_COLOR
      );
    }
  });

  it('skips palette entries that clash with the theme', () => {
    // fuchsia clashes with the fuchsia theme, so it's excluded from the
    // filtered palette entirely
    const allUserIds = ['a', 'b'];
    expect(getRaceCarColor('a', allUserIds, false, 'fuchsia')).not.toBe(
      'bg-fuchsia-500'
    );
    expect(getRaceCarColor('b', allUserIds, false, 'fuchsia')).not.toBe(
      'bg-fuchsia-500'
    );
  });

  it('assigns consistent colours based on position in allUserIds', () => {
    const allUserIds = ['a', 'b', 'c'];
    expect(getRaceCarColor('b', allUserIds, false)).toBe(
      getRaceCarColor('b', allUserIds, false)
    );
  });

  it('falls back to the first palette entry for an unknown user', () => {
    expect(getRaceCarColor('unknown', ['a', 'b'], false)).toBe(
      'bg-fuchsia-500'
    );
  });
});
