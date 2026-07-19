import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from './page';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import { useParties } from '@bubblyclouds-app/template/hooks/useParties';
import { useHousehold } from '@bubblyclouds-app/moneybagsrace/hooks/useHousehold';
import { DEFAULT_ASSUMPTIONS } from '@bubblyclouds-app/moneybagsrace/providers/MoneyBagsDataProvider';
import { HouseholdData } from '@bubblyclouds-app/moneybagsrace/types/household';
import {
  AccountKind,
  InvestmentWrapper,
} from '@bubblyclouds-app/moneybagsrace/types/accounts';
import { ProfileData } from '@bubblyclouds-app/moneybagsrace/types/profile';

jest.mock('@bubblyclouds-app/moneybagsrace/hooks/useHousehold');
jest.mock('@bubblyclouds-app/template/hooks/useParties');
jest.mock('@bubblyclouds-app/template/components/PartyInviteButton', () => ({
  PartyInviteButton: () => <div>Invite link</div>,
}));

const mockUseHousehold = jest.mocked(useHousehold);
const mockUseParties = jest.mocked(useParties);

const household: HouseholdData = {
  partyId: undefined,
  members: [{ userId: 'user-1', nickname: 'James', isUser: true }],
  months: {},
  orderedMonths: [],
  effectiveAssumptions: DEFAULT_ASSUMPTIONS,
};

const ownProfile: ProfileData = {
  schemaVersion: 1,
  accounts: [
    {
      accountId: 'isa',
      kind: AccountKind.INVESTMENT,
      wrapper: InvestmentWrapper.ISA,
      name: 'Vanguard ISA',
      sortOrder: 0,
      createdMonth: '2026-01',
    },
  ],
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
};

const partiesValue = (overrides: object = {}) =>
  ({
    parties: [],
    isLoading: false,
    showCreateParty: false,
    setShowCreateParty: jest.fn(),
    isSaving: false,
    memberNickname: 'James',
    setMemberNickname: jest.fn(),
    partyName: 'Our household',
    setPartyName: jest.fn(),
    saveParty: jest.fn(),
    updateParty: jest.fn(),
    refreshParties: jest.fn(),
    getNicknameByUserId: jest.fn(),
    leaveParty: jest.fn(),
    removeMember: jest.fn(),
    deleteParty: jest.fn(),
    ...overrides,
  }) as unknown as ReturnType<typeof useParties>;

describe('Settings Page', () => {
  const saveOwnProfile = jest.fn().mockResolvedValue(undefined);
  const saveSharedAssumptions = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHousehold.mockReturnValue({
      household,
      ownUserId: 'user-1',
      ownProfile,
      isLoading: false,
      isPartnerLoading: false,
      refresh: jest.fn(),
      saveOwnSnapshot: jest.fn(),
      saveOwnProfile,
      saveSharedAssumptions,
    });
    mockUseParties.mockReturnValue(partiesValue());
  });

  const renderWithUser = (
    user: object | undefined,
    showLoginModal = jest.fn()
  ) =>
    render(
      <UserContext.Provider value={{ user, showLoginModal } as never}>
        <SettingsPage />
      </UserContext.Provider>
    );

  it('renders all settings sections', () => {
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Contributions')).toBeInTheDocument();
    expect(screen.getByText('Assumptions')).toBeInTheDocument();
    expect(screen.getByText('Party')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Vanguard ISA')).toBeInTheDocument();
  });

  it('shows a loading state', () => {
    mockUseHousehold.mockReturnValue({
      household,
      ownUserId: 'user-1',
      ownProfile: undefined,
      isLoading: true,
      isPartnerLoading: false,
      refresh: jest.fn(),
      saveOwnSnapshot: jest.fn(),
      saveOwnProfile,
      saveSharedAssumptions,
    });
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('autosaves account edits when the Accounts section loses focus', async () => {
    renderWithUser({ sub: 'user-1' });
    expect(screen.queryByText('Save')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Account name'), {
      target: { value: 'Monzo' },
    });
    fireEvent.change(screen.getByLabelText('Account type'), {
      target: { value: AccountKind.CASH },
    });
    fireEvent.click(screen.getByText('Add'));
    expect(saveOwnProfile).not.toHaveBeenCalled();

    fireEvent.blur(screen.getByRole('region', { name: 'Accounts' }));
    await waitFor(() => expect(saveOwnProfile).toHaveBeenCalled());
    const saved: ProfileData = saveOwnProfile.mock.calls[0][0];
    expect(saved.accounts).toHaveLength(2);
    expect(saved.accounts[1].name).toBe('Monzo');
    expect(saved.accounts[1].kind).toBe(AccountKind.CASH);
    await waitFor(() =>
      expect(screen.getAllByText('Saved').length).toBeGreaterThan(0)
    );
  });

  it('autosaves date of birth and overrides when the You section blurs', async () => {
    renderWithUser({ sub: 'user-1' });
    fireEvent.change(screen.getByLabelText('Date of birth'), {
      target: { value: '1989-03-04' },
    });
    fireEvent.change(screen.getByLabelText('Pension access age override'), {
      target: { value: '58' },
    });
    fireEvent.blur(screen.getByRole('region', { name: 'You' }));
    await waitFor(() => expect(saveOwnProfile).toHaveBeenCalled());
    const saved: ProfileData = saveOwnProfile.mock.calls[0][0];
    expect(saved.dateOfBirth).toBe('1989-03-04');
    expect(saved.overrides.nmpaAgeOverride).toBe(58);
  });

  it('autosaves contribution edits when the section blurs', async () => {
    renderWithUser({ sub: 'user-1' });
    const input = screen.getByLabelText('SIPP monthly');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '400' } });
    fireEvent.blur(screen.getByRole('region', { name: 'Contributions' }));
    await waitFor(() => expect(saveOwnProfile).toHaveBeenCalled());
    const saved: ProfileData = saveOwnProfile.mock.calls[0][0];
    expect(
      saved.contributions.monthlyPencePerWrapper[InvestmentWrapper.SIPP]
    ).toBe(40_000);
  });

  it('autosaves shared assumptions separately when the section blurs', async () => {
    renderWithUser({ sub: 'user-1' });
    fireEvent.change(screen.getByLabelText('Inflation rate'), {
      target: { value: '3' },
    });
    fireEvent.blur(screen.getByRole('region', { name: 'Assumptions' }));
    await waitFor(() => expect(saveSharedAssumptions).toHaveBeenCalled());
    expect(saveSharedAssumptions).toHaveBeenCalledWith({
      ...DEFAULT_ASSUMPTIONS,
      inflationRatePct: 3,
    });
    expect(saveOwnProfile).not.toHaveBeenCalled();
  });

  it('flushes pending edits when navigating home', async () => {
    renderWithUser({ sub: 'user-1' });
    fireEvent.change(screen.getByLabelText('Date of birth'), {
      target: { value: '1989-03-04' },
    });
    fireEvent.click(screen.getByText('Home'));
    await waitFor(() => expect(saveOwnProfile).toHaveBeenCalled());
    expect(saveOwnProfile.mock.calls[0][0].dateOfBirth).toBe('1989-03-04');
  });

  it('prompts login instead of saving when logged out', () => {
    const showLoginModal = jest.fn();
    renderWithUser(undefined, showLoginModal);
    fireEvent.change(screen.getByLabelText('Date of birth'), {
      target: { value: '1989-03-04' },
    });
    fireEvent.blur(screen.getByRole('region', { name: 'You' }));
    expect(showLoginModal).toHaveBeenCalled();
    expect(saveOwnProfile).not.toHaveBeenCalled();
  });

  it('creates a couple party capped at two members', async () => {
    const saveParty = jest
      .fn()
      .mockResolvedValue({ partyId: 'party-1', partyName: 'Our household' });
    const updateParty = jest.fn().mockResolvedValue(true);
    mockUseParties.mockReturnValue(partiesValue({ saveParty, updateParty }));
    renderWithUser({ sub: 'user-1' });
    fireEvent.click(screen.getByText('Create household'));
    await waitFor(() =>
      expect(saveParty).toHaveBeenCalledWith({
        memberNickname: 'James',
        partyName: 'Our household',
      })
    );
    expect(updateParty).toHaveBeenCalledWith('party-1', { maxSize: 2 });
  });

  it('shows members and the invite button when a party exists with space', () => {
    mockUseParties.mockReturnValue(
      partiesValue({
        parties: [
          {
            partyId: 'party-1',
            partyName: 'Acres HQ',
            isOwner: true,
            members: [
              { userId: 'user-1', memberNickname: 'James', isUser: true },
            ],
          },
        ],
      })
    );
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('Acres HQ')).toBeInTheDocument();
    expect(screen.getByText('James')).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Invite link')).toBeInTheDocument();
  });

  it('hides the invite button when the couple is full', () => {
    mockUseParties.mockReturnValue(
      partiesValue({
        parties: [
          {
            partyId: 'party-1',
            partyName: 'Acres HQ',
            isOwner: true,
            members: [
              { userId: 'user-1', memberNickname: 'James', isUser: true },
              { userId: 'user-2', memberNickname: 'Sam', isUser: false },
            ],
          },
        ],
      })
    );
    renderWithUser({ sub: 'user-1' });
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    expect(screen.queryByText('Invite link')).not.toBeInTheDocument();
  });

  it('asks logged-out users to sign in before party setup', () => {
    const showLoginModal = jest.fn();
    renderWithUser(undefined, showLoginModal);
    fireEvent.click(screen.getByText('Sign in to invite your partner'));
    expect(showLoginModal).toHaveBeenCalled();
  });
});
