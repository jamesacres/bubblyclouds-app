import {
  calculateCompletionPercentage,
  calculateCompletionPercentageFromState,
} from './calculateCompletionPercentage';
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

describe('calculateCompletionPercentage', () => {
  it('is 0 with the primary piece at the left edge', () => {
    expect(calculateCompletionPercentage(START, FINAL, START)).toBe(0);
  });

  it('is distance-based, not move-based', () => {
    expect(calculateCompletionPercentage(START, FINAL, atColumn(1))).toBe(25);
    expect(calculateCompletionPercentage(START, FINAL, atColumn(2))).toBe(50);
    expect(calculateCompletionPercentage(START, FINAL, atColumn(3))).toBe(75);
  });

  it('is 100 at the exit', () => {
    expect(calculateCompletionPercentage(START, FINAL, atColumn(4))).toBe(100);
  });

  it('falls back to the initial board when no answer yet', () => {
    expect(calculateCompletionPercentage(START, FINAL, undefined)).toBe(0);
  });

  it('returns 0 for an unparseable board', () => {
    expect(calculateCompletionPercentage(START, FINAL, 'nonsense')).toBe(0);
  });
});

describe('calculateCompletionPercentageFromState', () => {
  it('uses the latest answer from the stack', () => {
    expect(
      calculateCompletionPercentageFromState({
        initial: START,
        final: FINAL,
        answerStack: [START, atColumn(2)],
      })
    ).toBe(50);
  });
});
