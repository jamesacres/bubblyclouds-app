import { GameState } from '../types/state';

// One puzzle in a chained run (SPEC.md §6): the board string doubles as the
// puzzle identifier, paired with its seed-data known-optimal move count.
export interface RunStage {
  boardString: string;
  movesRequired: number;
}

// Per-stage completion detail (time + moves) shown both on the tick-off
// marker in the stage-preview strip and in the inline results panel.
export interface StageResult {
  seconds: number;
  movesMade: number;
  movesRequired: number;
}

const readCompletedState = (
  app: string,
  boardString: string
): GameState | undefined => {
  try {
    const stored = localStorage.getItem(`${app}-${boardString}`);
    if (!stored) {
      return undefined;
    }
    const parsed = JSON.parse(stored) as { state?: GameState };
    return parsed.state?.completed ? parsed.state : undefined;
  } catch {
    return undefined;
  }
};

// Restore mid-run progress from the sessions saved per stage (SPEC.md §4):
// resume at the first stage without a completed local session.
export const firstIncompleteStage = (
  app: string,
  stages: RunStage[]
): number => {
  if (typeof window === 'undefined') {
    return 0;
  }
  for (let i = 0; i < stages.length; i++) {
    if (!readCompletedState(app, stages[i].boardString)) {
      return i;
    }
  }
  return stages.length - 1;
};

// Which stages already have a completed local session, and how well they
// went — drives the tick-off marker in the stage strip and the results
// panel. Re-derived from storage (not just in-session state) so stages
// completed in a prior visit are shown too, matching firstIncompleteStage's
// restore source.
export const completedStagesFromStorage = (
  app: string,
  stages: RunStage[]
): Map<number, StageResult> => {
  const completedStages = new Map<number, StageResult>();
  if (typeof window === 'undefined') {
    return completedStages;
  }
  stages.forEach((stage, i) => {
    const state = readCompletedState(app, stage.boardString);
    if (state?.completed) {
      const movesMade = Number(state.metadata?.movesMade);
      completedStages.set(i, {
        seconds: state.completed.seconds,
        movesMade: Number.isFinite(movesMade) ? movesMade : 0,
        movesRequired: stage.movesRequired,
      });
    }
  });
  return completedStages;
};
