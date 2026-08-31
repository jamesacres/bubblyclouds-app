import { calculateCompletionPercentageFromState } from './calculateCompletionPercentage';
import { solvedBoardString } from './boardToString';

const START = ['oooooo', 'oooooo', 'AAoooo', 'oooooo', 'oooooo', 'oooooo'].join(
  ''
);
const FINAL = solvedBoardString(START);

const atColumn = (col: number): string =>
  [
    'oooooo',
    'oooooo',
    `${'o'.repeat(col)}AA${'o'.repeat(4 - col)}`,
    'oooooo',
    'oooooo',
    'oooooo',
  ].join('');

describe('calculateCompletionPercentageFromState', () => {
  it('is 0 before any move is made', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [START],
        metadata: { movesRequired: '4' },
      })
    ).toBe(0);
  });

  it('is moves-based, not distance-based', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [START, atColumn(1)],
        metadata: { movesRequired: '4' },
      })
    ).toBe(25);
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [START, atColumn(1), atColumn(2), atColumn(3)],
        metadata: { movesRequired: '4' },
      })
    ).toBe(75);
  });

  it('prefers the persisted move count over the truncated stack', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [atColumn(1), atColumn(2)],
        metadata: { movesRequired: '10', movesMade: '6' },
      })
    ).toBe(60);
  });

  it('caps at 99 when at or over the optimal count but unsolved', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [atColumn(3)],
        metadata: { movesRequired: '4', movesMade: '4' },
      })
    ).toBe(99);
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [atColumn(3)],
        metadata: { movesRequired: '4', movesMade: '9' },
      })
    ).toBe(99);
  });

  it('is 100 only when the primary piece is at the exit', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [START, atColumn(4)],
        metadata: { movesRequired: '4', movesMade: '1' },
      })
    ).toBe(100);
  });

  it('is 100 for a completed session', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [atColumn(3)],
        completed: { at: new Date().toISOString(), seconds: 30 },
        metadata: { movesRequired: '4', movesMade: '3' },
      })
    ).toBe(100);
  });

  it('falls back to distance-based progress without a known-optimal count', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [START, atColumn(2)],
      })
    ).toBe(50);
  });

  it('falls back to the initial board with an empty stack', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [],
        metadata: { movesRequired: '4' },
      })
    ).toBe(0);
  });

  it('returns 0 for an unparseable board', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: ['nonsense'],
        metadata: { movesRequired: '4' },
      })
    ).toBe(0);
  });
});
