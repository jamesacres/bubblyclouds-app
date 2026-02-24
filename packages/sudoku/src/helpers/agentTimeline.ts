import {
  humanSolve,
  puzzleToGrid,
  applyHint,
  buildCandidates,
  gridToPuzzle,
} from '../utils/humanSolver';
import { Puzzle } from '../types/puzzle';
import {
  AgentStep,
  AgentTimeline,
  DreyfusLevel,
  LocalAgent,
} from '../types/Agent';
import { ServerState } from '../types/state';
import { canAgentUseTechnique } from './techniqueCategories';
import { calculateExecutionTime } from './techniqueTiming';

export function createAgentTimeline(
  initial: Puzzle<number>,
  final: Puzzle<number>,
  agentLevel: DreyfusLevel
): AgentTimeline {
  try {
    const initialGrid = puzzleToGrid(initial);
    const { steps: hints } = humanSolve(initialGrid);

    if (hints.length === 0) {
      return { steps: [], totalDuration: 0 };
    }

    let currentGrid = puzzleToGrid(initial);
    let currentCandidates = buildCandidates(currentGrid);
    let currentTime = 0;
    let answerStack: Puzzle[] = [];
    const steps: AgentStep[] = [];

    for (const hint of hints) {
      const isAboveSkillLevel = !canAgentUseTechnique(
        agentLevel,
        hint.technique
      );
      const filledCells = currentGrid.filter((c) => c !== 0).length;
      const stepDuration = calculateExecutionTime(
        hint.technique,
        agentLevel,
        isAboveSkillLevel,
        filledCells
      );
      currentTime += stepDuration;

      const next = applyHint(currentGrid, currentCandidates, hint);
      currentGrid = next.grid;
      currentCandidates = next.candidates;

      const currentPuzzle = gridToPuzzle(currentGrid);
      answerStack = [...answerStack, currentPuzzle];

      const state: ServerState = {
        initial,
        final,
        answerStack: [...answerStack],
      };

      const step: AgentStep = {
        technique: hint.technique,
        timestamp: currentTime,
        state,
        wasBlocked: isAboveSkillLevel,
      };

      steps.push(step);
    }

    return { steps, totalDuration: currentTime };
  } catch (error) {
    console.error('createAgentTimeline failed for level', agentLevel, error);
    return { steps: [], totalDuration: 0 };
  }
}

export function createLocalAgents(
  initial: Puzzle<number>,
  final: Puzzle<number>,
  agentConfigs: Array<{ name: string; emoji: string; skillLevel: DreyfusLevel }>
): LocalAgent[] {
  return agentConfigs.reduce<LocalAgent[]>((acc, config, index) => {
    try {
      acc.push({
        id: `agent-${index}`,
        name: config.name,
        emoji: config.emoji,
        skillLevel: config.skillLevel,
        timeline: createAgentTimeline(initial, final, config.skillLevel),
      });
    } catch (error) {
      console.error(
        'createLocalAgents failed for agent',
        config.name,
        config.skillLevel,
        error
      );
    }
    return acc;
  }, []);
}
