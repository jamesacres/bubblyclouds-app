import { addMonths } from '../helpers/monthId';
import { MonthId } from '../types/monthId';
import { SimulationInputs, SolverResult } from '../types/simulation';
import { ageAtDate } from './accessRules';
import { runRetirementSimulationAsync } from './runAsync';
import { runRetirementSimulation } from './simulate';

export type SolverBaseInputs = Omit<SimulationInputs, 'retirementMonth'>;

export const DEFAULT_SOLVER_WINDOW_YEARS = 40;

export interface FindEarliestRetirementAsyncOptions {
  windowYears?: number;
  // probesDone counts completed Monte Carlo probes; probesTotal is the
  // worst-case probe budget (solverProbeBudget) — early exits resolve
  // before probesDone reaches it
  onProgress?: (probesDone: number, probesTotal: number) => void;
  signal?: AbortSignal;
}

const maxOffsetForWindow = (windowYears: number): number => {
  const maxOffset = Math.floor(windowYears * 12);
  if (maxOffset < 0) {
    throw new Error('findEarliestRetirement requires windowYears >= 0');
  }
  return maxOffset;
};

// Worst-case number of Monte Carlo probes for a window: window end, window
// start, then one probe per binary-search halving
export const solverProbeBudget = (
  windowYears: number = DEFAULT_SOLVER_WINDOW_YEARS
): number => {
  const maxOffset = maxOffsetForWindow(windowYears);
  if (maxOffset === 0) {
    return 1;
  }
  return 2 + (maxOffset >= 2 ? Math.ceil(Math.log2(maxOffset)) : 0);
};

interface ProbePlanOutcome {
  offset?: number;
  achievedSuccessRatePct?: number;
}

// Probe plan as a generator: yields the next candidate offset (months after
// startMonth) and receives that probe's success rate. Every probe reuses the
// same base seed (common random numbers), which makes success monotonically
// non-decreasing in the retirement date and the binary search well-founded.
// The final lo/hi pair are both probed offsets, so the returned month is a
// probed pass and the month before it a probed fail.
function* probeSequence(
  maxOffset: number,
  targetSuccessRatePct: number
): Generator<number, ProbePlanOutcome, number> {
  const endSuccess = yield maxOffset;
  if (endSuccess < targetSuccessRatePct) {
    return {};
  }
  if (maxOffset === 0) {
    return { offset: 0, achievedSuccessRatePct: endSuccess };
  }
  const startSuccess = yield 0;
  if (startSuccess >= targetSuccessRatePct) {
    return { offset: 0, achievedSuccessRatePct: startSuccess };
  }
  let lo = 0; // probed fail
  let hi = maxOffset; // probed pass
  let hiSuccess = endSuccess;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const midSuccess = yield mid;
    if (midSuccess >= targetSuccessRatePct) {
      hi = mid;
      hiSuccess = midSuccess;
    } else {
      lo = mid;
    }
  }
  return { offset: hi, achievedSuccessRatePct: hiSuccess };
}

const inputsAtOffset = (
  base: SolverBaseInputs,
  offset: number
): SimulationInputs => ({
  ...base,
  retirementMonth: addMonths(base.startMonth, offset),
});

const toSolverResult = (
  base: SolverBaseInputs,
  outcome: ProbePlanOutcome
): SolverResult => {
  if (outcome.offset === undefined) {
    return { agesAtRetirement: {} };
  }
  const earliestRetirementMonth: MonthId = addMonths(
    base.startMonth,
    outcome.offset
  );
  const agesAtRetirement: { [userId: string]: number } = {};
  for (const member of base.members) {
    agesAtRetirement[member.userId] = ageAtDate(
      member.dateOfBirth,
      `${earliestRetirementMonth}-01`
    );
  }
  return {
    earliestRetirementMonth,
    achievedSuccessRatePct: outcome.achievedSuccessRatePct,
    agesAtRetirement,
  };
};

export const findEarliestRetirement = (
  base: SolverBaseInputs,
  windowYears: number = DEFAULT_SOLVER_WINDOW_YEARS
): SolverResult => {
  const maxOffset = maxOffsetForWindow(windowYears);
  const sequence = probeSequence(
    maxOffset,
    base.assumptions.targetSuccessRatePct
  );
  let step = sequence.next();
  while (!step.done) {
    const { successRatePct } = runRetirementSimulation(
      inputsAtOffset(base, step.value)
    );
    step = sequence.next(successRatePct);
  }
  return toSolverResult(base, step.value);
};

const abortError = (signal: AbortSignal): Error => {
  if (signal.reason instanceof Error) {
    return signal.reason;
  }
  const error = new Error('Earliest retirement solve aborted');
  error.name = 'AbortError';
  return error;
};

// Identical result to findEarliestRetirement for the same inputs: the probe
// plan is shared and each probe's chunked run equals its synchronous run
export const findEarliestRetirementAsync = async (
  base: SolverBaseInputs,
  options: FindEarliestRetirementAsyncOptions = {}
): Promise<SolverResult> => {
  const windowYears = options.windowYears ?? DEFAULT_SOLVER_WINDOW_YEARS;
  const maxOffset = maxOffsetForWindow(windowYears);
  const probesTotal = solverProbeBudget(windowYears);
  const sequence = probeSequence(
    maxOffset,
    base.assumptions.targetSuccessRatePct
  );
  let probesDone = 0;
  let step = sequence.next();
  while (!step.done) {
    if (options.signal?.aborted) {
      throw abortError(options.signal);
    }
    const { successRatePct } = await runRetirementSimulationAsync(
      inputsAtOffset(base, step.value),
      { signal: options.signal }
    );
    probesDone += 1;
    options.onProgress?.(probesDone, probesTotal);
    step = sequence.next(successRatePct);
  }
  if (options.signal?.aborted) {
    throw abortError(options.signal);
  }
  return toSolverResult(base, step.value);
};
