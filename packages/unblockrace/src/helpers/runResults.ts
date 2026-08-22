import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import {
  PlayerRunResult,
  PlayerStageResult,
} from '@bubblyclouds-app/games/types/scoringTypes';
import { ServerState } from '../types/state';
import { RunStage, StageResult } from './stageResults';
import { isPuzzleCheated } from './cheatDetection';
import { movesMadeFromState } from './calculateStatsDisplay';

// A local AI agent's deterministic run so far: its precomputed per-stage
// results, recorded as the run reaches the end of each stage.
export interface AgentRunInput {
  agentId: string;
  name: string;
  emoji?: string;
  stageResults: Map<number, PlayerStageResult>;
}

// Fold the per-stage server sessions (runStageParties, keyed by stage puzzle
// id) and the current user's own local results into one leaderboard line per
// player. Own results come from local storage first so the player's line is
// right even before the server echoes their finished session back. Players
// with no completed stage yet are omitted — the live race strip already
// covers in-progress positions.
const runTotals = (stageResults: (PlayerStageResult | undefined)[]) => {
  const completedResults = stageResults.filter(
    (stageResult): stageResult is PlayerStageResult => stageResult !== undefined
  );
  return {
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
};

// Which stage each OTHER party member is currently present on — the latest
// stage index where we've seen any session for them, completed or still in
// progress. Separate from calculateRunResults, which only ever records a
// stage once it's completed (so the leaderboard's per-stage times stay
// finished-only): a friend actively playing an earlier stage the current
// user has already moved past would otherwise have no session data anywhere
// (they haven't finished it, so calculateRunResults filters them out
// entirely) and show as offline. This only tells the Lobby/track "they're
// here, on stage N" — never a stage time.
export const calculatePresenceStageByUserId = ({
  stages,
  runStageParties,
  userId,
}: {
  stages: RunStage[];
  runStageParties: { [stageId: string]: Parties<Session<ServerState>> };
  userId?: string;
}): Map<string, number> => {
  const presenceByUserId = new Map<string, number>();
  stages.forEach((stage, stageIndex) => {
    const parties = runStageParties[stage.boardString];
    for (const party of Object.values(parties || {})) {
      for (const memberId of Object.keys(party?.memberSessions || {})) {
        if (memberId === userId) {
          continue;
        }
        const currentLatest = presenceByUserId.get(memberId);
        if (currentLatest === undefined || stageIndex > currentLatest) {
          presenceByUserId.set(memberId, stageIndex);
        }
      }
    }
  });
  return presenceByUserId;
};

// Each OTHER party member's most recent session updatedAt across every stage
// we have data for. Online/away in the Lobby needs this, not just the
// current stage's own session: a friend whose session on OUR stage has gone
// stale (they moved on without ever completing it in a way we saw) can still
// be actively playing a later stage right now — judging them by the current
// stage's staleness alone would misclassify them as away indefinitely.
export const calculateMostRecentUpdatedAtByUserId = ({
  stages,
  runStageParties,
  userId,
}: {
  stages: RunStage[];
  runStageParties: { [stageId: string]: Parties<Session<ServerState>> };
  userId?: string;
}): Map<string, Date> => {
  const mostRecentByUserId = new Map<string, Date>();
  stages.forEach((stage) => {
    const parties = runStageParties[stage.boardString];
    for (const party of Object.values(parties || {})) {
      for (const [memberId, session] of Object.entries(
        party?.memberSessions || {}
      )) {
        if (memberId === userId || !session) {
          continue;
        }
        const updatedAt =
          session.updatedAt instanceof Date
            ? session.updatedAt
            : new Date(session.updatedAt);
        const current = mostRecentByUserId.get(memberId);
        if (!current || updatedAt.getTime() > current.getTime()) {
          mostRecentByUserId.set(memberId, updatedAt);
        }
      }
    }
  });
  return mostRecentByUserId;
};

export const calculateRunResults = ({
  stages,
  runStageParties,
  userId,
  ownResults,
  agentResults,
}: {
  stages: RunStage[];
  runStageParties: { [stageId: string]: Parties<Session<ServerState>> };
  userId?: string;
  ownResults: Map<number, StageResult>;
  agentResults?: AgentRunInput[];
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

  const playerLines = [...linesByUser.entries()].map(
    ([memberId, stageResults]): PlayerRunResult => ({
      userId: memberId,
      isCurrentUser: memberId === userId,
      stageResults,
      ...runTotals(stageResults),
    })
  );

  // Agents fold in like any other racer: their precomputed stage results are
  // deterministic, so a line simply reads them out per stage.
  const agentLines = (agentResults || []).map((agent): PlayerRunResult => {
    const stageResults = stages.map((_, stageIndex) =>
      agent.stageResults.get(stageIndex)
    );
    return {
      userId: agent.agentId,
      isCurrentUser: false,
      stageResults,
      ...runTotals(stageResults),
      nickname: agent.name,
      isAgent: true,
      emoji: agent.emoji,
    };
  });

  return [...playerLines, ...agentLines]
    .filter((result) => result.completedStageCount > 0)
    .sort(
      (a, b) =>
        b.completedStageCount - a.completedStageCount ||
        a.totalSeconds - b.totalSeconds ||
        a.userId.localeCompare(b.userId)
    );
};
