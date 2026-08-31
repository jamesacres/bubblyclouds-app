import { SolverResult } from '../services/solver';

jest.mock('../services/solver', () => ({
  isSolverSupported: jest.fn(),
  loadSolver: jest.fn(),
}));

// The module caches results, so getHint is re-imported fresh per test to keep
// the cache from leaking between them.
const freshHint = async () => {
  jest.resetModules();
  const solverModule = await import('../services/solver');
  const hintModule = await import('./hint');
  const solve = jest.fn<SolverResult, [string]>();
  const isSolverSupported = jest.mocked(solverModule.isSolverSupported);
  const loadSolver = jest.mocked(solverModule.loadSolver);
  isSolverSupported.mockImplementation(
    (boardString: string) => boardString.length === 36
  );
  loadSolver.mockResolvedValue({ solve });
  return { getHint: hintModule.getHint, isSolverSupported, loadSolver, solve };
};

// Distinct 36-char board strings (content is irrelevant — the solver is
// mocked; only the length gate and cache keys matter).
const boardKey = (i: number): string => String(i).padStart(36, 'o');

describe('getHint', () => {
  it('maps a solvable board to its first move', async () => {
    const { getHint, solve } = await freshHint();
    solve.mockReturnValue({
      solvable: true,
      moves: [
        { piece: 2, steps: -1 },
        { piece: 0, steps: 3 },
      ],
    });

    await expect(getHint(boardKey(1))).resolves.toEqual({
      kind: 'move',
      move: { piece: 2, steps: -1 },
    });
  });

  it('maps an already-solved board to solved', async () => {
    const { getHint, solve } = await freshHint();
    solve.mockReturnValue({ solvable: true, moves: [] });

    await expect(getHint(boardKey(1))).resolves.toEqual({ kind: 'solved' });
  });

  it('maps an unsolvable board to unsolvable', async () => {
    const { getHint, solve } = await freshHint();
    solve.mockReturnValue({ solvable: false });

    await expect(getHint(boardKey(1))).resolves.toEqual({
      kind: 'unsolvable',
    });
  });

  it('short-circuits unsupported boards without loading the solver', async () => {
    const { getHint, loadSolver } = await freshHint();

    await expect(getHint('too-short')).resolves.toEqual({
      kind: 'unavailable',
    });
    expect(loadSolver).not.toHaveBeenCalled();
  });

  it('returns unavailable when the solver fails to load', async () => {
    const { getHint, loadSolver } = await freshHint();
    loadSolver.mockRejectedValue(new Error('wasm fetch failed'));

    await expect(getHint(boardKey(1))).resolves.toEqual({
      kind: 'unavailable',
    });
  });

  it('returns unavailable when solve throws on an invalid board', async () => {
    const { getHint, solve } = await freshHint();
    solve.mockImplementation(() => {
      throw new Error('invalid: bad piece');
    });

    await expect(getHint(boardKey(1))).resolves.toEqual({
      kind: 'unavailable',
    });
  });

  it('serves repeated boards from the cache without re-solving', async () => {
    const { getHint, solve } = await freshHint();
    solve.mockReturnValue({ solvable: true, moves: [{ piece: 0, steps: 1 }] });

    const first = await getHint(boardKey(1));
    const second = await getHint(boardKey(1));

    expect(first).toEqual(second);
    expect(solve).toHaveBeenCalledTimes(1);
  });

  it('evicts the oldest entry once the cache is full', async () => {
    const { getHint, solve } = await freshHint();
    solve.mockReturnValue({ solvable: true, moves: [{ piece: 0, steps: 1 }] });

    // Fill the cache to its 200-entry cap, then add one more to evict the
    // oldest insertion (board 0). Board 199 is still cached.
    for (let i = 0; i <= 200; i += 1) {
      await getHint(boardKey(i));
    }
    expect(solve).toHaveBeenCalledTimes(201);

    await getHint(boardKey(199));
    expect(solve).toHaveBeenCalledTimes(201);

    await getHint(boardKey(0));
    expect(solve).toHaveBeenCalledTimes(202);
  });

  it('does not cache unavailable results', async () => {
    const { getHint, solve } = await freshHint();
    solve.mockImplementationOnce(() => {
      throw new Error('invalid: transient');
    });
    solve.mockReturnValue({ solvable: true, moves: [{ piece: 1, steps: 2 }] });

    await expect(getHint(boardKey(1))).resolves.toEqual({
      kind: 'unavailable',
    });
    await expect(getHint(boardKey(1))).resolves.toEqual({
      kind: 'move',
      move: { piece: 1, steps: 2 },
    });
    expect(solve).toHaveBeenCalledTimes(2);
  });
});
