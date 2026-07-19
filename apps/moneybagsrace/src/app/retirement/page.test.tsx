import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { currentMonthId } from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import { InvestmentWrapper } from '@bubblyclouds-app/moneybagsrace/types/accounts';
import {
  DEFAULT_WITHDRAWAL_STRATEGY,
  WithdrawalStrategyKind,
} from '@bubblyclouds-app/moneybagsrace/types/assumptions';
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

jest.mock(
  '@bubblyclouds-app/moneybagsrace/components/MonteCarloPathsChart',
  () => ({
    __esModule: true,
    default: function MockMonteCarloPathsChart({
      sampledPaths,
    }: {
      sampledPaths: unknown[];
    }) {
      return (
        <div
          data-testid="monte-carlo-paths-stub"
          data-sample-count={sampledPaths.length}
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
  defaultWithdrawalAnnualPence: 4_800_000,
  defaultPlanToAge: 92,
};

const OWN_MEMBER = {
  userId: 'user-1',
  dateOfBirth: '1989-03-15',
  balancesPencePerWrapper: { [InvestmentWrapper.ISA]: 10_000_000 },
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
  desiredWithdrawalAnnualPence: 2_400_000,
  withdrawalStrategy: DEFAULT_WITHDRAWAL_STRATEGY,
};

const PARTNER_MEMBER = {
  userId: 'user-2',
  dateOfBirth: '1990-06-01',
  balancesPencePerWrapper: { [InvestmentWrapper.SIPP]: 8_000_000 },
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
  desiredWithdrawalAnnualPence: 2_400_000,
  withdrawalStrategy: { kind: WithdrawalStrategyKind.FIXED_PERCENT },
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
  incomePathsPence: [
    { year: 2041, p5: 1, p25: 2, p50: 3, p75: 4, p95: 5 },
    { year: 2042, p5: 1, p25: 2, p50: 3, p75: 4, p95: 5 },
  ],
  cumulativeIncomePathsPence: [
    { year: 2040, p5: 0, p25: 0, p50: 0, p75: 0, p95: 0 },
    { year: 2041, p5: 1, p25: 2, p50: 3, p75: 4, p95: 5 },
    { year: 2042, p5: 2, p25: 4, p50: 6, p75: 8, p95: 10 },
  ],
  totalLifetimeWithdrawalsPence: {
    p5: 2,
    p25: 4,
    p50: 6,
    p75: 8,
    p95: 10,
  },
  combinedTotalPence: {
    p5: 2,
    p25: 14_000_000,
    p50: 50_000_006,
    p75: 120_000_008,
    p95: 300_000_010,
  },
  sampledPathsPence: [
    { runIndex: 0, totalsPence: [10, 8] },
    { runIndex: 1, totalsPence: [10, 12] },
  ],
  failures: {
    count: 440,
    medianFailureYear: 2052,
    byKind: {
      [FailureKind.BRIDGE_EXHAUSTED]: 240,
      [FailureKind.WEALTH_EXHAUSTED]: 200,
      [FailureKind.INCOME_BELOW_FLOOR]: 0,
    },
  },
  memberBreakdowns: [],
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
const mockSaveOwnProfile = jest.fn();

const household = (members = [OWN_MEMBER, PARTNER_MEMBER]) => ({
  members: members.map((member) => ({
    userId: member.userId,
    nickname: member.userId === 'user-1' ? 'James' : 'Sam',
    isUser: member.userId === 'user-1',
    profile: undefined,
  })),
  months: {},
  orderedMonths: [],
  effectiveAssumptions: ASSUMPTIONS,
});

const readyModel = (members = [OWN_MEMBER, PARTNER_MEMBER]) => ({
  members,
  startMonth: '2026-07',
  assumptions: ASSUMPTIONS,
  readiness: { ready: true, missingDob: [], hasSnapshots: true },
  householdDesiredWithdrawalAnnualPence: members.reduce(
    (total, member) => total + member.desiredWithdrawalAnnualPence,
    0
  ),
});

const runSimulation = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Run simulation' }));

describe('Retirement Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHousehold.mockReturnValue({
      household: household(),
      ownUserId: 'user-1',
      ownProfile: undefined,
      saveOwnProfile: mockSaveOwnProfile,
      saveSharedAssumptions: mockSaveSharedAssumptions,
    });
    mockUseRetirementModel.mockReturnValue(readyModel());
    mockRunAsync.mockResolvedValue(SIM_RESULT);
    mockSolver.mockResolvedValue(SOLVER_RESULT);
    mockSensitivity.mockResolvedValue(SENSITIVITY_RESULT);
    mockSaveSharedAssumptions.mockResolvedValue(undefined);
    mockSaveOwnProfile.mockResolvedValue(undefined);
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

  describe('household summary and per-member cards', () => {
    it('shows the combined household withdrawal and one card per member', () => {
      render(<RetirementPage />);
      expect(
        screen.getByTestId('household-withdrawal-total')
      ).toHaveTextContent('£48,000');
      expect(screen.getByTestId('member-plan-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('member-plan-user-2')).toBeInTheDocument();
      expect(screen.getByText('James’s personal plan')).toBeInTheDocument();
      expect(screen.getByText('Sam’s personal plan')).toBeInTheDocument();
    });

    it('prefills shared knobs from assumptions', () => {
      render(<RetirementPage />);
      expect(screen.getByLabelText('Plan to age')).toHaveValue(92);
      expect(screen.getByLabelText('Target success rate')).toHaveValue('90');
    });

    it('makes the own card editable and the partner card read-only', () => {
      render(<RetirementPage />);
      // Own withdrawal is an editable input (only the own card has the label).
      const ownWithdrawal = screen.getByLabelText(
        "Desired annual withdrawal (net, today's money)"
      );
      expect(ownWithdrawal.tagName).toBe('INPUT');
      expect(ownWithdrawal).toHaveAttribute('id', 'member-withdrawal-user-1');
      // Partner withdrawal is rendered read-only (not an input).
      const partnerWithdrawal = screen.getByTestId('member-withdrawal-user-2');
      expect(partnerWithdrawal.tagName).not.toBe('INPUT');
      expect(partnerWithdrawal).toHaveTextContent('£24,000');
      // Own strategy chips are enabled; partner chips are disabled.
      expect(
        screen.getByTestId(
          `member-strategy-user-1-${WithdrawalStrategyKind.GUARDRAILS}`
        )
      ).not.toBeDisabled();
      expect(
        screen.getByTestId(
          `member-strategy-user-2-${WithdrawalStrategyKind.GUARDRAILS}`
        )
      ).toBeDisabled();
    });

    it('reflects own-card withdrawal edits in the household total', () => {
      render(<RetirementPage />);
      const ownWithdrawal = screen.getByLabelText(
        "Desired annual withdrawal (net, today's money)"
      );
      fireEvent.focus(ownWithdrawal);
      fireEvent.change(ownWithdrawal, { target: { value: '30000' } });
      expect(
        screen.getByTestId('household-withdrawal-total')
      ).toHaveTextContent('£54,000');
    });
  });

  describe('withdrawal strategies (own card)', () => {
    it('selects a new Morningstar strategy and shows its description', () => {
      render(<RetirementPage />);
      fireEvent.click(
        screen.getByTestId(
          `member-strategy-user-1-${WithdrawalStrategyKind.VANGUARD_DYNAMIC}`
        )
      );
      expect(
        screen.getByTestId('member-strategy-description-user-1')
      ).toHaveTextContent('cap how much the amount can change each year');
      expect(
        screen.getByLabelText('Yearly decrease floor (%)')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Yearly increase ceiling (%)')
      ).toBeInTheDocument();
    });

    it('shows the guardrail controls for the guardrails strategy', () => {
      render(<RetirementPage />);
      fireEvent.click(
        screen.getByTestId(
          `member-strategy-user-1-${WithdrawalStrategyKind.GUARDRAILS}`
        )
      );
      expect(
        screen.getByLabelText('Initial withdrawal rate')
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Guardrail width')).toBeInTheDocument();
    });
  });

  describe('earliest-date mode (default)', () => {
    it('runs the solver with per-member members and combined fallback', async () => {
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

      expect(mockSolver).toHaveBeenCalledWith(
        expect.objectContaining({
          startMonth: '2026-07',
          planToAge: 92,
          withdrawalAnnualPence: 4_800_000,
          includeStatePension: true,
          applyTax: true,
          runs: 5000,
          members: expect.arrayContaining([
            expect.objectContaining({
              userId: 'user-1',
              desiredWithdrawalAnnualPence: 2_400_000,
            }),
            expect.objectContaining({
              userId: 'user-2',
              desiredWithdrawalAnnualPence: 2_400_000,
            }),
          ]),
        }),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.objectContaining({ retirementMonth: '2041-03' }),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
    });

    it('persists the own personal plan and shared knobs', async () => {
      render(<RetirementPage />);
      const ownWithdrawal = screen.getByLabelText(
        "Desired annual withdrawal (net, today's money)"
      );
      fireEvent.focus(ownWithdrawal);
      fireEvent.change(ownWithdrawal, { target: { value: '30000' } });
      fireEvent.click(
        screen.getByTestId(
          `member-strategy-user-1-${WithdrawalStrategyKind.RMD}`
        )
      );
      fireEvent.change(screen.getByLabelText('Plan to age'), {
        target: { value: '90' },
      });
      runSimulation();
      await waitFor(() =>
        expect(mockSaveOwnProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            overrides: expect.objectContaining({
              desiredWithdrawalAnnualPence: 3_000_000,
              withdrawalStrategy: expect.objectContaining({
                kind: WithdrawalStrategyKind.RMD,
              }),
            }),
          })
        )
      );
      await waitFor(() =>
        expect(mockSaveSharedAssumptions).toHaveBeenCalledWith(
          expect.objectContaining({ defaultPlanToAge: 90 })
        )
      );
    });

    it('explains the Monte Carlo method and its historical data source', async () => {
      render(<RetirementPage />);
      runSimulation();
      const explainer = await screen.findByTestId('monte-carlo-explainer');
      expect(explainer).toHaveTextContent('Monte Carlo');
      expect(explainer).toHaveTextContent('it uses real historical data');
      expect(explainer).toHaveTextContent('1900–2023');
      expect(explainer).toHaveTextContent('124 years of history');
    });

    it('passes the member nicknames into the result panel', async () => {
      render(<RetirementPage />);
      runSimulation();
      await screen.findByTestId('retirement-result-panel');
      // The result panel receives memberNicknames; the summary label is present.
      expect(
        screen.getAllByText('Household success (both plans combined)').length
      ).toBeGreaterThan(0);
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

  describe('stale results after editing inputs', () => {
    it('freezes the shown target against the run and flags edits as stale until re-run', async () => {
      render(<RetirementPage />);
      runSimulation();
      await screen.findByTestId('retirement-result-panel');

      // Results graded against the run's target (90%), not the live slider.
      expect(screen.getByTestId('retirement-result-panel')).toHaveTextContent(
        'Target 90%'
      );
      expect(
        screen.queryByTestId('stale-results-hint')
      ).not.toBeInTheDocument();

      // Moving the target slider must not re-label the already-shown results.
      fireEvent.change(screen.getByLabelText('Target success rate'), {
        target: { value: '80' },
      });
      expect(screen.getByTestId('retirement-result-panel')).toHaveTextContent(
        'Target 90%'
      );
      expect(screen.getByTestId('stale-results-hint')).toBeInTheDocument();

      // Re-running clears the stale flag and re-grades against the new target.
      runSimulation();
      await waitFor(() =>
        expect(
          screen.queryByTestId('stale-results-hint')
        ).not.toBeInTheDocument()
      );
      expect(screen.getByTestId('retirement-result-panel')).toHaveTextContent(
        'Target 80%'
      );
    });

    it('flags a strategy edit as stale without re-running the simulation', async () => {
      render(<RetirementPage />);
      runSimulation();
      await screen.findByTestId('retirement-result-panel');
      expect(mockSolver).toHaveBeenCalledTimes(1);

      fireEvent.click(
        screen.getByTestId(
          `member-strategy-user-1-${WithdrawalStrategyKind.RMD}`
        )
      );
      expect(screen.getByTestId('stale-results-hint')).toBeInTheDocument();
      // The edit alone must not trigger another run.
      expect(mockSolver).toHaveBeenCalledTimes(1);
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
      expect(mockSaveSharedAssumptions).not.toHaveBeenCalled();
    });
  });

  it('disables the run button when there is no household withdrawal', () => {
    const zeroMember = { ...OWN_MEMBER, desiredWithdrawalAnnualPence: 0 };
    mockUseHousehold.mockReturnValue({
      household: household([zeroMember]),
      ownUserId: 'user-1',
      ownProfile: undefined,
      saveOwnProfile: mockSaveOwnProfile,
      saveSharedAssumptions: mockSaveSharedAssumptions,
    });
    mockUseRetirementModel.mockReturnValue(readyModel([zeroMember]));
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
