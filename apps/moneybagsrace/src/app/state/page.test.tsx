import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatePage from './page';
import * as nextNavigation from 'next/navigation';
import * as localStorageHook from '@bubblyclouds-app/template/hooks/localStorage';
import * as serverStorageHook from '@bubblyclouds-app/template/hooks/serverStorage';
import { UserContext } from '@bubblyclouds-app/auth/providers/AuthProvider';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@bubblyclouds-app/template/hooks/localStorage');
jest.mock('@bubblyclouds-app/template/hooks/serverStorage');

const mockUseRouter = nextNavigation.useRouter as jest.Mock;
const mockUseSearchParams = nextNavigation.useSearchParams as jest.Mock;
const mockUseLocalStorage =
  localStorageHook.useLocalStorage as unknown as jest.Mock;
const mockUseServerStorage =
  serverStorageHook.useServerStorage as unknown as jest.Mock;

describe('State Page', () => {
  const mockReplace = jest.fn();
  const mockGetLocalValue = jest.fn();
  const mockSaveLocalValue = jest.fn();
  const mockGetServerValue = jest.fn();
  const mockSaveServerValue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({ replace: mockReplace, push: jest.fn() });
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => (key === 'month' ? '2026-07' : null)),
    });

    mockGetLocalValue.mockReturnValue(undefined);
    mockGetServerValue.mockResolvedValue(undefined);
    mockUseLocalStorage.mockReturnValue({
      getValue: mockGetLocalValue,
      saveValue: mockSaveLocalValue,
    });
    mockUseServerStorage.mockReturnValue({
      getValue: mockGetServerValue,
      saveValue: mockSaveServerValue,
    });
  });

  const renderWithUser = (user: object | undefined) =>
    render(
      <UserContext.Provider
        value={
          {
            user,
            showLoginModal: jest.fn(),
          } as never
        }
      >
        <StatePage />
      </UserContext.Provider>
    );

  it('renders the month from the query param', async () => {
    renderWithUser(undefined);
    expect(await screen.findByText('2026-07')).toBeInTheDocument();
  });

  it('redirects to the current month when no month is given', () => {
    mockUseSearchParams.mockReturnValue({ get: jest.fn(() => null) });
    renderWithUser(undefined);
    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining('/state?month=')
    );
  });

  it('loads local state into the editor', async () => {
    mockGetLocalValue.mockReturnValue({
      lastUpdated: Date.now(),
      state: {
        answerStack: [],
        initial: {},
        final: {},
        data: { balance: 100 },
      },
    });

    renderWithUser(undefined);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue(
        JSON.stringify({ balance: 100 }, null, 2)
      );
    });
  });

  it('prompts login when saving while logged out', async () => {
    const showLoginModal = jest.fn();
    render(
      <UserContext.Provider
        value={{ user: undefined, showLoginModal } as never}
      >
        <StatePage />
      </UserContext.Provider>
    );

    await screen.findByRole('textbox');
    fireEvent.click(screen.getByText('Save'));

    expect(showLoginModal).toHaveBeenCalled();
    expect(mockSaveLocalValue).not.toHaveBeenCalled();
  });

  it('saves valid JSON locally and to the server when logged in', async () => {
    mockSaveServerValue.mockResolvedValue({ updatedAt: new Date() });
    renderWithUser({ sub: 'user-1' });

    const textarea = await screen.findByRole('textbox');
    fireEvent.change(textarea, { target: { value: '{"balance":200}' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(mockSaveLocalValue).toHaveBeenCalled();
      expect(mockSaveServerValue).toHaveBeenCalled();
    });
  });

  it('shows an error and does not save invalid JSON', async () => {
    renderWithUser({ sub: 'user-1' });

    const textarea = await screen.findByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'not json' } });
    fireEvent.click(screen.getByText('Save'));

    expect(
      await screen.findByText(/./, { selector: 'p.text-red-500' })
    ).toBeInTheDocument();
    expect(mockSaveLocalValue).not.toHaveBeenCalled();
  });
});
