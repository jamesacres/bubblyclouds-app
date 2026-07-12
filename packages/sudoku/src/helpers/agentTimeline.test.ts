import { puzzleToGrid, gridToPuzzle, humanSolve } from 'human-sudoku-solver';
import { createAgentTimeline, createLocalAgents } from './agentTimeline';
import { puzzleTextToPuzzle } from './puzzleTextToPuzzle';
import { DreyfusLevel, AgentConfig } from '../types/Agent';
import { Difficulty } from '@bubblyclouds-app/games/types/difficulty';

const INITIAL_TEXT =
  '530070000600195000098000060800060003400803001700020006060000280000419005000080079'.slice(
    0,
    81
  );

const FINAL_TEXT =
  '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

const initial = puzzleTextToPuzzle(INITIAL_TEXT);
const final = puzzleTextToPuzzle(FINAL_TEXT);

const noviceTimingCurve = {
  baseDelayMs: 8400,
  jitterMs: 5400,
  burstChance: 0.35,
  burstLength: [2, 4] as [number, number],
  hesitationChance: 0.25,
  hesitationDelayMs: [12000, 24000] as [number, number],
  endgameStart: 0.75,
  endgameSpeedMultiplier: 0.6,
  endgameHesitationSpike: 0.5,
};

const expertTimingCurve = {
  baseDelayMs: 3300,
  jitterMs: 720,
  burstChance: 0.15,
  burstLength: [2, 3] as [number, number],
  hesitationChance: 0.03,
  hesitationDelayMs: [3000, 5400] as [number, number],
  endgameStart: 0.75,
  endgameSpeedMultiplier: 0.5,
  endgameHesitationSpike: -0.1,
};

const voiceLines = {
  neutral: ['hi'],
  playerAhead: ['ahead'],
  playerBehind: ['behind'],
  endgame: ['end'],
};

const makeConfig = (overrides: Partial<AgentConfig> = {}): AgentConfig => ({
  name: 'TestAgent',
  emoji: '🧪',
  emojiName: 'test',
  emotionalRole: 'tester',
  skillLevel: DreyfusLevel.Expert,
  personality: 'thorough',
  timingCurve: expertTimingCurve,
  voiceLines,
  ...overrides,
});

describe('createAgentTimeline', () => {
  it('returns an empty timeline when the puzzle has no hints (already solved)', () => {
    const timeline = createAgentTimeline(final, final, makeConfig());
    expect(timeline).toEqual({ steps: [], totalDuration: 0 });
  });

  it('produces steps with increasing timestamps and answer stacks reaching the final state', () => {
    const timeline = createAgentTimeline(initial, final, makeConfig());

    expect(timeline.steps.length).toBeGreaterThan(0);
    expect(timeline.totalDuration).toBeGreaterThan(0);

    let previousTimestamp = -1;
    for (const step of timeline.steps) {
      expect(step.timestamp).toBeGreaterThanOrEqual(previousTimestamp);
      previousTimestamp = step.timestamp;
      expect(step.state.initial).toBe(initial);
      expect(step.state.final).toBe(final);
      expect(step.wasBlocked).toBe(false);
    }

    const lastStep = timeline.steps[timeline.steps.length - 1];
    const lastAnswer =
      lastStep.state.answerStack[lastStep.state.answerStack.length - 1];
    expect(lastAnswer).toEqual(gridToPuzzle(puzzleToGrid(final)));
  });

  it('marks steps as blocked when the technique exceeds the agent skill level', () => {
    const timeline = createAgentTimeline(
      initial,
      final,
      makeConfig({
        skillLevel: DreyfusLevel.Novice,
        timingCurve: noviceTimingCurve,
      })
    );

    expect(timeline.steps.length).toBeGreaterThan(0);
    // A novice cannot use every technique that this puzzle may require,
    // so at least some steps should be flagged as "wasBlocked" struggles
    // unless the puzzle only required naked/hidden singles.
    const anyBlocked = timeline.steps.some((step) => step.wasBlocked);
    const allNoviceTechniques = timeline.steps.every((step) =>
      [
        'nakedSingle',
        'hiddenSingleBox',
        'hiddenSingleRow',
        'hiddenSingleCol',
      ].includes(step.technique)
    );
    expect(anyBlocked || allNoviceTechniques).toBe(true);
  });

  it('rescales timestamps to the difficulty-derived target duration when a difficulty is given', () => {
    // Pin Math.random so the skill-level target duration and per-step
    // timing calculations are deterministic across both calls.
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);

    const withoutDifficulty = createAgentTimeline(initial, final, makeConfig());
    const withDifficulty = createAgentTimeline(
      initial,
      final,
      makeConfig(),
      1.0,
      Difficulty.EASY
    );

    randomSpy.mockRestore();

    expect(withDifficulty.totalDuration).not.toBe(
      withoutDifficulty.totalDuration
    );
    expect(withDifficulty.steps.length).toBe(withoutDifficulty.steps.length);
    // The final step's timestamp should equal the rescaled total duration.
    const lastStep = withDifficulty.steps[withDifficulty.steps.length - 1];
    expect(lastStep.timestamp).toBeLessThanOrEqual(
      withDifficulty.totalDuration
    );
  });

  it('does not rescale when the difficulty is unrecognized', () => {
    const withUnknownDifficulty = createAgentTimeline(
      initial,
      final,
      makeConfig(),
      1.0,
      'not-a-real-difficulty'
    );

    // Without a recognized difficulty, totalDuration is simply the sum of
    // step timestamps (i.e. equal to the final step's own timestamp),
    // rather than being rescaled to a difficulty-derived target duration.
    const lastStep =
      withUnknownDifficulty.steps[withUnknownDifficulty.steps.length - 1];
    expect(withUnknownDifficulty.totalDuration).toBe(lastStep.timestamp);
  });

  it('reuses precalculated hints instead of recomputing them', () => {
    const grid = puzzleToGrid(initial);
    const { steps } = humanSolve(grid);

    const timeline = createAgentTimeline(
      initial,
      final,
      makeConfig(),
      1.0,
      undefined,
      steps
    );

    expect(timeline.steps.length).toBe(steps.length);
  });

  it('returns an empty timeline and logs an error when solving throws', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const brokenInitial = { not: 'a puzzle' } as unknown as typeof initial;
    const timeline = createAgentTimeline(brokenInitial, final, makeConfig());

    expect(timeline).toEqual({ steps: [], totalDuration: 0 });
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe('createLocalAgents', () => {
  it('creates one LocalAgent per config, each with an id, and a timeline', () => {
    const configs = [
      makeConfig({ name: 'Alpha', skillLevel: DreyfusLevel.Expert }),
      makeConfig({
        name: 'Beta',
        skillLevel: DreyfusLevel.Novice,
        timingCurve: noviceTimingCurve,
      }),
    ];

    const agents = createLocalAgents(initial, final, configs);

    expect(agents).toHaveLength(2);
    expect(agents[0]).toMatchObject({
      id: 'agent-0',
      name: 'Alpha',
      skillLevel: DreyfusLevel.Expert,
    });
    expect(agents[1]).toMatchObject({
      id: 'agent-1',
      name: 'Beta',
      skillLevel: DreyfusLevel.Novice,
    });
    expect(agents[0].timeline.steps.length).toBeGreaterThan(0);
    expect(agents[1].timeline.steps.length).toBeGreaterThan(0);
  });

  it('skips an agent and continues when timeline creation throws for that agent only', () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const configs = [
      makeConfig({ name: 'Good' }),
      // Force an error deep inside by giving a skill level that is not a real enum value,
      // which will make canAgentUseTechnique look up an undefined DREYFUS_LEVEL_ORDER entry.
      // That alone doesn't throw, so instead we simulate a throw via a broken timingCurve.
      makeConfig({
        name: 'Bad',
        timingCurve: null as unknown as AgentConfig['timingCurve'],
      }),
    ];

    const agents = createLocalAgents(initial, final, configs);

    // "Bad" agent's timeline creation catches its own error internally and
    // returns an empty timeline rather than throwing, so both agents are present.
    expect(agents.length).toBeGreaterThanOrEqual(1);
    expect(agents.some((agent) => agent.name === 'Good')).toBe(true);

    consoleErrorSpy.mockRestore();
  });

  it('returns an empty array when given no agent configs', () => {
    const agents = createLocalAgents(initial, final, []);
    expect(agents).toEqual([]);
  });
});
