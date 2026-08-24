import {
  completedStagesFromStorage,
  firstIncompleteStage,
  CompletedStageState,
} from './runStageStorage';
import { RunStage } from '../types/runTypes';

interface TestStage extends RunStage {
  par: number;
}

interface TestState extends CompletedStageState {
  metadata?: { movesMade?: string };
}

interface TestScore {
  movesMade: number;
  par: number;
}

const STAGE_1_ID = 'stage-1-board';
const STAGE_2_ID = 'stage-2-board';

const stages: TestStage[] = [
  { stageId: STAGE_1_ID, par: 3 },
  { stageId: STAGE_2_ID, par: 5 },
];

const extractScore = (state: TestState, stage: TestStage): TestScore => {
  const movesMade = Number(state.metadata?.movesMade);
  return {
    movesMade: Number.isFinite(movesMade) ? movesMade : 0,
    par: stage.par,
  };
};

const storeCompleted = (
  app: string,
  stageId: string,
  seconds: number,
  movesMade?: string
) => {
  window.localStorage.setItem(
    `${app}-${stageId}`,
    JSON.stringify({
      state: {
        completed: { at: new Date().toISOString(), seconds },
        ...(movesMade ? { metadata: { movesMade } } : {}),
      },
    })
  );
};

describe('runStageStorage', () => {
  beforeEach(() => window.localStorage.clear());

  describe('firstIncompleteStage', () => {
    it('is 0 when nothing is stored', () => {
      expect(firstIncompleteStage<TestStage, TestState>('app', stages)).toBe(0);
    });

    it('skips a completed leading stage', () => {
      storeCompleted('app', STAGE_1_ID, 30);
      expect(firstIncompleteStage<TestStage, TestState>('app', stages)).toBe(1);
    });

    it('clamps to the last stage when every stage is complete', () => {
      storeCompleted('app', STAGE_1_ID, 30);
      storeCompleted('app', STAGE_2_ID, 40);
      expect(firstIncompleteStage<TestStage, TestState>('app', stages)).toBe(1);
    });
  });

  describe('completedStagesFromStorage', () => {
    it('collects seconds and the extracted score for completed stages only', () => {
      storeCompleted('app', STAGE_1_ID, 30, '4');
      const map = completedStagesFromStorage<TestStage, TestState, TestScore>(
        'app',
        stages,
        extractScore
      );
      expect(map.get(0)).toEqual({
        seconds: 30,
        score: { movesMade: 4, par: 3 },
      });
      expect(map.has(1)).toBe(false);
    });

    it('lets the extractScore callback decide the default when its own state is missing', () => {
      storeCompleted('app', STAGE_1_ID, 30);
      expect(
        completedStagesFromStorage<TestStage, TestState, TestScore>(
          'app',
          stages,
          extractScore
        ).get(0)
      ).toEqual({
        seconds: 30,
        score: { movesMade: 0, par: 3 },
      });
    });

    it('ignores unparsable storage entries', () => {
      window.localStorage.setItem(`app-${STAGE_1_ID}`, 'not json');
      expect(
        completedStagesFromStorage<TestStage, TestState, TestScore>(
          'app',
          stages,
          extractScore
        ).size
      ).toBe(0);
    });

    it('never calls extractScore for a stage with no state at all', () => {
      const spy = jest.fn(extractScore);
      completedStagesFromStorage<TestStage, TestState, TestScore>(
        'app',
        stages,
        spy
      );
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
