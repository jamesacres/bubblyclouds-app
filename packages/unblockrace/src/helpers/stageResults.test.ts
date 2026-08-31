import { extractScore, RunStage } from './stageResults';

const STAGE_1 = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooooo',
].join('');

const stage: RunStage = { stageId: STAGE_1, movesRequired: 3 };

const baseState = { initial: STAGE_1, final: STAGE_1, answerStack: [] };

// extractScore is unblockrace's own scoring logic layered on top of
// @bubblyclouds-app/games's generic completedStagesFromStorage — the generic
// storage mechanics themselves are covered by
// packages/games/src/helpers/runStageStorage.test.ts.
describe('stageResults', () => {
  describe('extractScore', () => {
    it('reads movesMade from state metadata', () => {
      expect(
        extractScore({ ...baseState, metadata: { movesMade: '4' } }, stage)
      ).toEqual({ movesMade: 4, movesRequired: 3 });
    });

    it('defaults movesMade to 0 when metadata is missing', () => {
      expect(extractScore(baseState, stage)).toEqual({
        movesMade: 0,
        movesRequired: 3,
      });
    });

    it('defaults movesMade to 0 when metadata is unparsable', () => {
      expect(
        extractScore(
          { ...baseState, metadata: { movesMade: 'not-a-number' } },
          stage
        )
      ).toEqual({ movesMade: 0, movesRequired: 3 });
    });
  });
});
