import { calculateProgressStatsDisplayFromState } from './calculateProgressStatsDisplay';

const START = ['oooooo', 'oooooo', 'AAoooo', 'oooooo', 'oooooo', 'oooooo'].join(
  ''
);

describe('calculateProgressStatsDisplayFromState', () => {
  it('shows the running count against par from move zero', () => {
    expect(
      calculateProgressStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START],
        metadata: { movesMade: '0', movesRequired: '24' },
      })
    ).toBe('0/24 moves ⚡');
  });

  it('reflects the persisted move count part-way through', () => {
    expect(
      calculateProgressStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START, START, START],
        metadata: { movesMade: '3', movesRequired: '24' },
      })
    ).toBe('3/24 moves ⚡');
  });

  it('adds a warning once over par', () => {
    expect(
      calculateProgressStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START],
        metadata: { movesMade: '26', movesRequired: '24' },
      })
    ).toBe('26/24 moves ⚡ ⚠️');
  });

  it('falls back to the answer stack length when movesMade is missing', () => {
    expect(
      calculateProgressStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START, START],
        metadata: { movesRequired: '24' },
      })
    ).toBe('2/24 moves ⚡');
  });

  it('is undefined when the par is unknown', () => {
    expect(
      calculateProgressStatsDisplayFromState({
        initial: START,
        final: START,
        answerStack: [START, START],
        metadata: { movesMade: '1' },
      })
    ).toBeUndefined();
  });
});
