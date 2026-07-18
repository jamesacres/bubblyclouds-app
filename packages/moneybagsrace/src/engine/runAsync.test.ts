import { GLOBAL_EQUITY_ANNUAL_RETURNS } from '../data/globalEquityReturns';
import { InvestmentWrapper } from '../types/accounts';
import { HouseholdAssumptions } from '../types/assumptions';
import { SimulationInputs } from '../types/simulation';
import { runRetirementSimulationAsync } from './runAsync';
import { runRetirementSimulation } from './simulate';
import { DEFAULT_TAX_BANDS } from './tax';

const assumptions: HouseholdAssumptions = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: DEFAULT_TAX_BANDS,
  statePensionAnnualPence: 1_197_300,
  targetSuccessRatePct: 90,
};

const makeInputs = (
  overrides: Partial<SimulationInputs> = {}
): SimulationInputs => ({
  members: [
    {
      userId: 'member-1',
      dateOfBirth: '1966-02-01',
      balancesPencePerWrapper: {
        [InvestmentWrapper.ISA]: 60_000_000,
        [InvestmentWrapper.SIPP]: 40_000_000,
      },
      contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
      overrides: {},
    },
  ],
  startMonth: '2030-01',
  retirementMonth: '2030-01',
  planToAge: 90,
  withdrawalAnnualPence: 5_000_000,
  includeStatePension: true,
  applyTax: true,
  assumptions,
  returns: GLOBAL_EQUITY_ANNUAL_RETURNS,
  runs: 87,
  seed: 21,
  ...overrides,
});

describe('runRetirementSimulationAsync', () => {
  it('matches the synchronous result across chunk sizes', async () => {
    const inputs = makeInputs();
    const syncResult = runRetirementSimulation(inputs);
    for (const chunkSize of [10, 87, 1000]) {
      const asyncResult = await runRetirementSimulationAsync(inputs, {
        chunkSize,
      });
      expect(asyncResult).toEqual(syncResult);
    }
  });

  it('matches the synchronous result with default options', async () => {
    const inputs = makeInputs();
    expect(await runRetirementSimulationAsync(inputs)).toEqual(
      runRetirementSimulation(inputs)
    );
  });

  it('reports progress after each chunk', async () => {
    const progress: [number, number][] = [];
    await runRetirementSimulationAsync(makeInputs({ runs: 100 }), {
      chunkSize: 40,
      onProgress: (done, total) => {
        progress.push([done, total]);
      },
    });
    expect(progress).toEqual([
      [40, 100],
      [80, 100],
      [100, 100],
    ]);
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      runRetirementSimulationAsync(makeInputs(), {
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects promptly when aborted mid-run', async () => {
    const controller = new AbortController();
    const progress: number[] = [];
    await expect(
      runRetirementSimulationAsync(makeInputs({ runs: 500 }), {
        chunkSize: 50,
        signal: controller.signal,
        onProgress: (done) => {
          progress.push(done);
          controller.abort();
        },
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
    // Aborted at the first chunk boundary: no further chunks ran
    expect(progress).toEqual([50]);
  });

  it('rejects a non-positive chunk size', async () => {
    await expect(
      runRetirementSimulationAsync(makeInputs(), { chunkSize: 0 })
    ).rejects.toThrow('chunkSize >= 1');
  });
});
