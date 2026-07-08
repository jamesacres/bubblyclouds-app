import {
  completedStagesFromStorage,
  firstIncompleteStage,
  RunStage,
} from './stageResults';
import { solvedBoardString } from './boardToString';

const STAGE_1 = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');
const STAGE_2 = [
  'oooooo',
  'oooooo',
  'oAAoBo',
  'ooooBo',
  'oooooo',
  'oooooo',
].join('');

const stages: RunStage[] = [
  { boardString: STAGE_1, movesRequired: 3 },
  { boardString: STAGE_2, movesRequired: 5 },
];

const storeCompleted = (
  boardString: string,
  seconds: number,
  movesMade?: string
) => {
  window.localStorage.setItem(
    `unblockrace-${boardString}`,
    JSON.stringify({
      state: {
        initial: boardString,
        answerStack: [solvedBoardString(boardString)],
        completed: { at: new Date().toISOString(), seconds },
        ...(movesMade ? { metadata: { movesMade } } : {}),
      },
    })
  );
};

describe('stageResults', () => {
  beforeEach(() => window.localStorage.clear());

  describe('firstIncompleteStage', () => {
    it('is 0 when nothing is stored', () => {
      expect(firstIncompleteStage('unblockrace', stages)).toBe(0);
    });

    it('skips a completed leading stage', () => {
      storeCompleted(STAGE_1, 30);
      expect(firstIncompleteStage('unblockrace', stages)).toBe(1);
    });

    it('clamps to the last stage when every stage is complete', () => {
      storeCompleted(STAGE_1, 30);
      storeCompleted(STAGE_2, 40);
      expect(firstIncompleteStage('unblockrace', stages)).toBe(1);
    });
  });

  describe('completedStagesFromStorage', () => {
    it('collects seconds and moves for completed stages only', () => {
      storeCompleted(STAGE_1, 30, '4');
      const map = completedStagesFromStorage('unblockrace', stages);
      expect(map.get(0)).toEqual({
        seconds: 30,
        movesMade: 4,
        movesRequired: 3,
      });
      expect(map.has(1)).toBe(false);
    });

    it('defaults moves to 0 when metadata is missing', () => {
      storeCompleted(STAGE_1, 30);
      expect(completedStagesFromStorage('unblockrace', stages).get(0)).toEqual({
        seconds: 30,
        movesMade: 0,
        movesRequired: 3,
      });
    });

    it('ignores unparsable storage entries', () => {
      window.localStorage.setItem(`unblockrace-${STAGE_1}`, 'not json');
      expect(completedStagesFromStorage('unblockrace', stages).size).toBe(0);
    });
  });
});
