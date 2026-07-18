import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';
import * as localStorageHook from '@bubblyclouds-app/template/hooks/localStorage';
import * as serverStorageHook from '@bubblyclouds-app/template/hooks/serverStorage';
import * as usePartiesHook from '@bubblyclouds-app/template/hooks/useParties';
import { StateType } from '@bubblyclouds-app/types/stateType';
import { useHousehold } from '../hooks/useHousehold';
import { AccountKind } from '../types/accounts';
import { HouseholdData } from '../types/household';
import { MonthlySnapshotData } from '../types/snapshot';
import { ProfileData } from '../types/profile';
import {
  DEFAULT_ASSUMPTIONS,
  LOCAL_USER_ID,
  MoneyBagsDataProvider,
} from './MoneyBagsDataProvider';

jest.mock('@bubblyclouds-app/template/hooks/localStorage');
jest.mock('@bubblyclouds-app/template/hooks/serverStorage');
jest.mock('@bubblyclouds-app/template/hooks/useParties');

const mockUseLocalStorage =
  localStorageHook.useLocalStorage as unknown as jest.Mock;
const mockUseServerStorage =
  serverStorageHook.useServerStorage as unknown as jest.Mock;
const mockUseParties = usePartiesHook.useParties as unknown as jest.Mock;

const APP = 'moneybagsrace';

const envelope = (data: unknown) => ({
  answerStack: [],
  initial: {},
  final: {},
  data,
});

const snapshot = (
  month: string,
  overrides: Partial<MonthlySnapshotData> = {}
): MonthlySnapshotData => ({
  schemaVersion: 1,
  month,
  accounts: [],
  complete: false,
  ...overrides,
});

const profile = (overrides: Partial<ProfileData> = {}): ProfileData => ({
  schemaVersion: 1,
  accounts: [],
  contributions: { monthlyPencePerWrapper: {}, stepChanges: [] },
  overrides: {},
  ...overrides,
});

const localEntry = (id: string, lastUpdated: number, data: unknown) => ({
  sessionId: `${APP}-${id}`,
  lastUpdated,
  state: envelope(data),
});

const serverEntry = (id: string, updatedAt: Date, data: unknown) => ({
  sessionId: `${APP}-${id}`,
  updatedAt,
  state: envelope(data),
});

const member = (userId: string, nickname: string, isUser: boolean) => ({
  userId,
  resourceId: 'party-party-1',
  memberNickname: nickname,
  createdAt: new Date(),
  updatedAt: new Date(),
  isOwner: userId === 'user-1',
  isUser,
});

const coupleParty = {
  partyId: 'party-1',
  appId: APP,
  partyName: 'Us',
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  isOwner: true,
  members: [member('user-1', 'James', true), member('user-2', 'Sam', false)],
};

const Consumer = () => {
  const {
    household,
    ownUserId,
    isLoading,
    isPartnerLoading,
    saveOwnSnapshot,
    saveOwnProfile,
    saveSharedAssumptions,
    refresh,
  } = useHousehold();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="partner-loading">{String(isPartnerLoading)}</span>
      <span data-testid="own-user-id">{ownUserId}</span>
      <span data-testid="household">{JSON.stringify(household)}</span>
      <button
        onClick={() =>
          saveOwnSnapshot('2026-07', snapshot('2026-07', { complete: true }))
        }
      >
        save-snapshot
      </button>
      <button
        onClick={() => saveOwnProfile(profile({ dateOfBirth: '1990-01-01' }))}
      >
        save-profile
      </button>
      <button
        onClick={() =>
          saveSharedAssumptions({ ...DEFAULT_ASSUMPTIONS, inflationRatePct: 3 })
        }
      >
        save-assumptions
      </button>
      <button onClick={() => refresh()}>refresh</button>
    </div>
  );
};

const readHousehold = (): HouseholdData =>
  JSON.parse(screen.getByTestId('household').textContent ?? '{}');

describe('MoneyBagsDataProvider', () => {
  const mockGetLocalValue = jest.fn();
  const mockListLocalValues = jest.fn();
  const mockSaveLocalValue = jest.fn();
  const mockListServerValues = jest.fn();
  const mockSaveServerValue = jest.fn();
  const mockSetIdAndType = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLocalValue.mockReturnValue(undefined);
    mockListLocalValues.mockReturnValue([]);
    mockSaveLocalValue.mockImplementation((state: unknown) => ({
      lastUpdated: Date.now(),
      state,
    }));
    mockListServerValues.mockResolvedValue([]);
    mockSaveServerValue.mockResolvedValue(undefined);
    mockUseLocalStorage.mockReturnValue({
      getValue: mockGetLocalValue,
      listValues: mockListLocalValues,
      saveValue: mockSaveLocalValue,
    });
    mockUseServerStorage.mockReturnValue({
      listValues: mockListServerValues,
      saveValue: mockSaveServerValue,
      setIdAndType: mockSetIdAndType,
    });
    mockUseParties.mockReturnValue({ parties: [] } as never);
  });

  const renderWithUser = (user: object | undefined) =>
    render(
      <UserContext.Provider value={{ user } as never}>
        <MoneyBagsDataProvider app={APP} apiUrl="https://api.test">
          <Consumer />
        </MoneyBagsDataProvider>
      </UserContext.Provider>
    );

  const renderLoggedIn = async () => {
    renderWithUser({ sub: 'user-1', name: 'James' });
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
  };

  describe('newest-wins merge of local and server sessions', () => {
    const localSnapshot = snapshot('2026-06', {
      accounts: [
        {
          accountId: 'a',
          kind: AccountKind.CASH,
          name: 'Bank',
          balancePence: 111,
        },
      ],
    });
    const serverSnapshot = snapshot('2026-06', {
      accounts: [
        {
          accountId: 'a',
          kind: AccountKind.CASH,
          name: 'Bank',
          balancePence: 222,
        },
      ],
    });

    it('uses the local session when local lastUpdated is newer', async () => {
      mockListLocalValues.mockReturnValue([
        localEntry(
          '2026-06',
          Date.parse('2026-06-17T12:00:00Z'),
          localSnapshot
        ),
      ]);
      mockListServerValues.mockResolvedValue([
        serverEntry(
          '2026-06',
          new Date('2026-06-17T10:00:00Z'),
          serverSnapshot
        ),
      ]);

      await renderLoggedIn();

      const household = readHousehold();
      expect(household.orderedMonths).toEqual(['2026-06']);
      expect(
        household.months['2026-06'].memberSnapshots['user-1']?.accounts[0]
          .balancePence
      ).toBe(111);
    });

    it('uses the server session when server updatedAt is newer', async () => {
      mockListLocalValues.mockReturnValue([
        localEntry(
          '2026-06',
          Date.parse('2026-06-17T10:00:00Z'),
          localSnapshot
        ),
      ]);
      mockListServerValues.mockResolvedValue([
        serverEntry(
          '2026-06',
          new Date('2026-06-17T12:00:00Z'),
          serverSnapshot
        ),
      ]);

      await renderLoggedIn();

      expect(
        readHousehold().months['2026-06'].memberSnapshots['user-1']?.accounts[0]
          .balancePence
      ).toBe(222);
    });

    it('merges the local profile read via getValue', async () => {
      mockGetLocalValue.mockReturnValue({
        lastUpdated: Date.parse('2026-06-01T00:00:00Z'),
        state: envelope(profile({ dateOfBirth: '1990-05-04' })),
      });

      await renderLoggedIn();

      expect(mockGetLocalValue).toHaveBeenCalledWith({
        overrideId: 'profile',
      });
      const household = readHousehold();
      expect(household.members[0].profile?.dateOfBirth).toBe('1990-05-04');
    });
  });

  describe('partner data', () => {
    beforeEach(() => {
      mockUseParties.mockReturnValue({ parties: [coupleParty] } as never);
    });

    it('fetches partner sessions via listValues({ partyId, userId })', async () => {
      await renderLoggedIn();

      await waitFor(() => {
        expect(mockListServerValues).toHaveBeenCalledWith({
          partyId: 'party-1',
          userId: 'user-2',
        });
      });
      await waitFor(() => {
        expect(screen.getByTestId('partner-loading')).toHaveTextContent(
          'false'
        );
      });
      const household = readHousehold();
      expect(household.partyId).toBe('party-1');
      expect(household.members.map((m) => m.nickname)).toEqual([
        'James',
        'Sam',
      ]);
    });

    it('resolves shared assets by last write wins across members', async () => {
      mockListServerValues.mockImplementation(
        async (args?: { partyId?: string; userId?: string }) => {
          if (args?.userId === 'user-2') {
            return [
              serverEntry(
                '2026-06',
                new Date('2026-06-18T00:00:00Z'),
                snapshot('2026-06', {
                  complete: true,
                  shared: {
                    houseValuePence: 30_000_000,
                    mortgageBalancePence: 10_000_000,
                    updatedAt: '2026-06-18T00:00:00Z',
                  },
                })
              ),
            ];
          }
          return [
            serverEntry(
              '2026-06',
              new Date('2026-06-17T00:00:00Z'),
              snapshot('2026-06', {
                complete: true,
                shared: {
                  houseValuePence: 29_000_000,
                  mortgageBalancePence: 11_000_000,
                  updatedAt: '2026-06-17T00:00:00Z',
                },
              })
            ),
          ];
        }
      );

      await renderLoggedIn();
      await waitFor(() => {
        expect(screen.getByTestId('partner-loading')).toHaveTextContent(
          'false'
        );
      });

      await waitFor(() => {
        expect(
          readHousehold().months['2026-06'].effectiveShared?.houseValuePence
        ).toBe(30_000_000);
      });
    });

    it('marks a month complete only when every member is complete and shared exists', async () => {
      const shared = {
        houseValuePence: 30_000_000,
        mortgageBalancePence: 10_000_000,
        updatedAt: '2026-06-17T00:00:00Z',
      };
      mockListServerValues.mockImplementation(
        async (args?: { partyId?: string; userId?: string }) => {
          if (args?.userId === 'user-2') {
            return [
              serverEntry(
                '2026-06',
                new Date('2026-06-18T00:00:00Z'),
                snapshot('2026-06', { complete: true })
              ),
              serverEntry(
                '2026-05',
                new Date('2026-05-18T00:00:00Z'),
                snapshot('2026-05', { complete: true, shared })
              ),
            ];
          }
          return [
            serverEntry(
              '2026-06',
              new Date('2026-06-17T00:00:00Z'),
              snapshot('2026-06', { complete: true, shared })
            ),
            serverEntry(
              '2026-05',
              new Date('2026-05-17T00:00:00Z'),
              snapshot('2026-05', { complete: false })
            ),
          ];
        }
      );

      await renderLoggedIn();
      await waitFor(() => {
        expect(screen.getByTestId('partner-loading')).toHaveTextContent(
          'false'
        );
      });

      await waitFor(() => {
        const household = readHousehold();
        // Both members complete + shared entry present
        expect(household.months['2026-06'].complete).toBe(true);
        // Own member incomplete despite shared entry existing
        expect(household.months['2026-05'].complete).toBe(false);
      });
    });

    it('resolves shared assumptions by last write wins across member profiles', async () => {
      mockListServerValues.mockImplementation(
        async (args?: { partyId?: string; userId?: string }) => {
          if (args?.userId === 'user-2') {
            return [
              serverEntry(
                'profile',
                new Date('2026-06-02T00:00:00Z'),
                profile({
                  sharedAssumptions: {
                    updatedAt: '2026-06-02T00:00:00Z',
                    assumptions: {
                      ...DEFAULT_ASSUMPTIONS,
                      inflationRatePct: 3.5,
                    },
                  },
                })
              ),
            ];
          }
          return [
            serverEntry(
              'profile',
              new Date('2026-06-01T00:00:00Z'),
              profile({
                sharedAssumptions: {
                  updatedAt: '2026-06-01T00:00:00Z',
                  assumptions: { ...DEFAULT_ASSUMPTIONS, inflationRatePct: 2 },
                },
              })
            ),
          ];
        }
      );

      await renderLoggedIn();
      await waitFor(() => {
        expect(screen.getByTestId('partner-loading')).toHaveTextContent(
          'false'
        );
      });

      await waitFor(() => {
        expect(readHousehold().effectiveAssumptions.inflationRatePct).toBe(3.5);
      });
    });
  });

  describe('mutations', () => {
    it('dual-writes snapshots with a far-future server expiresAt', async () => {
      await renderLoggedIn();

      await act(async () => {
        screen.getByText('save-snapshot').click();
      });

      expect(mockSaveLocalValue).toHaveBeenCalledWith(
        envelope(snapshot('2026-07', { complete: true })),
        { overrideId: '2026-07' }
      );
      expect(mockSetIdAndType).toHaveBeenCalledWith({
        type: StateType.PUZZLE,
        id: '2026-07',
      });
      expect(mockSaveServerValue).toHaveBeenCalledTimes(1);
      const [serverState, options] = mockSaveServerValue.mock.calls[0];
      expect(serverState).toEqual(
        envelope(snapshot('2026-07', { complete: true }))
      );
      expect(options.expiresAt).toBeInstanceOf(Date);
      expect(options.expiresAt.getFullYear()).toBeGreaterThanOrEqual(
        new Date().getFullYear() + 99
      );

      // Optimistic in-memory update without a refresh
      expect(readHousehold().orderedMonths).toContain('2026-07');
    });

    it('dual-writes the profile under the profile session id', async () => {
      await renderLoggedIn();

      await act(async () => {
        screen.getByText('save-profile').click();
      });

      expect(mockSaveLocalValue).toHaveBeenCalledWith(
        envelope(profile({ dateOfBirth: '1990-01-01' })),
        { overrideId: 'profile' }
      );
      expect(mockSetIdAndType).toHaveBeenCalledWith({
        type: StateType.PUZZLE,
        id: 'profile',
      });
      const [, options] = mockSaveServerValue.mock.calls[0];
      expect(options.expiresAt.getFullYear()).toBeGreaterThanOrEqual(
        new Date().getFullYear() + 99
      );
      expect(readHousehold().members[0].profile?.dateOfBirth).toBe(
        '1990-01-01'
      );
    });

    it('stamps updatedAt and writes shared assumptions into the own profile', async () => {
      mockGetLocalValue.mockReturnValue({
        lastUpdated: Date.parse('2026-06-01T00:00:00Z'),
        state: envelope(profile({ dateOfBirth: '1985-03-02' })),
      });
      await renderLoggedIn();

      const before = Date.now();
      await act(async () => {
        screen.getByText('save-assumptions').click();
      });

      const [serverState] = mockSaveServerValue.mock.calls[0];
      const savedProfile: ProfileData = serverState.data;
      // Base profile fields preserved
      expect(savedProfile.dateOfBirth).toBe('1985-03-02');
      expect(savedProfile.sharedAssumptions?.assumptions.inflationRatePct).toBe(
        3
      );
      expect(
        Date.parse(savedProfile.sharedAssumptions?.updatedAt ?? '')
      ).toBeGreaterThanOrEqual(before);
      expect(readHousehold().effectiveAssumptions.inflationRatePct).toBe(3);
    });
  });

  describe('logged out', () => {
    it('builds a local-only household without touching the server', async () => {
      mockListLocalValues.mockReturnValue([
        localEntry(
          '2026-06',
          Date.parse('2026-06-17T12:00:00Z'),
          snapshot('2026-06')
        ),
      ]);

      renderWithUser(undefined);
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('false');
      });

      expect(mockListServerValues).not.toHaveBeenCalled();
      expect(screen.getByTestId('own-user-id')).toHaveTextContent(
        LOCAL_USER_ID
      );
      const household = readHousehold();
      expect(household.partyId).toBeUndefined();
      expect(household.members).toHaveLength(1);
      expect(household.members[0].isUser).toBe(true);
      expect(household.orderedMonths).toEqual(['2026-06']);
      expect(household.effectiveAssumptions).toEqual(DEFAULT_ASSUMPTIONS);
    });
  });

  describe('refresh', () => {
    it('reloads own and partner sessions on demand', async () => {
      mockUseParties.mockReturnValue({ parties: [coupleParty] } as never);
      await renderLoggedIn();
      await waitFor(() => {
        expect(screen.getByTestId('partner-loading')).toHaveTextContent(
          'false'
        );
      });
      mockListServerValues.mockClear();

      await act(async () => {
        screen.getByText('refresh').click();
      });

      expect(mockListServerValues).toHaveBeenCalledWith();
      expect(mockListServerValues).toHaveBeenCalledWith({
        partyId: 'party-1',
        userId: 'user-2',
      });
    });
  });
});
