import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { ServerState } from '../types/state';
import { RunStage, StageResult } from './stageResults';
import { isPuzzleCheated } from './cheatDetection';
import { movesMadeFromState } from './calculateStatsDisplay';

// One completed stage on a player's leaderboard line: their time and their
// move count graded against the stage's par (movesRequired). movesMade is
// undefined when the synced session predates move-count metadata.
export interface PlayerStageResult {
  seconds: number;
  movesMade?: number;
  movesRequired: number;
}

// One player's line on the end-of-stage leaderboard: their result for each
// stage of the run (undefined until they complete that stage fairly) plus
// the running totals across the stages they have finished — the final
// stage's totals are the whole run added together.
export interface PlayerRunResult {
  userId: string;
  isCurrentUser: boolean;
  stageResults: (PlayerStageResult | undefined)[];
  totalSeconds: number;
  totalMoves: number;
  // Moves over (+) or under (−) par, summed across the completed stages with
  // a known move count — the "how far off par" verdict for the run so far.
  totalMovesDelta: number;
  completedStageCount: number;
}

// Fold the per-stage server sessions (runStageParties, keyed by stage puzzle
// id) and the current user's own local results into one leaderboard line per
// player. Own results come from local storage first so the player's line is
// right even before the server echoes their finished session back. Players
// with no completed stage yet are omitted — the live race strip already
// covers in-progress positions.
export const calculateRunResults = ({
  stages,
  runStageParties,
  userId,
  ownResults,
}: {
  stages: RunStage[];
  runStageParties: { [stageId: string]: Parties<Session<ServerState>> };
  userId?: string;
  ownResults: Map<number, StageResult>;
}): PlayerRunResult[] => {
  const linesByUser = new Map<string, (PlayerStageResult | undefined)[]>();
  const lineFor = (memberId: string): (PlayerStageResult | undefined)[] => {
    let line = linesByUser.get(memberId);
    if (!line) {
      line = new Array<PlayerStageResult | undefined>(stages.length).fill(
        undefined
      );
      linesByUser.set(memberId, line);
    }
    return line;
  };

  stages.forEach((stage, stageIndex) => {
    const parties = runStageParties[stage.boardString];
    for (const party of Object.values(parties || {})) {
      for (const [memberId, session] of Object.entries(
        party?.memberSessions || {}
      )) {
        if (memberId === userId) {
          continue;
        }
        const seconds = session?.state.completed?.seconds;
        if (
          session &&
          seconds !== undefined &&
          !isPuzzleCheated(session.state.answerStack)
        ) {
          const movesMade = movesMadeFromState(session.state);
          lineFor(memberId)[stageIndex] = {
            seconds,
            movesMade: movesMade > 0 ? movesMade : undefined,
            movesRequired: stage.movesRequired,
          };
        }
      }
    }
  });

  if (userId) {
    const ownLine = lineFor(userId);
    stages.forEach((stage, stageIndex) => {
      const ownResult = ownResults.get(stageIndex);
      ownLine[stageIndex] = ownResult
        ? {
            seconds: ownResult.seconds,
            movesMade: ownResult.movesMade,
            movesRequired: stage.movesRequired,
          }
        : undefined;
    });
  }

  return [...linesByUser.entries()]
    .map(([memberId, stageResults]) => {
      const completedResults = stageResults.filter(
        (stageResult): stageResult is PlayerStageResult =>
          stageResult !== undefined
      );
      return {
        userId: memberId,
        isCurrentUser: memberId === userId,
        stageResults,
        totalSeconds: completedResults.reduce(
          (sum, stageResult) => sum + stageResult.seconds,
          0
        ),
        totalMoves: completedResults.reduce(
          (sum, stageResult) => sum + (stageResult.movesMade || 0),
          0
        ),
        totalMovesDelta: completedResults.reduce(
          (sum, stageResult) =>
            stageResult.movesMade !== undefined
              ? sum + stageResult.movesMade - stageResult.movesRequired
              : sum,
          0
        ),
        completedStageCount: completedResults.length,
      };
    })
    .filter((result) => result.completedStageCount > 0)
    .sort(
      (a, b) =>
        b.completedStageCount - a.completedStageCount ||
        a.totalSeconds - b.totalSeconds ||
        a.userId.localeCompare(b.userId)
    );
};
