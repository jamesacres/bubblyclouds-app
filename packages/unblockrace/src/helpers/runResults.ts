import { Parties, Session } from '@bubblyclouds-app/types/serverTypes';
import {
  PlayerRunResult,
  PlayerStageResult,
} from '@bubblyclouds-app/games/types/scoringTypes';
import {
  AgentRunInput as GenericAgentRunInput,
  calculateRunResults as genericCalculateRunResults,
} from '@bubblyclouds-app/games/helpers/runResults';
import { AgentDisplayResolver } from '@bubblyclouds-app/games/types/Agent';
import { ServerState } from '../types/state';
import { RunStage, StageScore } from './stageResults';
import { isPuzzleCheated } from './cheatDetection';
import { movesMadeFromState } from './calculateStatsDisplay';

// A local AI agent's deterministic run so far: its precomputed per-stage
// results, recorded as the run reaches the end of each stage.
export type AgentRunInput = GenericAgentRunInput<StageScore>;

// movesMade is left undefined (rather than 0) when the answer stack alone
// yields nothing meaningful — mirrors calculateStatsDisplay's own "nothing
// to show" case, so a stage a friend barely started doesn't read as "0
// moves, on par".
const extractScore = (
  session: Session<ServerState>,
  stage: RunStage
): StageScore | undefined => {
  const movesMade = movesMadeFromState(session.state);
  return {
    movesMade: movesMade > 0 ? movesMade : undefined,
    movesRequired: stage.movesRequired,
  };
};

export const calculateRunResults = ({
  stages,
  runStageParties,
  userId,
  ownResults,
  agentResults,
  resolveAgentName,
}: {
  stages: RunStage[];
  runStageParties: { [stageId: string]: Parties<Session<ServerState>> };
  userId?: string;
  ownResults: Map<number, PlayerStageResult<StageScore>>;
  agentResults?: AgentRunInput[];
  resolveAgentName: AgentDisplayResolver;
}): PlayerRunResult<StageScore>[] =>
  genericCalculateRunResults<RunStage, ServerState, StageScore>({
    stages,
    runStageParties,
    userId,
    ownResults,
    agentResults,
    isCheated: (session) => isPuzzleCheated(session.state.answerStack),
    extractScore,
    resolveAgentName,
  });
