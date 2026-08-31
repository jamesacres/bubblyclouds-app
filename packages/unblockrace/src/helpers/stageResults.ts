import { RunStage as GenericRunStage } from '@bubblyclouds-app/games/types/runTypes';
import { GameState } from '../types/state';

// One puzzle in a chained run (SPEC.md §6): the board string doubles as the
// puzzle identifier (stageId), paired with its seed-data known-optimal move
// count.
export interface RunStage extends GenericRunStage {
  movesRequired: number;
}

// Unblock Race's per-stage score: moves made graded against the stage's par.
// movesMade is undefined when the synced session predates move-count
// metadata and the answer stack alone yields 0 (nothing meaningful to show).
export interface StageScore {
  movesMade?: number;
  movesRequired: number;
}

// The persisted metadata.movesMade is read directly (not reconciled against
// the answer stack the way movesMadeFromState does) — a completed session's
// metadata is always the authoritative final count by the time it's stored,
// so a missing/unparseable value here means genuinely no move count was
// ever recorded, not that the stack needs to be trusted instead. Always
// defined (defaults to 0), unlike runResults.ts's own extractScore.
export const extractScore = (
  state: GameState,
  stage: RunStage
): { movesMade: number; movesRequired: number } => {
  const movesMade = Number(state.metadata?.movesMade);
  return {
    movesMade: Number.isFinite(movesMade) ? movesMade : 0,
    movesRequired: stage.movesRequired,
  };
};
