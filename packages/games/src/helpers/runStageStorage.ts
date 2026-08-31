import { PlayerStageResult } from '../types/scoringTypes';
import { RunStage } from '../types/runTypes';

// The minimal shape any game's persisted puzzle state must have for the
// run-stage storage helpers below to recognise a completed stage — the rest
// of the state (and any score-specific fields within it) is opaque here and
// left to the caller's own extractScore callback.
export interface CompletedStageState {
  completed?: { seconds: number };
}

const readCompletedState = <State extends CompletedStageState>(
  app: string,
  stageId: string
): State | undefined => {
  try {
    const stored = localStorage.getItem(`${app}-${stageId}`);
    if (!stored) {
      return undefined;
    }
    const parsed = JSON.parse(stored) as { state?: State };
    return parsed.state?.completed ? parsed.state : undefined;
  } catch {
    return undefined;
  }
};

// Restore mid-run progress from the sessions saved per stage: resume at the
// first stage without a completed local session.
export const firstIncompleteStage = <
  Stage extends RunStage,
  State extends CompletedStageState,
>(
  app: string,
  stages: Stage[]
): number => {
  if (typeof window === 'undefined') {
    return 0;
  }
  for (let i = 0; i < stages.length; i++) {
    if (!readCompletedState<State>(app, stages[i].stageId)) {
      return i;
    }
  }
  return stages.length - 1;
};

// Which stages already have a completed local session, and how well they
// went — drives the tick-off marker in a stage strip and any results panel.
// Re-derived from storage (not just in-session state) so stages completed in
// a prior visit are shown too, matching firstIncompleteStage's restore
// source. extractScore turns a completed state into the game's own Score
// shape; this helper never looks inside the score itself.
export const completedStagesFromStorage = <
  Stage extends RunStage,
  State extends CompletedStageState,
  Score,
>(
  app: string,
  stages: Stage[],
  extractScore: (state: State, stage: Stage) => Score
): Map<number, PlayerStageResult<Score>> => {
  const completedStages = new Map<number, PlayerStageResult<Score>>();
  if (typeof window === 'undefined') {
    return completedStages;
  }
  stages.forEach((stage, i) => {
    const state = readCompletedState<State>(app, stage.stageId);
    if (state?.completed) {
      completedStages.set(i, {
        seconds: state.completed.seconds,
        score: extractScore(state, stage),
      });
    }
  });
  return completedStages;
};
