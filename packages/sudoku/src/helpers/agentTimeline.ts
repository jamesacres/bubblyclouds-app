import {
  humanSolve,
  puzzleToGrid,
  applyHint,
  buildCandidates,
  gridToPuzzle,
} from 'human-sudoku-solver';
import { Technique } from 'human-sudoku-solver';
import { Puzzle } from '../types/puzzle';
import {
  AgentConfig,
  AgentStep as GamesAgentStep,
  AgentTimeline as GamesAgentTimeline,
  LocalAgent as GamesLocalAgent,
  TimingState,
} from '@bubblyclouds-app/games/types/Agent';
import { ServerState } from '../types/state';
import { canAgentUseTechnique } from './techniqueCategories';
import {
  calculateExecutionTime,
  difficultyToSolveBounds,
} from './techniqueTiming';
import { rescaleTimelineToDuration } from '@bubblyclouds-app/games/helpers/agentTiming';
import {
  Difficulty,
  BookPuzzleDifficulty,
} from '@bubblyclouds-app/games/types/difficulty';

export type AgentStepExtra = { technique: Technique; wasBlocked: boolean };
export type AgentStep = GamesAgentStep<AgentStepExtra, ServerState>;
export type AgentTimeline = GamesAgentTimeline<AgentStepExtra, ServerState>;
export type LocalAgent = GamesLocalAgent<AgentStepExtra, ServerState>;

export function createAgentTimeline(
  initial: Puzzle<number>,
  final: Puzzle<number>,
  config: AgentConfig,
  difficultyMultiplier: number = 1.0,
  difficulty?: Difficulty | BookPuzzleDifficulty | string,
  precalculatedHints?: ReturnType<typeof humanSolve>['steps']
): AgentTimeline {
  try {
    const hints = precalculatedHints ?? humanSolve(puzzleToGrid(initial)).steps;

    if (hints.length === 0) {
      return { steps: [], totalDuration: 0 };
    }

    let currentGrid = puzzleToGrid(initial);
    let currentCandidates = buildCandidates(currentGrid);
    let currentTime = 0;
    let answerStack: Puzzle[] = [];
    const steps: AgentStep[] = [];
    let timingState: TimingState = { burstsRemaining: 0 };

    for (const hint of hints) {
      const isAboveSkillLevel = !canAgentUseTechnique(
        config.skillLevel,
        hint.technique
      );
      const filledCells = currentGrid.filter((c) => c !== 0).length;
      const stepDuration = calculateExecutionTime(
        hint.technique,
        config.timingCurve,
        timingState,
        isAboveSkillLevel,
        filledCells,
        difficultyMultiplier
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

    return rescaleTimelineToDuration(
      steps,
      currentTime,
      config.skillLevel,
      difficultyToSolveBounds(difficulty)
    );
  } catch (error) {
    console.error(
      'createAgentTimeline failed for agent',
      config.name,
      JSON.stringify(config),
      error
    );
    return { steps: [], totalDuration: 0 };
  }
}

export function createLocalAgents(
  initial: Puzzle<number>,
  final: Puzzle<number>,
  agentConfigs: AgentConfig[],
  difficultyMultiplier: number = 1.0,
  difficulty?: Difficulty | BookPuzzleDifficulty | string
): LocalAgent[] {
  const initialGrid = puzzleToGrid(initial);
  const { steps: precalculatedHints } = humanSolve(initialGrid);

  return agentConfigs.reduce<LocalAgent[]>((acc, config, index) => {
    try {
      acc.push({
        id: `agent-${index}`,
        name: config.name,
        emoji: config.emoji,
        skillLevel: config.skillLevel,
        timeline: createAgentTimeline(
          initial,
          final,
          config,
          difficultyMultiplier,
          difficulty,
          precalculatedHints
        ),
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
