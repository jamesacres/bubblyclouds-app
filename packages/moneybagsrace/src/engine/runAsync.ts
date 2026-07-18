import { SimulationInputs, SimulationResult } from '../types/simulation';
import {
  aggregateSimulationOutcomes,
  prepareSimulationContext,
  runSimulationOnce,
  SimulationRunOutcome,
} from './simulate';

export interface RunRetirementSimulationAsyncOptions {
  chunkSize?: number;
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

const DEFAULT_CHUNK_SIZE = 500;

const abortError = (signal: AbortSignal): Error => {
  if (signal.reason instanceof Error) {
    return signal.reason;
  }
  const error = new Error('Retirement simulation aborted');
  error.name = 'AbortError';
  return error;
};

const yieldToEventLoop = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

// Chunked main-thread execution: identical results to
// runRetirementSimulation for the same inputs, because every run's RNG is
// derived purely from (inputs.seed, runIndex) regardless of chunking
export const runRetirementSimulationAsync = async (
  inputs: SimulationInputs,
  options: RunRetirementSimulationAsyncOptions = {}
): Promise<SimulationResult> => {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  if (chunkSize < 1) {
    throw new Error('runRetirementSimulationAsync requires chunkSize >= 1');
  }
  const context = prepareSimulationContext(inputs);
  const outcomes: SimulationRunOutcome[] = [];
  while (outcomes.length < inputs.runs) {
    if (options.signal?.aborted) {
      throw abortError(options.signal);
    }
    const chunkEnd = Math.min(outcomes.length + chunkSize, inputs.runs);
    for (let runIndex = outcomes.length; runIndex < chunkEnd; runIndex += 1) {
      outcomes.push(runSimulationOnce(context, runIndex));
    }
    options.onProgress?.(outcomes.length, inputs.runs);
    if (outcomes.length < inputs.runs) {
      await yieldToEventLoop();
    }
  }
  if (options.signal?.aborted) {
    throw abortError(options.signal);
  }
  return aggregateSimulationOutcomes(context, outcomes);
};
