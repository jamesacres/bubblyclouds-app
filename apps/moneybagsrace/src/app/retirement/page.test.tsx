import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { currentMonthId } from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import { InvestmentWrapper } from '@bubblyclouds-app/moneybagsrace/types/accounts';
import {
  FailureKind,
  SimulationResult,
  SolverResult,
} from '@bubblyclouds-app/moneybagsrace/types/simulation';
import RetirementPage from './page';

jest.mock('@bubblyclouds-app/moneybagsrace/hooks/useHousehold', () => ({
  useHousehold: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/hooks/useRetirementModel', () => ({
  useRetirementModel: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/engine/runAsync', () => ({
  runRetirementSimulationAsync: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/engine/solver', () => ({
  findEarliestRetirementAsync: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/engine/sensitivity', () => ({
  computeSensitivityAsync: jest.fn(),
}));

jest.mock(
  '@bubblyclouds-app/moneybagsrace/components/PercentilePathsChart',
  () => ({
    __esModule: true,
    default: function MockPercentilePathsChart({
      paths,
    }: {
      paths: unknown[];
    }) {
      return (
        <div
          data-testid="percentile-paths-stub"
          data-path-count={paths.length}
        />
      );
    },
  })
);

// Headless UI's Switch does not expose role="switch" in this jest
// environment, so stub the ui Toggle with an accessible equivalent.
jest.mock('@bubblyclouds-app/ui/components/NotesToggle', () => ({
  Toggle: ({
    isEnabled,
    setEnabled,
  }: {
    isEnabled: boolean;
    setEnabled: (_value: boolean) => void;
  }) => (
    <button
      role="switch"
      aria-checked={isEnabled}
      onClick={() => setEnabled(!isEnabled)}
    />
  ),
}));

jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({
    user: { sub: 'user-1' },
    showLoginModal: jest.fn(),
    isInitialised: true,
  }),
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
}));

const ASSUMPTIONS = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: [],
  statePensionAnnualPence: 1_197_300,
  targetSuccessRatePct: 90,
  defaultWithdrawalAnnualPence: 2_400_000,
  defaultPlanToAge: 92,
};

const MEMBER = {
  userId: 'user-1',
  dateOfBirth: '1989-03-15',
  balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
};

const SIM_RESULT: SimulationResult = {
  successRatePct: 91.2,
  endingWealthPercentilesPence: {
    p5: 0,
    p25: 10_000_000,
    p50: 50_000_000,
    p75: 120_000_000,
    p95: 300_000_000,
  },
  percentilePathsPence: [
    { year: 2041, p5: 1, p25: 2, p50: 3, p75: 4, p95: 5 },
    { year: 2042, p5: 1, p25: 2, p50: 3, p75: 4, p95: 5 },
  ],
  failures: {
    count: 440,
    medianFailureYear: 2052,
    byKind: {
      [FailureKind.BRIDGE_EXHAUSTED]: 240,
      [FailureKind.WEALTH_EXHAUSTED]: 200,
    },
  },
};

const SOLVER_RESULT: SolverResult = {
  earliestRetirementMonth: '2041-03',
  achievedSuccessRatePct: 91.2,
  agesAtRetirement: { 'user-1': 52 },
};

const SENSITIVITY_RESULT = {
  withdrawalPlus5k: '2043-09',
  withdrawalMinus5k: '2040-03',
  contributionsPlus500: '2040-11',
  contributionsMinus500: '2041-08',
};

const mockUseHousehold = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/hooks/useHousehold'
).useHousehold as jest.Mock;
const mockUseRetirementModel = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/hooks/useRetirementModel'
).useRetirementModel as jest.Mock;
const mockRunAsync = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/engine/runAsync'
).runRetirementSimulationAsync as jest.Mock;
const mockSolver = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/engine/solver'
).findEarliestRetirementAsync as jest.Mock;
const mockSensitivity = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/engine/sensitivity'
).computeSensitivityAsync as jest.Mock;

const mockSaveSharedAssumptions = jest.fn();

const readyModel = () => ({
  members: [MEMBER],
  startMonth: '2026-07',
  assumptions: ASSUMPTIONS,
  readiness: { ready: true, missingDob: [], hasSnapshots: true },
});

const runSimulation = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));

describe('Retirement Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHousehold.mockReturnValue({
      ownUserId: 'user-1',
      saveSharedAssumptions: mockSaveSharedAssumptions,
    });
    mockUseRetirementModel.mockReturnValue(readyModel());
    mockRunAsync.mockResolvedValue(SIM_RESULT);
    mockSolver.mockResolvedValue(SOLVER_RESULT);
    mockSensitivity.mockResolvedValue(SENSITIVITY_RESULT);
    mockSaveSharedAssumptions.mockResolvedValue(undefined);
  });

  describe('not ready', () => {
    it('links to settings when dates of birth are missing', () => {
      mockUseRetirementModel.mockReturnValue({
        ...readyModel(),
        readiness: { ready: false, missingDob: ['Alex'], hasSnapshots: true },
      });
      render(<RetirementPage />);
      const notice = screen.getByTestId('retirement-missing-dob');
      expect(notice).toHaveTextContent('Add dates of birth for: Alex');
      expect(notice.querySelector('a')).toHaveAttribute('href', '/settings');
      expect(
        screen.queryByRole('button', { name: 'Run simulation' })
      ).not.toBeInTheDocument();
    });

    it('links to the entry screen when there are no snapshots', () => {
      mockUseRetirementModel.mockReturnValue({
        ...readyModel(),
        startMonth: undefined,
        readiness: { ready: false, missingDob: [], hasSnapshots: false },
      });
      render(<RetirementPage />);
      expect(
        screen.getByTestId('retirement-no-snapshots').querySelector('a')
      ).toHaveAttribute('href', `/state?month=${currentMonthId()}`);
    });
  });

  it('prefills the remembered defaults from shared assumptions', () => {
    render(<RetirementPage />);
    expect(
      screen.getByLabelText("Desired annual withdrawal (net, today's money)")
    ).toHaveValue('£24,000');
    expect(screen.getByLabelText('Plan to age')).toHaveValue(92);
    expect(screen.getByLabelText('Target success rate')).toHaveValue('90');
  });

  describe('earliest-date mode (default)', () => {
    it('runs the solver, simulates at the found date and shows sensitivity', async () => {
      render(<RetirementPage />);
      runSimulation();

      expect(await screen.findByTestId('solver-headline')).toHaveTextContent(
        'You can retire in March 2041 (age 52) at 90% confidence'
      );
      await waitFor(() =>
        expect(screen.getByTestId('sensitivity-table')).toBeInTheDocument()
      );
      expect(screen.getByTestId('achieved-success')).toHaveTextContent(
        'Achieved 91.2% at that date'
      );
      expect(screen.getByTestId('retirement-result-panel')).toBeInTheDocument();
      expect(screen.getByTestId('sensitivity-base')).toHaveTextContent(
        'Mar 2041'
      );

      expect(mockSolver).toHaveBeenCalledWith(
        expect.objectContaining({
          members: [MEMBER],
          startMonth: '2026-07',
          planToAge: 92,
          withdrawalAnnualPence: 2_400_000,
          includeStatePension: true,
          applyTax: true,
          runs: 5000,
        }),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.objectContaining({ retirementMonth: '2041-03' }),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(mockSensitivity).toHaveBeenCalledWith(
        expect.objectContaining({ withdrawalAnnualPence: 2_400_000 }),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('persists the run inputs as remembered household defaults', async () => {
      render(<RetirementPage />);
      fireEvent.change(screen.getByLabelText('Plan to age'), {
        target: { value: '90' },
      });
      fireEvent.change(screen.getByLabelText('Target success rate'), {
        target: { value: '85' },
      });
      runSimulation();
      await waitFor(() =>
        expect(mockSaveSharedAssumptions).toHaveBeenCalledWith(
          expect.objectContaining({
            defaultWithdrawalAnnualPence: 2_400_000,
            defaultPlanToAge: 90,
            targetSuccessRatePct: 85,
          })
        )
      );
    });

    // The seed is derived once per page load (Date.now-based) so re-runs
    // within a visit reuse identical random draws and stay comparable when
    // only the inputs change; a fresh page load resamples.
    it('reuses the same seed across runs within a page load', async () => {
      render(<RetirementPage />);
      runSimulation();
      await screen.findByTestId('solver-headline');
      await screen.findByRole('button', { name: 'Run simulation' });
      runSimulation();
      await waitFor(() => expect(mockSolver).toHaveBeenCalledTimes(2));
      const [firstBase] = mockSolver.mock.calls[0];
      const [secondBase] = mockSolver.mock.calls[1];
      expect(typeof firstBase.seed).toBe('number');
      expect(secondBase.seed).toBe(firstBase.seed);
    });

    it('passes the state pension and tax toggles into the run', async () => {
      render(<RetirementPage />);
      const switches = screen.getAllByRole('switch');
      fireEvent.click(switches[0]);
      fireEvent.click(switches[1]);
      runSimulation();
      await waitFor(() =>
        expect(mockSolver).toHaveBeenCalledWith(
          expect.objectContaining({
            includeStatePension: false,
            applyTax: false,
          }),
          expect.anything()
        )
      );
    });

    it('shows the unachievable state without simulating or sensitivity', async () => {
      mockSolver.mockResolvedValue({ agesAtRetirement: {} });
      render(<RetirementPage />);
      runSimulation();
      expect(
        await screen.findByTestId('solver-headline-unachievable')
      ).toBeInTheDocument();
      expect(mockRunAsync).not.toHaveBeenCalled();
      expect(mockSensitivity).not.toHaveBeenCalled();
    });

    it('shows an error message when a run fails unexpectedly', async () => {
      mockSolver.mockRejectedValue(new Error('boom'));
      render(<RetirementPage />);
      runSimulation();
      expect(await screen.findByTestId('run-error')).toBeInTheDocument();
    });
  });

  describe('specific-date mode', () => {
    it('simulates the chosen month and shows the percentile paths', async () => {
      render(<RetirementPage />);
      fireEvent.click(screen.getByRole('button', { name: 'Specific date' }));
      fireEvent.change(screen.getByLabelText('Retirement month'), {
        target: { value: '2035-06' },
      });
      runSimulation();

      expect(
        await screen.findByTestId('retirement-result-panel')
      ).toBeInTheDocument();
      expect(screen.getByText('Retiring Jun 2035')).toBeInTheDocument();
      expect(screen.getByTestId('percentile-paths-stub')).toHaveAttribute(
        'data-path-count',
        '2'
      );
      expect(screen.getByTestId('success-rate')).toHaveTextContent('91.2%');
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.objectContaining({ retirementMonth: '2035-06' }),
        expect.anything()
      );
      expect(mockSolver).not.toHaveBeenCalled();
      expect(mockSensitivity).not.toHaveBeenCalled();
    });
  });

  describe('progress and cancellation', () => {
    it('shows chunked progress and cancels the run cleanly', async () => {
      mockSolver.mockImplementation(
        (
          _base: unknown,
          options: {
            signal?: AbortSignal;
            onProgress?: (_done: number, _total: number) => void;
          }
        ) => {
          options.onProgress?.(5, 10);
          return new Promise((_resolve, reject) => {
            options.signal?.addEventListener('abort', () => {
              const error = new Error('aborted');
              error.name = 'AbortError';
              reject(error);
            });
          });
        }
      );
      render(<RetirementPage />);
      runSimulation();

      expect(await screen.findByTestId('run-progress')).toHaveTextContent(
        'Searching for your earliest retirement date…'
      );
      expect(screen.getByTestId('run-progress-bar')).toHaveStyle({
        width: '50%',
      });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(
        await screen.findByRole('button', { name: 'Run simulation' })
      ).toBeInTheDocument();
      expect(screen.queryByTestId('run-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('solver-headline')).not.toBeInTheDocument();
      expect(mockSaveSharedAssumptions).not.toHaveBeenCalled();
    });
  });

  it('disables the run button until a withdrawal is set', () => {
    mockUseRetirementModel.mockReturnValue({
      ...readyModel(),
      assumptions: {
        ...ASSUMPTIONS,
        defaultWithdrawalAnnualPence: undefined,
      },
    });
    render(<RetirementPage />);
    expect(
      screen.getByRole('button', { name: 'Run simulation' })
    ).toBeDisabled();
  });

  it('links back to the dashboard', () => {
    render(<RetirementPage />);
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
  });
});
