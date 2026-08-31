import { TimingCurve, TimingState } from '@bubblyclouds-app/games/types/Agent';
import {
  DIFFICULTY_SOLVE_BOUNDS_MS,
  calculateMoveExecutionTime,
  difficultyToSolveBounds,
} from './moveTiming';

// A curve with all randomness sources disabled so the multiplier logic is
// deterministic: no jitter, no bursts, no hesitations.
const flatCurve = (overrides: Partial<TimingCurve> = {}): TimingCurve => ({
  baseDelayMs: 1000,
  jitterMs: 0,
  burstChance: 0,
  burstLength: [1, 2],
  hesitationChance: 0,
  hesitationDelayMs: [1000, 2000],
  endgameStart: 0.75,
  endgameSpeedMultiplier: 0.5,
  endgameHesitationSpike: 0,
  ...overrides,
});

const freshState = (): TimingState => ({ burstsRemaining: 0 });

afterEach(() => {
  jest.restoreAllMocks();
});

describe('difficultyToSolveBounds', () => {
  it('maps each difficulty tier to its bounds', () => {
    expect(difficultyToSolveBounds('beginner')).toEqual([15000, 40000, 150000]);
    expect(difficultyToSolveBounds('challenging')).toEqual([
      30000, 80000, 300000,
    ]);
    expect(difficultyToSolveBounds('hard')).toEqual([60000, 150000, 480000]);
    expect(difficultyToSolveBounds('expert')).toEqual([100000, 240000, 720000]);
  });

  it('returns undefined for unknown or missing difficulties', () => {
    expect(difficultyToSolveBounds('impossible')).toBeUndefined();
    expect(difficultyToSolveBounds(undefined)).toBeUndefined();
    expect(difficultyToSolveBounds('')).toBeUndefined();
  });

  it('every tier is ordered fastest < median < slowest', () => {
    for (const [fastest, median, slowest] of Object.values(
      DIFFICULTY_SOLVE_BOUNDS_MS
    )) {
      expect(fastest).toBeLessThan(median);
      expect(median).toBeLessThan(slowest);
    }
  });
});

describe('calculateMoveExecutionTime', () => {
  // moveIndex 5 of 10 is past the planning window and before the endgame, so
  // only the complexity multiplier applies.
  const midGame = { moveIndex: 5, totalMoves: 10 };

  it('scales base delay by branching factor', () => {
    const time = calculateMoveExecutionTime(
      2,
      midGame.moveIndex,
      midGame.totalMoves,
      flatCurve(),
      freshState()
    );
    expect(time).toBe(1000); // 0.75 + 2/8 = 1.0
  });

  it('clamps complexity at the lower bound of 0.75', () => {
    const time = calculateMoveExecutionTime(
      0,
      midGame.moveIndex,
      midGame.totalMoves,
      flatCurve(),
      freshState()
    );
    expect(time).toBe(750);
  });

  it('clamps complexity at the upper bound of 2.5', () => {
    const atClamp = calculateMoveExecutionTime(
      14, // 0.75 + 14/8 = 2.5
      midGame.moveIndex,
      midGame.totalMoves,
      flatCurve(),
      freshState()
    );
    const aboveClamp = calculateMoveExecutionTime(
      100,
      midGame.moveIndex,
      midGame.totalMoves,
      flatCurve(),
      freshState()
    );
    expect(atClamp).toBe(2500);
    expect(aboveClamp).toBe(2500);
  });

  it('applies an opening planning multiplier tapering to 1 over the first 25% of moves', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5); // maxMultiplier = 2.5
    const curve = flatCurve({ endgameStart: 2 });

    const first = calculateMoveExecutionTime(2, 0, 100, curve, freshState());
    const tapering = calculateMoveExecutionTime(
      2,
      10,
      100,
      curve,
      freshState()
    );
    const afterWindow = calculateMoveExecutionTime(
      2,
      25,
      100,
      curve,
      freshState()
    );

    expect(first).toBe(2500); // full x2.5 planning
    expect(tapering).toBeCloseTo(1900); // 2.5 - 1.5 * (0.1 / 0.25)
    expect(afterWindow).toBe(1000); // planning fully tapered
    expect(first).toBeGreaterThan(tapering);
    expect(tapering).toBeGreaterThan(afterWindow);
  });

  it('speeds up past the endgame threshold', () => {
    const curve = flatCurve({
      endgameStart: 0.75,
      endgameSpeedMultiplier: 0.5,
    });
    const beforeEndgame = calculateMoveExecutionTime(
      2,
      50,
      100,
      curve,
      freshState()
    );
    const inEndgame = calculateMoveExecutionTime(
      2,
      80,
      100,
      curve,
      freshState()
    );
    expect(beforeEndgame).toBe(1000);
    expect(inEndgame).toBe(500);
  });

  it('never returns less than the 200ms floor', () => {
    const curve = flatCurve({ endgameSpeedMultiplier: 0.1 });
    const time = calculateMoveExecutionTime(0, 90, 100, curve, freshState());
    expect(time).toBe(200);
  });

  it('quarters the duration while a burst is active and decrements the burst counter', () => {
    const timingState: TimingState = { burstsRemaining: 2 };
    const time = calculateMoveExecutionTime(
      2,
      midGame.moveIndex,
      midGame.totalMoves,
      flatCurve(),
      timingState
    );
    expect(time).toBe(400); // max(400, 1000 * 0.25)
    expect(timingState.burstsRemaining).toBe(1);
  });

  it('adds a hesitation delay when the hesitation roll succeeds', () => {
    // random 0.5: no burst (burstChance 0), hesitation roll passes (< 0.9),
    // delay lands mid-range, jitter is zeroed by jitterMs 0.
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const curve = flatCurve({
      hesitationChance: 0.9,
      hesitationDelayMs: [1000, 2000],
    });
    const time = calculateMoveExecutionTime(
      2,
      midGame.moveIndex,
      midGame.totalMoves,
      curve,
      freshState()
    );
    expect(time).toBe(2500); // 1000 base + (0.5 * 1000 + 1000) hesitation
  });
});
