import {
  calculateStatsDisplayFromState,
  movesDisplayFromState,
} from './calculateStatsDisplay';

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

  it('names the difference for under-par completion', () => {
    expect(
      calculateStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START, START],
        metadata: { movesMade: '2', movesRequired: '4' },
      })
    ).toBe('2 moves · 2 under par');
  });

  it('marks exact-par completion as par', () => {
    expect(
      calculateStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START, START, START, START],
        metadata: { movesMade: '4', movesRequired: '4' },
      })
    ).toBe('4 moves · par');
  });

  it('names the difference for over-par completion', () => {
    expect(
      calculateStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START],
        metadata: { movesMade: '5', movesRequired: '4' },
      })
    ).toBe('5 moves · 1 over par');
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

describe('movesDisplayFromState', () => {
  it('returns the structured moves-vs-par for a session with par metadata', () => {
    expect(
      movesDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START],
        metadata: { movesMade: '5', movesRequired: '4' },
      })
    ).toEqual({ movesMade: 5, movesRequired: 4 });
  });

  it('is undefined without moves or without a par to grade against', () => {
    expect(
      movesDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START],
        metadata: { movesRequired: '4' },
      })
    ).toBeUndefined();
    expect(
      movesDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START],
        metadata: { movesMade: '2' },
      })
    ).toBeUndefined();
  });
});
