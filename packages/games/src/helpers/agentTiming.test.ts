import {
  AgentStep,
  DreyfusLevel,
  TimingCurve,
  TimingState,
} from '../types/Agent';
import {
  applyTimingEnvelope,
  rescaleTimelineToDuration,
  skillLevelTargetDuration,
} from './agentTiming';

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

describe('skillLevelTargetDuration', () => {
  const bounds: [number, number, number] = [60000, 120000, 300000];

  it('positions Expert duration within [fastest, median], nearer the fastest end', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const duration = skillLevelTargetDuration(DreyfusLevel.Expert, bounds);
    expect(duration).toBe(60000);
  });

  it('positions Novice duration within [median, slowest], drawing from the slow half', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const duration = skillLevelTargetDuration(DreyfusLevel.Novice, bounds);
    // lo for Novice band is 0.8, so position = 0.8 at random()=0
    expect(duration).toBeCloseTo(120000 + (300000 - 120000) * 0.8);
  });

  it('keeps Competent duration at or above medianMs - 60000 as a floor', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const duration = skillLevelTargetDuration(DreyfusLevel.Competent, bounds);
    expect(duration).toBeGreaterThanOrEqual(120000 - 60000);
  });

  it('produces durations ordered fastest-to-slowest across skill levels on average', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const expert = skillLevelTargetDuration(DreyfusLevel.Expert, bounds);
    const proficient = skillLevelTargetDuration(
      DreyfusLevel.Proficient,
      bounds
    );
    const competent = skillLevelTargetDuration(DreyfusLevel.Competent, bounds);
    const advancedBeginner = skillLevelTargetDuration(
      DreyfusLevel.AdvancedBeginner,
      bounds
    );
    const novice = skillLevelTargetDuration(DreyfusLevel.Novice, bounds);

    expect(expert).toBeLessThanOrEqual(proficient);
    expect(proficient).toBeLessThanOrEqual(competent);
    expect(advancedBeginner).toBeLessThanOrEqual(novice);
  });

  it('draws beginners from the slow half and experts from the fast half', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const [fastest, median, slowest] = bounds;

    const expert = skillLevelTargetDuration(DreyfusLevel.Expert, bounds);
    expect(expert).toBeGreaterThanOrEqual(fastest);
    expect(expert).toBeLessThanOrEqual(median);

    const novice = skillLevelTargetDuration(DreyfusLevel.Novice, bounds);
    expect(novice).toBeGreaterThanOrEqual(median);
    expect(novice).toBeLessThanOrEqual(slowest);
  });
});

describe('applyTimingEnvelope', () => {
  it('returns the base duration with no jitter/burst/hesitation applied', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const duration = applyTimingEnvelope(1000, false, baseTimingCurve, {
      burstsRemaining: 0,
    });
    expect(duration).toBe(1000);
  });

  it('applies a burst discount and decrements burstsRemaining when already in a burst', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const timingState: TimingState = { burstsRemaining: 2 };

    const duration = applyTimingEnvelope(
      1000,
      false,
      baseTimingCurve,
      timingState
    );

    expect(timingState.burstsRemaining).toBe(1);
    expect(duration).toBe(400); // max(400, 1000 * 0.25) = 400
  });

  it('floors the burst discount at 400ms', () => {
    const timingState: TimingState = { burstsRemaining: 1 };
    const duration = applyTimingEnvelope(
      100,
      false,
      baseTimingCurve,
      timingState
    );
    expect(duration).toBe(400);
  });

  it('starts a new burst when the random roll is below burstChance', () => {
    const burstCurve: TimingCurve = { ...baseTimingCurve, burstChance: 1 };
    const timingState: TimingState = { burstsRemaining: 0 };

    jest.spyOn(Math, 'random').mockReturnValue(0);

    applyTimingEnvelope(1000, false, burstCurve, timingState);

    // burstLength [2,3] at random()=0 sets burstsRemaining to 2, then decrements once.
    expect(timingState.burstsRemaining).toBe(1);
  });

  it('adds a hesitation delay when the random roll is below hesitationChance', () => {
    const hesitationCurve: TimingCurve = {
      ...baseTimingCurve,
      burstChance: 0,
      hesitationChance: 1,
      hesitationDelayMs: [50000, 50000],
    };

    jest.spyOn(Math, 'random').mockReturnValue(0.99);

    const duration = applyTimingEnvelope(1000, false, hesitationCurve, {
      burstsRemaining: 0,
    });

    expect(duration).toBeGreaterThanOrEqual(50000);
  });

  it('adds the endgame hesitation spike when isEndgame is true', () => {
    const curve: TimingCurve = {
      ...baseTimingCurve,
      burstChance: 0,
      hesitationChance: 0,
      endgameHesitationSpike: 1,
      hesitationDelayMs: [5000, 5000],
    };

    jest.spyOn(Math, 'random').mockReturnValue(0);

    const duration = applyTimingEnvelope(1000, true, curve, {
      burstsRemaining: 0,
    });

    expect(duration).toBeGreaterThanOrEqual(6000);
  });

  it('applies jitter within the configured range', () => {
    const curve: TimingCurve = { ...baseTimingCurve, jitterMs: 100 };
    jest.spyOn(Math, 'random').mockReturnValue(1);
    const duration = applyTimingEnvelope(1000, false, curve, {
      burstsRemaining: 0,
    });
    expect(duration).toBe(1100);
  });

  it('never returns a duration below the 200ms floor', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const duration = applyTimingEnvelope(1, false, baseTimingCurve, {
      burstsRemaining: 0,
    });
    expect(duration).toBeGreaterThanOrEqual(200);
  });
});

describe('rescaleTimelineToDuration', () => {
  type Extra = { label: string };
  type State = { value: number };

  const makeSteps = (timestamps: number[]): AgentStep<Extra, State>[] =>
    timestamps.map((timestamp) => ({
      label: 'step',
      timestamp,
      state: { value: timestamp },
    }));

  it('returns the steps and totalDuration unchanged when bounds is undefined', () => {
    const steps = makeSteps([100, 200, 300]);
    const result = rescaleTimelineToDuration(
      steps,
      300,
      DreyfusLevel.Expert,
      undefined
    );

    expect(result.steps).toBe(steps);
    expect(result.totalDuration).toBe(300);
    expect(result.steps.map((step) => step.timestamp)).toEqual([100, 200, 300]);
  });

  it('returns the steps and totalDuration unchanged when totalDuration is 0', () => {
    const steps = makeSteps([0]);
    const result = rescaleTimelineToDuration(
      steps,
      0,
      DreyfusLevel.Expert,
      [60000, 120000, 300000]
    );

    expect(result.steps).toBe(steps);
    expect(result.totalDuration).toBe(0);
  });

  it('returns the steps and totalDuration unchanged when totalDuration is negative', () => {
    const steps = makeSteps([0]);
    const result = rescaleTimelineToDuration(
      steps,
      -5,
      DreyfusLevel.Expert,
      [60000, 120000, 300000]
    );

    expect(result.steps).toBe(steps);
    expect(result.totalDuration).toBe(-5);
  });

  it('rescales every step timestamp proportionally and updates totalDuration to the target', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const bounds: [number, number, number] = [60000, 120000, 300000];
    const steps = makeSteps([250, 500, 1000]);

    const result = rescaleTimelineToDuration(
      steps,
      1000,
      DreyfusLevel.Expert,
      bounds
    );

    // Expert band [0, 0.3] at random()=0 -> position 0 -> fastestMs (60000).
    expect(result.totalDuration).toBe(60000);
    expect(result.steps.map((step) => step.timestamp)).toEqual([
      15000, 30000, 60000,
    ]);
    expect(result.steps).toBe(steps);
  });
});
