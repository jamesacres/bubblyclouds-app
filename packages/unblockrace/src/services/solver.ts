import { Move } from '../types/board';

export type SolverResult =
  | { solvable: true; moves: Move[] }
  | { solvable: false };

export interface SolverApi {
  solve(boardString: string): SolverResult;
}

const SUPPORTED_BOARD_LENGTH = 36;

export const isSolverSupported = (boardString: string): boolean =>
  boardString.length === SUPPORTED_BOARD_LENGTH;

const MOVE_PATTERN = /^([A-Z])([+-]\d+)$/;

const parseMove = (label: string): Move => {
  const match = MOVE_PATTERN.exec(label);
  if (!match) {
    throw new Error(`Solver returned an unparseable move: ${label}`);
  }
  const piece = match[1].charCodeAt(0) - 65;
  const steps = parseInt(match[2], 10);
  if (steps === 0) {
    throw new Error(`Solver returned an unparseable move: ${label}`);
  }
  return { piece, steps };
};

const parseSolveResult = (result: string): SolverResult => {
  if (result === 'unsolvable') {
    return { solvable: false };
  }
  if (result === 'ok') {
    return { solvable: true, moves: [] };
  }
  if (result.startsWith('ok ')) {
    return { solvable: true, moves: result.slice(3).split(' ').map(parseMove) };
  }
  throw new Error(`Solver rejected board: ${result}`);
};

const createSolver = async (): Promise<SolverApi> => {
  const { default: createSolverWasmModule } = await import('./solverWasm.js');
  const wasmModule = await createSolverWasmModule({
    locateFile: () => `${window.location.origin}/solver/solver.wasm`,
  });
  return {
    solve: (boardString: string): SolverResult =>
      parseSolveResult(
        wasmModule.ccall('solve', 'string', ['string'], [boardString])
      ),
  };
};

let solverPromise: Promise<SolverApi> | undefined;

export const loadSolver = (): Promise<SolverApi> => {
  if (!solverPromise) {
    solverPromise = createSolver().catch((error: unknown) => {
      solverPromise = undefined;
      throw error;
    });
  }
  return solverPromise;
};
