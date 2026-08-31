const mockCcall = jest.fn(
  (
    _name: 'solve',
    _returnType: 'string',
    _argTypes: ['string'],
    _args: [string]
  ): string => 'unsolvable'
);

const mockCreateSolverWasmModule = jest.fn(
  async (_options?: {
    locateFile?: (_path: string, _scriptDirectory: string) => string;
  }) => ({ ccall: mockCcall })
);

jest.mock('./solverWasm.js', () => ({
  __esModule: true,
  default: mockCreateSolverWasmModule,
}));

describe('solver', () => {
  let solverModule: typeof import('./solver');

  beforeEach(async () => {
    jest.resetModules();
    mockCcall.mockClear();
    mockCreateSolverWasmModule.mockClear();
    solverModule = await import('./solver');
  });

  describe('isSolverSupported', () => {
    it('returns true for 6x6 board strings', () => {
      expect(solverModule.isSolverSupported('o'.repeat(36))).toBe(true);
    });

    it('returns false for other board sizes', () => {
      expect(solverModule.isSolverSupported('o'.repeat(25))).toBe(false);
      expect(solverModule.isSolverSupported('')).toBe(false);
      expect(solverModule.isSolverSupported('o'.repeat(49))).toBe(false);
    });
  });

  describe('loadSolver', () => {
    it('passes a locateFile pointing at the public solver wasm', async () => {
      await solverModule.loadSolver();
      const options = mockCreateSolverWasmModule.mock.calls[0][0];
      expect(options?.locateFile?.('solverWasm.wasm', '')).toBe(
        `${window.location.origin}/solver/solver.wasm`
      );
    });

    it('memoizes the wasm module across calls', async () => {
      const first = await solverModule.loadSolver();
      const second = await solverModule.loadSolver();
      expect(second).toBe(first);
      expect(mockCreateSolverWasmModule).toHaveBeenCalledTimes(1);
    });

    it('retries after a failed load', async () => {
      mockCreateSolverWasmModule.mockRejectedValueOnce(
        new Error('network failure')
      );
      await expect(solverModule.loadSolver()).rejects.toThrow(
        'network failure'
      );
      await expect(solverModule.loadSolver()).resolves.toBeDefined();
      expect(mockCreateSolverWasmModule).toHaveBeenCalledTimes(2);
    });
  });

  describe('solve', () => {
    const boardString = 'ooooooooooooAAoooo'.padEnd(36, 'o');

    it('parses moves from an ok result', async () => {
      mockCcall.mockReturnValue('ok A+1 C-2 B+3');
      const solver = await solverModule.loadSolver();
      expect(solver.solve(boardString)).toEqual({
        solvable: true,
        moves: [
          { piece: 0, steps: 1 },
          { piece: 2, steps: -2 },
          { piece: 1, steps: 3 },
        ],
      });
      expect(mockCcall).toHaveBeenCalledWith(
        'solve',
        'string',
        ['string'],
        [boardString]
      );
    });

    it('returns empty moves for an already solved board', async () => {
      mockCcall.mockReturnValue('ok');
      const solver = await solverModule.loadSolver();
      expect(solver.solve(boardString)).toEqual({ solvable: true, moves: [] });
    });

    it('returns solvable false for an unsolvable board', async () => {
      mockCcall.mockReturnValue('unsolvable');
      const solver = await solverModule.loadSolver();
      expect(solver.solve(boardString)).toEqual({ solvable: false });
    });

    it('throws a descriptive error for an invalid board', async () => {
      mockCcall.mockReturnValue('invalid: length');
      const solver = await solverModule.loadSolver();
      expect(() => solver.solve(boardString)).toThrow(
        'Solver rejected board: invalid: length'
      );
    });

    it('throws for an unparseable move', async () => {
      mockCcall.mockReturnValue('ok A+0');
      const solver = await solverModule.loadSolver();
      expect(() => solver.solve(boardString)).toThrow(
        'Solver returned an unparseable move: A+0'
      );
    });
  });
});
