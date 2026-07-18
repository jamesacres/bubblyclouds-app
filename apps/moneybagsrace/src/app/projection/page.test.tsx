import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { currentMonthId } from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import { InvestmentWrapper } from '@bubblyclouds-app/moneybagsrace/types/accounts';
import { HouseholdData } from '@bubblyclouds-app/moneybagsrace/types/household';
import {
  ContributionPlan,
  ProfileData,
} from '@bubblyclouds-app/moneybagsrace/types/profile';
import ProjectionPage from './page';

jest.mock('@bubblyclouds-app/moneybagsrace/hooks/useHousehold', () => ({
  useHousehold: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/components/FanChart', () => ({
  __esModule: true,
  default: function MockFanChart({
    mode,
    horizonMonths,
    contributionOverrides,
    milestonePence,
  }: {
    mode: string;
    horizonMonths: number;
    contributionOverrides?: { [userId: string]: ContributionPlan };
    milestonePence?: number;
  }) {
    return (
      <div
        data-testid="fan-chart-stub"
        data-mode={mode}
        data-horizon-months={horizonMonths}
        data-overrides={JSON.stringify(contributionOverrides)}
        data-milestone={milestonePence ?? ''}
      />
    );
  },
}));

const mockShowLoginModal = jest.fn();

jest.mock('@bubblyclouds-app/auth/providers/AuthProvider', () => ({
  UserContext: React.createContext({
    user: { sub: 'user-1' },
    showLoginModal: (...args: unknown[]) => mockShowLoginModal(...args),
    isInitialised: true,
  }),
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
}));

const ASSUMPTIONS = {
  inflationRatePct: 2.5,
  returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
  taxBands: [],
  statePensionAnnualPence: 0,
  targetSuccessRatePct: 90,
};

const profile = (): ProfileData => ({
  schemaVersion: 1,
  accounts: [],
  contributions: {
    monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 50_000 },
    stepChanges: [],
  },
  overrides: {},
});

const household = (): HouseholdData => ({
  partyId: 'party-1',
  members: [
    { userId: 'user-1', nickname: 'James', isUser: true, profile: profile() },
  ],
  months: {},
  orderedMonths: [],
  effectiveAssumptions: ASSUMPTIONS,
});

const mockUseHousehold = jest.requireMock(
  '@bubblyclouds-app/moneybagsrace/hooks/useHousehold'
).useHousehold as jest.Mock;

const mockSaveOwnProfile = jest.fn();

const chartStub = () => screen.getByTestId('fan-chart-stub');

describe('Projection Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveOwnProfile.mockResolvedValue(undefined);
    mockUseHousehold.mockReturnValue({
      household: household(),
      ownUserId: 'user-1',
      ownProfile: profile(),
      saveOwnProfile: mockSaveOwnProfile,
    });
  });

  it('renders the fan chart with the default 30-year nominal view', () => {
    render(<ProjectionPage />);
    expect(chartStub()).toHaveAttribute('data-mode', 'nominal');
    expect(chartStub()).toHaveAttribute('data-horizon-months', '360');
    expect(chartStub()).toHaveAttribute('data-milestone', '');
  });

  it('changes the horizon with the year chips', () => {
    render(<ProjectionPage />);
    fireEvent.click(screen.getByRole('button', { name: '10y' }));
    expect(chartStub()).toHaveAttribute('data-horizon-months', '120');
    fireEvent.click(screen.getByRole('button', { name: '40y' }));
    expect(chartStub()).toHaveAttribute('data-horizon-months', '480');
  });

  it('switches between real and nominal modes', () => {
    render(<ProjectionPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Real' }));
    expect(chartStub()).toHaveAttribute('data-mode', 'real');
    expect(screen.getByTestId('real-nominal-label')).toHaveTextContent(
      "Showing real values (today's money)"
    );
  });

  it('passes the FIRE number to the chart as a milestone', () => {
    render(<ProjectionPage />);
    const input = screen.getByLabelText('FIRE number');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '600000' } });
    expect(chartStub()).toHaveAttribute('data-milestone', '60000000');
  });

  it('feeds the own contribution plan into the chart as an override', () => {
    render(<ProjectionPage />);
    expect(
      JSON.parse(chartStub().getAttribute('data-overrides') ?? '{}')['user-1']
    ).toEqual(profile().contributions);
  });

  it('edits the own plan and saves it to the profile', async () => {
    render(<ProjectionPage />);
    const saveButton = screen.getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();
    const isaInput = screen.getByLabelText('ISA monthly');
    fireEvent.focus(isaInput);
    fireEvent.change(isaInput, { target: { value: '750' } });
    const overrides = JSON.parse(
      chartStub().getAttribute('data-overrides') ?? '{}'
    );
    expect(overrides['user-1'].monthlyPencePerWrapper.ISA).toBe(75_000);
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(mockSaveOwnProfile).toHaveBeenCalledWith({
        ...profile(),
        contributions: {
          monthlyPencePerWrapper: { [InvestmentWrapper.ISA]: 75_000 },
          stepChanges: [],
        },
      })
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    );
  });

  it('adds a step change starting from the current month', () => {
    render(<ProjectionPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Add step change' }));
    expect(screen.getByLabelText('From month')).toHaveValue(currentMonthId());
  });

  it('links back to the dashboard', () => {
    render(<ProjectionPage />);
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/');
  });
});
