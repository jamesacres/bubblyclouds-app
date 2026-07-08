import { calculateStatsDisplayFromState } from './calculateStatsDisplay';

const START = ['oooooo', 'oooooo', 'AAoooo', 'oooooo', 'oooooo', 'oooooo'].join(
  ''
);

describe('calculateStatsDisplayFromState', () => {
  it('is undefined before any move is made', () => {
    expect(
      calculateStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START],
        metadata: {},
      })
    ).toBeUndefined();
  });

  it('shows the persisted move count, singular for one move', () => {
    expect(
      calculateStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START],
        metadata: { movesMade: '1' },
      })
    ).toBe('1 move');
  });

  it('marks under-par completion with a star', () => {
    expect(
      calculateStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START, START],
        metadata: { movesMade: '2', movesRequired: '4' },
      })
    ).toBe('2 moves 🌟');
  });

  it('marks exact-par completion with a check', () => {
    expect(
      calculateStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START, START, START, START],
        metadata: { movesMade: '4', movesRequired: '4' },
      })
    ).toBe('4 moves ✓');
  });

  it('marks over-par completion with a warning', () => {
    expect(
      calculateStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START],
        metadata: { movesMade: '5', movesRequired: '4' },
      })
    ).toBe('5 moves ⚠️');
  });

  it('falls back to the answer stack length when movesMade is missing', () => {
    expect(
      calculateStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START, START],
        metadata: {},
      })
    ).toBe('2 moves');
  });
});
