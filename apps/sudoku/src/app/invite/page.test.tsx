import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';
import Invite from './page';
import * as sudokuServerStorageHook from '@sudoku-web/sudoku/hooks/useSudokuServerStorage';
import * as usePartiesHook from '@sudoku-web/template/hooks/useParties';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import {
  RevenueCatContextInterface,
  RevenueCatContext,
} from '@sudoku-web/template/providers/RevenueCatProvider';
import FetchProvider from '@sudoku-web/auth/providers/FetchProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  EntitlementDuration,
  PublicInvite,
  Party,
} from '@sudoku-web/types/serverTypes';

// Mock dependencies
jest.mock('next/navigation');
jest.mock('@sudoku-web/template/hooks/useParties');
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...rest} />;
  },
}));
jest.mock('@sudoku-web/sudoku/hooks/useSudokuServerStorage');
jest.mock('@sudoku-web/template/components/PremiumFeatures', () => ({
  PremiumFeatures: function MockPremiumFeatures() {
    return <div data-testid="premium-features">Premium Features Mock</div>;
  },
}));

const mockUseRouter = useRouter as jest.Mock;
const mockUseSearchParams = useSearchParams as jest.Mock;
const mockUseSudokuServerStorage =
  sudokuServerStorageHook.useSudokuServerStorage as jest.Mock;
const mockUseParties = usePartiesHook.useParties as jest.Mock;

describe('Invite Page', () => {
  const mockPublicInvite: PublicInvite = {
    resourceId: 'party-456',
    description: 'Test Racing Team',
    redirectUri: '/puzzle?initial=1&final=9',
    sessionId: 'session-123',
    entitlementDuration: EntitlementDuration.ONE_MONTH,
  };

  const mockUser = {
    sub: 'user-123',
    name: 'John Doe',
    given_name: 'John',
    email: 'john@example.com',
  };

  let mockUserContext: UserContextInterface;
  let mockRevenueCatContext: RevenueCatContextInterface;
  let mockGetPublicInvite: jest.Mock;
  let mockCreateMember: jest.Mock;
  let mockRefreshParties: jest.Mock;
  let mockUsePartiesValue: ReturnType<typeof usePartiesHook.useParties>;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockSearchParams = new URLSearchParams();
    mockSearchParams.set('inviteId', 'invite-123');
    mockUseSearchParams.mockReturnValue(mockSearchParams);

    mockUseRouter.mockReturnValue({
      replace: jest.fn(),
      push: jest.fn(),
    });

    mockGetPublicInvite = jest.fn().mockResolvedValue(mockPublicInvite);
    mockCreateMember = jest.fn();
    mockUseSudokuServerStorage.mockReturnValue({
      getPublicInvite: mockGetPublicInvite,
      createMember: mockCreateMember,
    });

    const mockParty: Party = {
      partyId: '456',
      appId: 'app-1',
      partyName: 'Test Racing Team',
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      isOwner: true,
      members: [
        {
          userId: 'user-123',
          resourceId: 'party-456',
          memberNickname: 'John',
          createdAt: new Date(),
          updatedAt: new Date(),
          isOwner: true,
          isUser: true,
        },
      ],
    };

    mockRefreshParties = jest.fn().mockResolvedValue([mockParty]);
    mockUsePartiesValue = {
      parties: [mockParty],
      isLoading: false,
      refreshParties: mockRefreshParties,
    } as unknown as ReturnType<typeof usePartiesHook.useParties>;
    mockUseParties.mockReturnValue(mockUsePartiesValue);

    mockUserContext = {
      isLoggingIn: false,
      user: mockUser,
      loginRedirect: jest.fn(),
      isInitialised: true,
      handleRestoreState: jest.fn(),
      logout: jest.fn(),
      handleAuthUrl: jest.fn(),
    };

    mockRevenueCatContext = {
      isSubscribed: false,
      subscribeModal: {
        showModalIfRequired: jest.fn(),
      },
      refreshEntitlements: jest.fn().mockResolvedValue(undefined),
    } as unknown as RevenueCatContextInterface;
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <FetchProvider>
        <UserContext.Provider value={mockUserContext}>
          <RevenueCatContext.Provider value={mockRevenueCatContext}>
            <Suspense fallback={<div>Loading...</div>}>{ui}</Suspense>
          </RevenueCatContext.Provider>
        </UserContext.Provider>
      </FetchProvider>
    );
  };

  describe('Invite Page Rendering', () => {
    it('should render the Invite page component', () => {
      renderWithProviders(<Invite />);
      expect(screen.getByText(/Loading invitation/i)).toBeInTheDocument();
    });

    it('should display the invite content after loading', async () => {
      mockUseParties.mockReturnValue({ ...mockUsePartiesValue, parties: [] });
      renderWithProviders(<Invite />);
      await waitFor(() => {
        expect(screen.getByText(/You're Invited!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Join Party Flow', () => {
    beforeEach(() => {
      mockUseParties.mockReturnValue({ ...mockUsePartiesValue, parties: [] });
    });

    it('should call createMember when join button is clicked', async () => {
      renderWithProviders(<Invite />);
      const joinButton = await screen.findByText(/Join the Fun/i);
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(mockCreateMember).toHaveBeenCalledWith({
          memberNickname: 'John',
          inviteId: 'invite-123',
        });
      });
    });

    it('should redirect to puzzle after successful join', async () => {
      const mockRouterReplace = jest.fn();
      mockUseRouter.mockReturnValue({
        replace: mockRouterReplace,
        push: jest.fn(),
      });

      const newParty: Party = {
        partyId: '456',
        appId: 'app-1',
        partyName: 'Test Racing Team',
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        isOwner: true,
        members: [
          {
            userId: 'user-123',
            resourceId: 'party-456',
            memberNickname: 'John',
            createdAt: new Date(),
            updatedAt: new Date(),
            isOwner: true,
            isUser: true,
          },
        ],
      };
      mockCreateMember.mockResolvedValue(newParty);
      mockRefreshParties.mockResolvedValue([newParty]);

      renderWithProviders(<Invite />);

      const joinButton = await screen.findByText(/Join the Fun/i);
      await userEvent.click(joinButton);

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith(
          '/puzzle?initial=1&final=9&showRacingPrompt=false'
        );
      });
    });
  });

  describe('Already Member Flow', () => {
    it('should redirect immediately if user is already a member', async () => {
      const mockRouterReplace = jest.fn();
      mockUseRouter.mockReturnValue({
        replace: mockRouterReplace,
        push: jest.fn(),
      });

      renderWithProviders(<Invite />);

      await waitFor(
        () => {
          expect(mockRouterReplace).toHaveBeenCalledWith(
            '/puzzle?initial=1&final=9&showRacingPrompt=false'
          );
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Sign In Flow', () => {
    it('should call loginRedirect when sign-in button is clicked', async () => {
      mockUserContext.user = undefined;
      mockUseParties.mockReturnValue({ ...mockUsePartiesValue, parties: [] });
      renderWithProviders(<Invite />);

      // Wait for the public invite to load first
      await waitFor(() => {
        expect(
          screen.queryByText(/Loading invitation/i)
        ).not.toBeInTheDocument();
      });

      const signInButton = await screen.findByText(
        /Sign in to Continue/i,
        {},
        { timeout: 3000 }
      );
      await userEvent.click(signInButton);

      expect(mockUserContext.loginRedirect).toHaveBeenCalledWith({
        userInitiated: true,
      });
    });
  });
});
