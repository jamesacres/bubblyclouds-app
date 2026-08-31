import {
  AgentStep,
  DreyfusLevel,
  TimingCurve,
  TimingState,
} from '../types/Agent';

// Competent and above draw randomly within [fastest, median].
// AdvancedBeginner and Novice draw randomly within [median, slowest].
// Bands within each half give finer control so skill levels are clearly ordered.
const SKILL_LEVEL_BAND: Record<DreyfusLevel, [number, number]> = {
  [DreyfusLevel.Expert]: [0.0, 0.3],
  [DreyfusLevel.Proficient]: [0.4, 0.7],
  [DreyfusLevel.Competent]: [0.65, 1.0],
  [DreyfusLevel.AdvancedBeginner]: [0.4, 0.65],
  [DreyfusLevel.Novice]: [0.8, 1.0],
};

// Competent and above are positioned within [fastest, median].
// AdvancedBeginner and Novice are positioned within [median, slowest].
const USES_SLOW_HALF = new Set<DreyfusLevel>([
  DreyfusLevel.AdvancedBeginner,
  DreyfusLevel.Novice,
]);

export function skillLevelTargetDuration(
  skillLevel: DreyfusLevel,
  bounds: [number, number, number]
): number {
  const [fastestMs, medianMs, slowestMs] = bounds;
  const [lo, hi] = SKILL_LEVEL_BAND[skillLevel];
  const position = lo + Math.random() * (hi - lo);
  if (USES_SLOW_HALF.has(skillLevel)) {
    return medianMs + (slowestMs - medianMs) * position;
  }
  const raw = fastestMs + (medianMs - fastestMs) * position;
  if (skillLevel === DreyfusLevel.Competent) {
    return Math.max(raw, medianMs - 60000);
  }
  return raw;
}

export function applyTimingEnvelope(
  baseDuration: number,
  isEndgame: boolean,
  timingCurve: TimingCurve,
  timingState: TimingState
): number {
  let duration = baseDuration;

  if (timingState.burstsRemaining > 0) {
    timingState.burstsRemaining--;
    duration = Math.max(400, duration * 0.25);
  } else {
    if (Math.random() < timingCurve.burstChance) {
      const minBurst = timingCurve.burstLength[0];
      const maxBurst = timingCurve.burstLength[1];
      timingState.burstsRemaining =
        Math.floor(Math.random() * (maxBurst - minBurst + 1)) + minBurst;
      timingState.burstsRemaining--;
      duration = Math.max(400, duration * 0.25);
    } else {
      const hesitationChance =
        timingCurve.hesitationChance +
        (isEndgame ? timingCurve.endgameHesitationSpike : 0);
      if (Math.random() < Math.max(0, hesitationChance)) {
        const minHesitation = timingCurve.hesitationDelayMs[0];
        const maxHesitation = timingCurve.hesitationDelayMs[1];
        const hesitationDelay =
          Math.random() * (maxHesitation - minHesitation) + minHesitation;
        duration += hesitationDelay;
      }
    }
  }

  const jitter = (Math.random() * 2 - 1) * timingCurve.jitterMs;
  return Math.max(200, duration + jitter);
}

export function rescaleTimelineToDuration<Extra, State>(
  steps: AgentStep<Extra, State>[],
  totalDuration: number,
  skillLevel: DreyfusLevel,
  bounds: [number, number, number] | undefined
): { steps: AgentStep<Extra, State>[]; totalDuration: number } {
  if (!bounds || totalDuration <= 0) {
    return { steps, totalDuration };
  }

  const targetDuration = skillLevelTargetDuration(skillLevel, bounds);
  const scale = targetDuration / totalDuration;
  for (const step of steps) {
    step.timestamp = Math.round(step.timestamp * scale);
  }
  return { steps, totalDuration: targetDuration };
}
