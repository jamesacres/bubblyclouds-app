import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatePage from './page';
import * as nextNavigation from 'next/navigation';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useHousehold } from '@bubblyclouds-app/moneybagsrace/hooks/useHousehold';
import {
  MonthEntry,
  useMonthEntry,
} from '@bubblyclouds-app/moneybagsrace/hooks/useMonthEntry';
import { DEFAULT_ASSUMPTIONS } from '@bubblyclouds-app/moneybagsrace/providers/MoneyBagsDataProvider';
import {
  AccountKind,
  InvestmentWrapper,
} from '@bubblyclouds-app/moneybagsrace/types/accounts';
import { HouseholdData } from '@bubblyclouds-app/moneybagsrace/types/household';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@bubblyclouds-app/moneybagsrace/hooks/useHousehold');
jest.mock('@bubblyclouds-app/moneybagsrace/hooks/useMonthEntry');

const mockUseRouter = jest.mocked(nextNavigation.useRouter);
const mockUseSearchParams = jest.mocked(nextNavigation.useSearchParams);
const mockUseHousehold = jest.mocked(useHousehold);
const mockUseMonthEntry = jest.mocked(useMonthEntry);

const household: HouseholdData = {
  partyId: 'party-1',
  members: [
    { userId: 'user-1', nickname: 'James', isUser: true },
    { userId: 'user-2', nickname: 'Sam', isUser: false },
  ],
  months: {
    '2026-06': {
      month: '2026-06',
      memberSnapshots: {
        'user-1': {
          schemaVersion: 1,
          month: '2026-06',
          accounts: [
            {
              accountId: 'isa',
              kind: AccountKind.INVESTMENT,
              wrapper: InvestmentWrapper.ISA,
              name: 'Vanguard ISA',
              balancePence: 900_000,
            },
          ],
          complete: true,
        },
      },
      complete: false,
    },
  },
  orderedMonths: ['2026-06'],
  effectiveAssumptions: DEFAULT_ASSUMPTIONS,
};

const buildEntry = (overrides: Partial<MonthEntry> = {}): MonthEntry => ({
  month: '2026-07',
  accounts: [
    {
      accountId: 'isa',
      kind: AccountKind.INVESTMENT,
      wrapper: InvestmentWrapper.ISA,
      name: 'Vanguard ISA',
      balancePence: 1_000_000,
    },
    {
      accountId: 'monzo',
      kind: AccountKind.CASH,
      name: 'Monzo',
      balancePence: 50_000,
    },
    {
      accountId: 'amex',
      kind: AccountKind.CREDIT_CARD,
      name: 'Amex',
      balancePence: 20_000,
    },
  ],
  sharedHouseValuePence: 30_000_000,
  sharedMortgageBalancePence: 10_000_000,
  sharedUpdatedAt: undefined,
  partnerCompletion: [{ userId: 'user-2', nickname: 'Sam', entered: false }],
  isDirty: false,
  isSaving: false,
  setBalance: jest.fn(),
  setShared: jest.fn(),
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe('State Page (monthly entry)', () => {
  const mockReplace = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
      push: mockPush,
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => (key === 'month' ? '2026-07' : null)),
    } as unknown as ReturnType<typeof nextNavigation.useSearchParams>);
    mockUseHousehold.mockReturnValue({
      household,
      ownUserId: 'user-1',
      ownProfile: undefined,
      isLoading: false,
      isPartnerLoading: false,
      refresh: jest.fn(),
      saveOwnSnapshot: jest.fn(),
      saveOwnProfile: jest.fn(),
      saveSharedAssumptions: jest.fn(),
    });
    mockUseMonthEntry.mockReturnValue(buildEntry());
  });

  const renderWithUser = (
    user: object | undefined,
    showLoginModal = jest.fn()
  ) =>
    render(
      <UserContext.Provider value={{ user, showLoginModal } as never}>
        <StatePage />
      </UserContext.Provider>
    );

  it('renders the month label and grouped accounts', () => {
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('Jul 2026')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Investments' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cash' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Credit cards' })
    ).toBeInTheDocument();
    expect(screen.getByText('Vanguard ISA')).toBeInTheDocument();
    expect(screen.getByText('Monzo')).toBeInTheDocument();
    expect(screen.getByText('Amex')).toBeInTheDocument();
  });

  it('shows previous-month hints from the nearest earlier own snapshot', () => {
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('Last month: £9,000.00')).toBeInTheDocument();
  });

  it('redirects to the current month when no month is given', () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn(() => null),
    } as unknown as ReturnType<typeof nextNavigation.useSearchParams>);
    renderWithUser(undefined);
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('/state?month=')
    );
  });

  it('navigates to the previous and next months', () => {
    renderWithUser({ sub: 'user-1' });
    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(mockPush).toHaveBeenCalledWith('/state?month=2026-06');
    fireEvent.click(screen.getByLabelText('Next month'));
    expect(mockPush).toHaveBeenCalledWith('/state?month=2026-08');
  });

  it('shows the partner status chip', () => {
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('Sam: not yet entered')).toBeInTheDocument();
  });

  it('shows the entered chip when the partner has a snapshot', () => {
    mockUseMonthEntry.mockReturnValue(
      buildEntry({
        partnerCompletion: [
          { userId: 'user-2', nickname: 'Sam', entered: true },
        ],
      })
    );
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('Sam: entered')).toBeInTheDocument();
  });

  it('does not render any mark-complete controls', () => {
    renderWithUser({ sub: 'user-1' });
    expect(screen.queryByText('Mark month complete')).not.toBeInTheDocument();
    expect(screen.queryByText('Marked complete')).not.toBeInTheDocument();
    expect(screen.queryByText('Month complete')).not.toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('edits an account balance', () => {
    const entry = buildEntry();
    mockUseMonthEntry.mockReturnValue(entry);
    renderWithUser({ sub: 'user-1' });
    const inputs = screen.getAllByLabelText('Current balance');
    fireEvent.focus(inputs[0]);
    fireEvent.change(inputs[0], { target: { value: '10500' } });
    expect(entry.setBalance).toHaveBeenCalledWith('isa', 1_050_000);
  });

  it('edits shared property values', () => {
    const entry = buildEntry();
    mockUseMonthEntry.mockReturnValue(entry);
    renderWithUser({ sub: 'user-1' });
    const input = screen.getByLabelText('Mortgage balance');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '99000' } });
    expect(entry.setShared).toHaveBeenCalledWith(30_000_000, 9_900_000);
  });

  it('attributes the shared entry to the latest editor', () => {
    const updatedAt = '2026-07-10T00:00:00Z';
    mockUseHousehold.mockReturnValue({
      household: {
        ...household,
        months: {
          ...household.months,
          '2026-07': {
            month: '2026-07',
            memberSnapshots: {
              'user-2': {
                schemaVersion: 1,
                month: '2026-07',
                accounts: [],
                complete: false,
                shared: {
                  houseValuePence: 30_000_000,
                  mortgageBalancePence: 10_000_000,
                  updatedAt,
                },
              },
            },
            complete: false,
          },
        },
        orderedMonths: ['2026-06', '2026-07'],
      },
      ownUserId: 'user-1',
      ownProfile: undefined,
      isLoading: false,
      isPartnerLoading: false,
      refresh: jest.fn(),
      saveOwnSnapshot: jest.fn(),
      saveOwnProfile: jest.fn(),
      saveSharedAssumptions: jest.fn(),
    });
    mockUseMonthEntry.mockReturnValue(
      buildEntry({ sharedUpdatedAt: updatedAt })
    );
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText(/Updated by Sam/)).toBeInTheDocument();
  });

  it('autosaves on blur when there are dirty edits', async () => {
    const entry = buildEntry({ isDirty: true });
    mockUseMonthEntry.mockReturnValue(entry);
    renderWithUser({ sub: 'user-1' });
    const inputs = screen.getAllByLabelText('Current balance');
    fireEvent.focus(inputs[0]);
    fireEvent.blur(inputs[0]);
    await waitFor(() => expect(entry.save).toHaveBeenCalled());
  });

  it('does not autosave on blur when nothing is dirty', () => {
    const entry = buildEntry({ isDirty: false });
    mockUseMonthEntry.mockReturnValue(entry);
    renderWithUser({ sub: 'user-1' });
    const inputs = screen.getAllByLabelText('Current balance');
    fireEvent.focus(inputs[0]);
    fireEvent.blur(inputs[0]);
    expect(entry.save).not.toHaveBeenCalled();
  });

  it('prompts login instead of saving when a blur autosave fires logged out', () => {
    const entry = buildEntry({ isDirty: true });
    mockUseMonthEntry.mockReturnValue(entry);
    const showLoginModal = jest.fn();
    renderWithUser(undefined, showLoginModal);
    const inputs = screen.getAllByLabelText('Current balance');
    fireEvent.focus(inputs[0]);
    fireEvent.blur(inputs[0]);
    expect(showLoginModal).toHaveBeenCalled();
    expect(entry.save).not.toHaveBeenCalled();
  });

  it('flushes a pending save when navigating to another month', async () => {
    const entry = buildEntry({ isDirty: true });
    mockUseMonthEntry.mockReturnValue(entry);
    renderWithUser({ sub: 'user-1' });
    fireEvent.click(screen.getByLabelText('Next month'));
    await waitFor(() => expect(entry.save).toHaveBeenCalled());
    expect(mockPush).toHaveBeenCalledWith('/state?month=2026-08');
  });

  it('shows a saving indicator while a save is in flight', () => {
    mockUseMonthEntry.mockReturnValue(buildEntry({ isSaving: true }));
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('shows the empty state pointing to settings when no accounts exist', () => {
    mockUseMonthEntry.mockReturnValue(buildEntry({ accounts: [] }));
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('No accounts yet')).toBeInTheDocument();
    expect(screen.getByText('Go to Settings → Accounts')).toHaveAttribute(
      'href',
      '/settings'
    );
  });

  it('shows a loading state while household data loads', () => {
    mockUseHousehold.mockReturnValue({
      household,
      ownUserId: 'user-1',
      ownProfile: undefined,
      isLoading: true,
      isPartnerLoading: false,
      refresh: jest.fn(),
      saveOwnSnapshot: jest.fn(),
      saveOwnProfile: jest.fn(),
      saveSharedAssumptions: jest.fn(),
    });
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
