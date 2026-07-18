import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  currentMonthId,
  previousMonthId,
} from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import { HouseholdData } from '@bubblyclouds-app/moneybagsrace/types/household';
import { MonthlySnapshotData } from '@bubblyclouds-app/moneybagsrace/types/snapshot';
import { AccountKind } from '@bubblyclouds-app/moneybagsrace/types/accounts';
import Home from './page';
import * as nextNavigation from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/hooks/useHousehold', () => ({
  useHousehold: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/hooks/useRetirementModel', () => ({
  useRetirementModel: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/engine/solver', () => ({
  findEarliestRetirementAsync: jest.fn(),
}));

jest.mock('@bubblyclouds-app/template/hooks/online', () => ({
  useOnline: jest.fn(() => ({
    forceOffline: jest.fn(),
    isOnline: true,
  })),
}));

const mockShowLoginModal = jest.fn();

jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({
    user: null,
    showLoginModal: (...args: unknown[]) => mockShowLoginModal(...args),
    isInitialised: true,
  }),
}));

jest.mock('@bubblyclouds-app/template/components/PremiumFeatures', () => ({
  PremiumFeatures: function MockPremiumFeatures() {
    return <div data-testid="premium-features">Premium Features</div>;
  },
}));

jest.mock('@bubblyclouds-app/template/components/RateAppButton', () => ({
  RateAppButton: function MockRateAppButton() {
    return <div data-testid="rate-app-button">Rate App</div>;
  },
}));

jest.mock('@bubblyclouds-app/template/helpers/capacitor', () => ({
  isCapacitor: () => false,
  isIOS: () => false,
  isAndroid: () => false,
}));

jest.mock('@bubblyclouds-app/ui/components/Footer', () => ({
  __esModule: true,
  default: function MockFooter({ children }: { children: React.ReactNode }) {
    return <footer data-testid="footer">{children}</footer>;
  },
}));

jest.mock('lucide-react', () => ({
  Home: () => <div data-testid="home-icon" />,
  LineChart: () => <div data-testid="line-chart-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  NotebookPen: () => <div data-testid="notebook-pen-icon" />,
}));

const snapshot = (
  month: string,
  balancePence: number,
  complete = true
): MonthlySnapshotData => ({
  schemaVersion: 1,
  month,
  accounts: [
    {
      accountId: 'isa-1',
      kind: AccountKind.INVESTMENT,
      name: 'Stocks ISA',
      balancePence,
    },
  ],
  complete,
});

const ASSUMPTIONS = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: [],
  statePensionAnnualPence: 0,
  targetSuccessRatePct: 90,
};

const emptyHousehold = (): HouseholdData => ({
  partyId: undefined,
  members: [{ userId: 'user-1', nickname: 'James', isUser: true }],
  months: {},
  orderedMonths: [],
  effectiveAssumptions: ASSUMPTIONS,
});

const householdWithTwoMonths = (): HouseholdData => {
  const month = currentMonthId();
  const previous = previousMonthId(month);
  return {
    partyId: 'party-1',
    members: [{ userId: 'user-1', nickname: 'James', isUser: true }],
    months: {
      [previous]: {
        month: previous,
        memberSnapshots: { 'user-1': snapshot(previous, 1_000_000) },
        effectiveShared: undefined,
        complete: true,
      },
      [month]: {
        month,
        memberSnapshots: { 'user-1': snapshot(month, 1_100_000) },
        effectiveShared: undefined,
        complete: true,
      },
    },
    orderedMonths: [previous, month],
    effectiveAssumptions: ASSUMPTIONS,
  };
};

const mockUseHousehold = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/hooks/useHousehold'
).useHousehold as jest.Mock;
const mockUseRetirementModel = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/hooks/useRetirementModel'
).useRetirementModel as jest.Mock;
const mockFindEarliestRetirementAsync = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/engine/solver'
).findEarliestRetirementAsync as jest.Mock;
const AuthProvider = jest.requireMock(
  '@bubblyclouds-app/auth/providers/AuthProvider'
);

const withUser = () => {
  const originalContext = AuthProvider.UserContext;
  AuthProvider.UserContext = React.createContext({
    user: { sub: 'user-1' },
    showLoginModal: mockShowLoginModal,
    isInitialised: true,
  });
  return () => {
    AuthProvider.UserContext = originalContext;
  };
};

describe('Home Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (nextNavigation.useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockUseHousehold.mockReturnValue({
      household: emptyHousehold(),
      isLoading: false,
    });
    mockUseRetirementModel.mockReturnValue({
      members: [],
      assumptions: ASSUMPTIONS,
      readiness: { ready: false, missingDob: [], hasSnapshots: false },
    });
  });

  describe('logged out', () => {
    it('renders the marketing section with a sign-in call to action', () => {
      render(<Home />);
      expect(screen.getByText('Sign in to start tracking')).toBeInTheDocument();
      expect(
        screen.queryByTestId('net-worth-headline')
      ).not.toBeInTheDocument();
    });

    it('prompts login when the sign-in card is clicked', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('Sign in to start tracking'));
      expect(mockShowLoginModal).toHaveBeenCalled();
    });

    it('keeps the premium features, rate app and footer sections', () => {
      render(<Home />);
      expect(screen.getByTestId('premium-features')).toBeInTheDocument();
      expect(screen.getByTestId('rate-app-button')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('logged in dashboard', () => {
    let restore: () => void;

    beforeEach(() => {
      restore = withUser();
    });

    afterEach(() => {
      restore();
    });

    it('shows a loading placeholder while household data loads', () => {
      mockUseHousehold.mockReturnValue({
        household: emptyHousehold(),
        isLoading: true,
      });
      render(<Home />);
      expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
      expect(
        screen.queryByTestId('net-worth-headline')
      ).not.toBeInTheDocument();
    });

    it('shows the household headline with month-on-month change', () => {
      mockUseHousehold.mockReturnValue({
        household: householdWithTwoMonths(),
        isLoading: false,
      });
      render(<Home />);
      expect(screen.getByTestId('net-worth-headline')).toBeInTheDocument();
      expect(screen.getAllByText('£11,000').length).toBeGreaterThan(0);
      expect(screen.getByTestId('net-worth-headline-change')).toHaveTextContent(
        '+£1,000.00 (+10.0%) vs last month'
      );
    });

    it('shows per-member stat cards with their own change', () => {
      mockUseHousehold.mockReturnValue({
        household: householdWithTwoMonths(),
        isLoading: false,
      });
      render(<Home />);
      const card = screen.getByTestId('stat-card');
      expect(card).toHaveTextContent('James');
      expect(screen.getByTestId('stat-card-change')).toHaveTextContent(
        '+£1,000.00 (+10.0%)'
      );
    });

    it('shows the entry-due card when the current month is incomplete', () => {
      render(<Home />);
      expect(screen.getByTestId('entry-due-card')).toBeInTheDocument();
      expect(screen.getByText('Waiting on: James')).toBeInTheDocument();
      expect(screen.getByTestId('entry-due-card')).toHaveAttribute(
        'href',
        `/state?month=${currentMonthId()}`
      );
    });

    it('hides the entry-due card once the current month is complete', () => {
      mockUseHousehold.mockReturnValue({
        household: householdWithTwoMonths(),
        isLoading: false,
      });
      render(<Home />);
      expect(screen.queryByTestId('entry-due-card')).not.toBeInTheDocument();
    });

    it('shows the retirement setup CTA when the model is not ready', () => {
      render(<Home />);
      const cta = screen.getByTestId('retirement-setup-cta');
      expect(cta).toHaveTextContent('Set up retirement planning');
      expect(cta).toHaveAttribute('href', '/settings');
      expect(
        screen.queryByTestId('retirement-ready-card')
      ).not.toBeInTheDocument();
    });

    it('links to the retirement screen when ready without a remembered withdrawal', () => {
      mockUseRetirementModel.mockReturnValue({
        members: [],
        startMonth: currentMonthId(),
        assumptions: ASSUMPTIONS,
        readiness: { ready: true, missingDob: [], hasSnapshots: true },
      });
      render(<Home />);
      const card = screen.getByTestId('retirement-ready-card');
      expect(card).toHaveTextContent('Run your retirement plan');
      expect(card).toHaveAttribute('href', '/retirement');
      expect(mockFindEarliestRetirementAsync).not.toHaveBeenCalled();
    });

    describe('live solver headline', () => {
      const readyModelWithDefaults = () => ({
        members: [
          {
            userId: 'user-1',
            dateOfBirth: '1989-03-15',
            balancesPencePerWrapper: {},
            contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
            overrides: {},
          },
        ],
        startMonth: currentMonthId(),
        assumptions: {
          ...ASSUMPTIONS,
          defaultWithdrawalAnnualPence: 2_400_000,
          defaultPlanToAge: 92,
        },
        readiness: { ready: true, missingDob: [], hasSnapshots: true },
      });

      beforeEach(() => {
        mockUseHousehold.mockReturnValue({
          household: householdWithTwoMonths(),
          isLoading: false,
        });
        mockUseRetirementModel.mockReturnValue(readyModelWithDefaults());
        mockFindEarliestRetirementAsync.mockResolvedValue({
          earliestRetirementMonth: '2041-03',
          achievedSuccessRatePct: 91.2,
          agesAtRetirement: { 'user-1': 52 },
        });
      });

      it('auto-runs the solver with the remembered defaults and shows the headline', async () => {
        render(<Home />);
        expect(await screen.findByTestId('solver-headline')).toHaveTextContent(
          'You can retire in March 2041 (age 52) at 90% confidence'
        );
        expect(screen.getByTestId('retirement-headline-card')).toHaveAttribute(
          'href',
          '/retirement'
        );
        expect(mockFindEarliestRetirementAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            startMonth: currentMonthId(),
            planToAge: 92,
            withdrawalAnnualPence: 2_400_000,
            includeStatePension: true,
            applyTax: true,
            runs: 5000,
            seed: expect.any(Number),
          }),
          expect.objectContaining({
            windowYears: 40,
            signal: expect.any(AbortSignal),
          })
        );
      });

      it('shows the loading state with progress while solving', async () => {
        mockFindEarliestRetirementAsync.mockImplementation(
          (
            _base: unknown,
            options: { onProgress?: (_done: number, _total: number) => void }
          ) => {
            options.onProgress?.(3, 12);
            return new Promise(() => {});
          }
        );
        render(<Home />);
        expect(
          await screen.findByTestId('solver-headline-loading')
        ).toBeInTheDocument();
        // The solve starts on a deferred tick, so wait for its first
        // progress callback to land
        await waitFor(() =>
          expect(screen.getByTestId('solver-headline-progress')).toHaveStyle({
            width: '25%',
          })
        );
      });

      it('shows the unachievable state when the solver finds no date', async () => {
        mockFindEarliestRetirementAsync.mockResolvedValue({
          agesAtRetirement: {},
        });
        render(<Home />);
        expect(
          await screen.findByTestId('solver-headline-unachievable')
        ).toHaveTextContent(
          'Not yet achievable within 40 years — try the retirement planner'
        );
      });
    });

    it('shows the invite-partner CTA when there is no party', () => {
      render(<Home />);
      expect(screen.getByTestId('invite-partner-cta')).toHaveAttribute(
        'href',
        '/settings'
      );
    });

    it('hides the invite-partner CTA when a party exists', () => {
      mockUseHousehold.mockReturnValue({
        household: householdWithTwoMonths(),
        isLoading: false,
      });
      render(<Home />);
      expect(
        screen.queryByTestId('invite-partner-cta')
      ).not.toBeInTheDocument();
    });

    it('renders navigation cards to the main screens', () => {
      render(<Home />);
      expect(screen.getByText('Monthly entry').closest('a')).toHaveAttribute(
        'href',
        `/state?month=${currentMonthId()}`
      );
      expect(
        screen.getByText('Net worth over time').closest('a')
      ).toHaveAttribute('href', '/history');
      expect(
        screen.getByText('Growth projection').closest('a')
      ).toHaveAttribute('href', '/projection');
      expect(
        screen.getByText('Accounts & assumptions').closest('a')
      ).toHaveAttribute('href', '/settings');
    });
  });

  describe('footer navigation', () => {
    it('navigates to history and settings from the footer', () => {
      render(<Home />);
      fireEvent.click(screen.getByText('History'));
      expect(mockPush).toHaveBeenCalledWith('/history');
      fireEvent.click(screen.getByText('Settings'));
      expect(mockPush).toHaveBeenCalledWith('/settings');
      fireEvent.click(screen.getByText('Home'));
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
