import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import { PlayerRunResult, PlayerStageResult } from '../types/scoringTypes';
import { RunStage } from '../types/runTypes';

// The minimal shape any game's session state must have for run results to
// read a stage's completion time — the rest of the state (score-specific
// fields included) is opaque here and left to the caller's extractScore.
export interface CompletedRunState {
  completed?: { seconds: number };
}

const getCompletedSeconds = <State extends CompletedRunState>(
  session: Session<State>
): number | undefined => session.state.completed?.seconds;

// A local AI agent's deterministic run so far: its precomputed per-stage
// results, recorded as the run reaches the end of each stage.
export interface AgentRunInput<Score> {
  agentId: string;
  name: string;
  emoji?: string;
  stageResults: Map<number, PlayerStageResult<Score>>;
}

const runTotals = <Score>(
  stageResults: (PlayerStageResult<Score> | undefined)[]
) => {
  const completedResults = stageResults.filter(
    (stageResult): stageResult is PlayerStageResult<Score> =>
      stageResult !== undefined
  );
  return {
    totalSeconds: completedResults.reduce(
      (sum, stageResult) => sum + stageResult.seconds,
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
export const calculatePresenceStageByUserId = <Stage extends RunStage, State>({
  stages,
  runStageParties,
  userId,
}: {
  stages: Stage[];
  runStageParties: { [stageId: string]: Parties<Session<State>> };
  userId?: string;
}): Map<string, number> => {
  const presenceByUserId = new Map<string, number>();
  stages.forEach((stage, stageIndex) => {
    const parties = runStageParties[stage.stageId];
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
export const calculateMostRecentUpdatedAtByUserId = <
  Stage extends RunStage,
  State,
>({
  stages,
  runStageParties,
  userId,
}: {
  stages: Stage[];
  runStageParties: { [stageId: string]: Parties<Session<State>> };
  userId?: string;
}): Map<string, Date> => {
  const mostRecentByUserId = new Map<string, Date>();
  stages.forEach((stage) => {
    const parties = runStageParties[stage.stageId];
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

// Fold the per-stage server sessions (runStageParties, keyed by stage id) and
// the current user's own local results into one leaderboard line per player.
// Own results come from local storage first so the player's line is right
// even before the server echoes their finished session back. Players with no
// completed stage yet are omitted — the live race strip already covers
// in-progress positions. isCheated and extractScore are game-specific: a
// session only counts as a fair, scoreable stage result when isCheated
// returns false and extractScore returns a defined Score.
export const calculateRunResults = <
  Stage extends RunStage,
  State extends CompletedRunState,
  Score,
>({
  stages,
  runStageParties,
  userId,
  ownResults,
  agentResults,
  isCheated,
  extractScore,
}: {
  stages: Stage[];
  runStageParties: { [stageId: string]: Parties<Session<State>> };
  userId?: string;
  ownResults: Map<number, PlayerStageResult<Score>>;
  agentResults?: AgentRunInput<Score>[];
  isCheated: (session: Session<State>) => boolean;
  extractScore: (session: Session<State>, stage: Stage) => Score | undefined;
}): PlayerRunResult<Score>[] => {
  const linesByUser = new Map<
    string,
    (PlayerStageResult<Score> | undefined)[]
  >();
  const lineFor = (
    memberId: string
  ): (PlayerStageResult<Score> | undefined)[] => {
    let line = linesByUser.get(memberId);
    if (!line) {
      line = new Array<PlayerStageResult<Score> | undefined>(
        stages.length
      ).fill(undefined);
      linesByUser.set(memberId, line);
    }
    return line;
  };

  stages.forEach((stage, stageIndex) => {
    const parties = runStageParties[stage.stageId];
    for (const party of Object.values(parties || {})) {
      for (const [memberId, session] of Object.entries(
        party?.memberSessions || {}
      )) {
        if (memberId === userId || !session || isCheated(session)) {
          continue;
        }
        const seconds = getCompletedSeconds(session);
        const score = extractScore(session, stage);
        if (seconds !== undefined && score !== undefined) {
          lineFor(memberId)[stageIndex] = { seconds, score };
        }
      }
    }
  });

  if (userId) {
    const ownLine = lineFor(userId);
    stages.forEach((_, stageIndex) => {
      ownLine[stageIndex] = ownResults.get(stageIndex);
    });
  }

  const playerLines = [...linesByUser.entries()].map(
    ([memberId, stageResults]): PlayerRunResult<Score> => ({
      userId: memberId,
      isCurrentUser: memberId === userId,
      stageResults,
      ...runTotals(stageResults),
    })
  );

  // Agents fold in like any other racer: their precomputed stage results are
  // deterministic, so a line simply reads them out per stage.
  const agentLines = (agentResults || []).map(
    (agent): PlayerRunResult<Score> => {
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
    }
  );

  return [...playerLines, ...agentLines]
    .filter((result) => result.completedStageCount > 0)
    .sort(
      (a, b) =>
        b.completedStageCount - a.completedStageCount ||
        a.totalSeconds - b.totalSeconds ||
        a.userId.localeCompare(b.userId)
    );
};
