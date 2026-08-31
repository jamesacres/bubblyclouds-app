import { starRatingForMoves, starRatingFromState } from './starRating';
import { ServerState } from '../types/state';

const START = ['oooooo', 'oooooo', 'AAoBoo', 'oooBoo', 'oooooo', 'oooooo'].join(
  ''
);

const A_MOVED = [
  'oooooo',
  'oooooo',
  'oAABoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');

const BOTH_MOVED = [
  'oooooo',
  'oooBoo',
  'oAABoo',
  'oooooo',
  'oooooo',
  'oooooo',
].join('');

describe('starRatingForMoves', () => {
  it('awards 3 stars at par', () => {
    expect(starRatingForMoves(10, 10)).toBe(3);
  });

  it('awards 3 stars under par', () => {
    expect(starRatingForMoves(8, 10)).toBe(3);
  });

  it('awards 2 stars within the tolerance band above par', () => {
    // par 10 → tolerance max(2, ceil(2.5)) = 3 → 2★ up to 13
    expect(starRatingForMoves(13, 10)).toBe(2);
  });

  it('uses a minimum tolerance of 2 for small pars', () => {
    // par 4 → tolerance max(2, ceil(1)) = 2 → 2★ up to 6, 1★ at 7
    expect(starRatingForMoves(6, 4)).toBe(2);
    expect(starRatingForMoves(7, 4)).toBe(1);
  });

  it('awards 1 star well above par', () => {
    expect(starRatingForMoves(20, 10)).toBe(1);
  });
});

describe('starRatingFromState', () => {
  const completedState = (
    overrides: Partial<ServerState> = {}
  ): ServerState => ({
    initial: START,
    final: A_MOVED,
    answerStack: [START, A_MOVED],
    completed: { at: new Date().toISOString(), seconds: 30 },
    metadata: { movesRequired: '1', movesMade: '1' },
    ...overrides,
  });

  it('returns undefined when not completed', () => {
    expect(
      starRatingFromState(completedState({ completed: undefined }))
    ).toBeUndefined();
  });

  it('returns undefined when par is unknown', () => {
    expect(
      starRatingFromState(completedState({ metadata: { movesMade: '1' } }))
    ).toBeUndefined();
  });

  it('returns undefined when the solve was cheated', () => {
    expect(
      starRatingFromState(
        completedState({
          answerStack: [START, BOTH_MOVED],
          metadata: { movesRequired: '1', movesMade: '1' },
        })
      )
    ).toBeUndefined();
  });

  it('grades a clean completed solve', () => {
    expect(
      starRatingFromState(
        completedState({ metadata: { movesRequired: '1', movesMade: '1' } })
      )
    ).toBe(3);
  });
});
