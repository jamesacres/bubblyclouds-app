import { Move } from '../types/board';
import { isSolverSupported, loadSolver } from '../services/solver';

export type HintResult =
  | { kind: 'move'; move: Move }
  | { kind: 'solved' }
  | { kind: 'unsolvable' }
  | { kind: 'unavailable' };

// Undo/redo revisits the same board strings constantly, so successful hints
// are cached FIFO. 'unavailable' is transient (loader/network failure) and is
// never cached so a later attempt can succeed.
const CACHE_LIMIT = 200;
const hintCache = new Map<string, HintResult>();

export const getHint = async (boardString: string): Promise<HintResult> => {
  if (!isSolverSupported(boardString)) {
    return { kind: 'unavailable' };
  }
  const cached = hintCache.get(boardString);
  if (cached) {
    return cached;
  }
  let result: HintResult;
  try {
    const solver = await loadSolver();
    const solution = solver.solve(boardString);
    if (!solution.solvable) {
      result = { kind: 'unsolvable' };
    } else if (solution.moves.length === 0) {
      result = { kind: 'solved' };
    } else {
      result = { kind: 'move', move: solution.moves[0] };
    }
  } catch {
    return { kind: 'unavailable' };
  }
  if (hintCache.size >= CACHE_LIMIT) {
    const oldest = hintCache.keys().next().value;
    if (oldest !== undefined) {
      hintCache.delete(oldest);
    }
  }
  hintCache.set(boardString, result);
  return result;
};
