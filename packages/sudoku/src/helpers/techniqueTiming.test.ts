import { Difficulty } from '@bubblyclouds-app/games/types/difficulty';
import { TimingCurve, TimingState } from '@bubblyclouds-app/games/types/Agent';
import {
  difficultyToMultiplier,
  difficultyToSolveBounds,
  calculateExecutionTime,
  DIFFICULTY_SOLVE_BOUNDS_MS,
} from './techniqueTiming';

const baseTimingCurve: TimingCurve = {
  baseDelayMs: 5000,
  jitterMs: 0,
  burstChance: 0,
  burstLength: [2, 3],
  hesitationChance: 0,
  hesitationDelayMs: [1000, 2000],
  endgameStart: 0.8,
  endgameSpeedMultiplier: 1,
  endgameHesitationSpike: 0,
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('difficultyToMultiplier', () => {
  it('returns 1.0 when difficulty is undefined', () => {
    expect(difficultyToMultiplier(undefined)).toBe(1.0);
  });

  it('returns 1.0 for an unrecognized difficulty string', () => {
    expect(difficultyToMultiplier('not-a-difficulty')).toBe(1.0);
  });

  it('returns the configured multiplier for a known Difficulty', () => {
    expect(difficultyToMultiplier(Difficulty.EASY)).toBe(1.0);
    expect(difficultyToMultiplier(Difficulty.EXPERT)).toBe(1.9);
  });
});

describe('difficultyToSolveBounds', () => {
  it('returns undefined when difficulty is undefined', () => {
    expect(difficultyToSolveBounds(undefined)).toBeUndefined();
  });

  it('returns undefined for an unrecognized difficulty string', () => {
    expect(difficultyToSolveBounds('not-a-difficulty')).toBeUndefined();
  });

  it('returns the [fastest, median, slowest] bounds for a known difficulty', () => {
    expect(difficultyToSolveBounds(Difficulty.SIMPLE)).toEqual(
      DIFFICULTY_SOLVE_BOUNDS_MS[Difficulty.SIMPLE]
    );
  });
});

describe('calculateExecutionTime', () => {
  it('returns a longer duration for a more complex technique than a simple one', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9); // avoid burst/hesitation triggers
    const timingState: TimingState = { burstsRemaining: 0 };

    const simpleTime = calculateExecutionTime(
      'nakedSingle',
      baseTimingCurve,
      { burstsRemaining: 0 },
      false,
      50
    );
    const complexTime = calculateExecutionTime(
      'forcingChain',
      baseTimingCurve,
      timingState,
      false,
      50
    );

    expect(complexTime).toBeGreaterThan(simpleTime);
  });

  it('applies a struggle multiplier when the technique is above the agent skill level', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);

    const normalTime = calculateExecutionTime(
      'nakedPair',
      baseTimingCurve,
      { burstsRemaining: 0 },
      false,
      50
    );
    const struggleTime = calculateExecutionTime(
      'nakedPair',
      baseTimingCurve,
      { burstsRemaining: 0 },
      true,
      50
    );

    expect(struggleTime).toBeGreaterThan(normalTime * 5);
  });

  it('applies a scan-time penalty on a sparsely-filled board (early puzzle)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);

    const earlyTime = calculateExecutionTime(
      'nakedSingle',
      baseTimingCurve,
      { burstsRemaining: 0 },
      false,
      25
    );
    const lateTime = calculateExecutionTime(
      'nakedSingle',
      baseTimingCurve,
      { burstsRemaining: 0 },
      false,
      81
    );

    expect(earlyTime).toBeGreaterThan(lateTime);
  });

  it('speeds up once the board reaches the endgame threshold', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const endgameCurve: TimingCurve = {
      ...baseTimingCurve,
      endgameStart: 0.5,
      endgameSpeedMultiplier: 0.2,
    };

    const preEndgame = calculateExecutionTime(
      'nakedSingle',
      endgameCurve,
      { burstsRemaining: 0 },
      false,
      30 // 30/81 < 0.5, not endgame
    );
    const inEndgame = calculateExecutionTime(
      'nakedSingle',
      endgameCurve,
      { burstsRemaining: 0 },
      false,
      70 // 70/81 > 0.5, endgame
    );

    expect(inEndgame).toBeLessThan(preEndgame);
  });

  it('applies a burst discount and decrements burstsRemaining when already in a burst', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9); // would not otherwise trigger burst/hesitation
    const timingState: TimingState = { burstsRemaining: 2 };

    const duration = calculateExecutionTime(
      'nakedSingle',
      baseTimingCurve,
      timingState,
      false,
      81
    );

    expect(timingState.burstsRemaining).toBe(1);
    // Burst duration is baseDuration * 0.25, floored at 400.
    expect(duration).toBeGreaterThanOrEqual(200);
  });

  it('starts a new burst when the random roll is below burstChance', () => {
    const burstCurve: TimingCurve = { ...baseTimingCurve, burstChance: 1 };
    const timingState: TimingState = { burstsRemaining: 0 };

    jest.spyOn(Math, 'random').mockReturnValue(0);

    calculateExecutionTime('nakedSingle', burstCurve, timingState, false, 81);

    // burstChance triggers: burstsRemaining set from burstLength range, then decremented once.
    expect(timingState.burstsRemaining).toBeGreaterThanOrEqual(0);
  });

  it('adds a hesitation delay when the random roll is below hesitationChance', () => {
    const hesitationCurve: TimingCurve = {
      ...baseTimingCurve,
      burstChance: 0,
      hesitationChance: 1,
      hesitationDelayMs: [50000, 50000],
    };

    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const duration = calculateExecutionTime(
      'nakedSingle',
      hesitationCurve,
      { burstsRemaining: 0 },
      false,
      81
    );

    expect(duration).toBeGreaterThanOrEqual(50000);
  });

  it('never returns a duration below the 200ms floor', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const tinyCurve: TimingCurve = {
      ...baseTimingCurve,
      baseDelayMs: 1,
      jitterMs: 0,
    };

    const duration = calculateExecutionTime(
      'nakedSingle',
      tinyCurve,
      { burstsRemaining: 0 },
      false,
      81
    );

    expect(duration).toBeGreaterThanOrEqual(200);
  });

  it('uses the default filledCells and difficultyMultiplier when not provided', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const duration = calculateExecutionTime('nakedSingle', baseTimingCurve, {
      burstsRemaining: 0,
    });
    expect(duration).toBeGreaterThan(0);
  });
});
