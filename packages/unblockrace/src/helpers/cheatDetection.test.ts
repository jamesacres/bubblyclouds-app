import { isPuzzleCheated } from './cheatDetection';
import { ServerState } from '../types/state';

const START = ['oooooo', 'oooooo', 'AAoBoo', 'oooBoo', 'oooooo', 'oooooo'].join(
  ''
);

// A moved right one step
const A_MOVED = [
  'oooooo',
  'oooooo',
  'oAABoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');

// A and B both moved in a single transition
const BOTH_MOVED = [
  'oooooo',
  'oooBoo',
  'oAABoo',
  'oooooo',
  'oooooo',
  'oooooo',
].join('');

describe('isPuzzleCheated', () => {
  it('accepts a single-piece transition', () => {
    expect(isPuzzleCheated([START, A_MOVED])).toBe(false);
  });

  it('flags a transition where two pieces moved', () => {
    expect(isPuzzleCheated([START, BOTH_MOVED])).toBe(true);
  });

  it('needs at least two snapshots', () => {
    expect(isPuzzleCheated([START])).toBe(false);
  });

  it('ignores incomplete server states', () => {
    const state: ServerState = {
      initial: START,
      final: START,
      answerStack: [START, BOTH_MOVED],
    };
    expect(isPuzzleCheated(state)).toBe(false);
  });

  it('flags completed server states that jumped', () => {
    const state: ServerState = {
      initial: START,
      final: START,
      answerStack: [START, BOTH_MOVED],
      completed: { at: new Date().toISOString(), seconds: 1 },
    };
    expect(isPuzzleCheated(state)).toBe(true);
  });
});
