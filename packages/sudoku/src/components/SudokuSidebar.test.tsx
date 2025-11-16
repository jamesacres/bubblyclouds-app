import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SudokuSidebar from './SudokuSidebar';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import {
  RevenueCatContextInterface,
  RevenueCatContext,
} from '@sudoku-web/template/providers/RevenueCatProvider';
import { useParties } from '@sudoku-web/template/hooks/useParties';

jest.mock('@sudoku-web/template/hooks/useParties');
jest.mock('@sudoku-web/template/components/PartyRow', () => ({
  __esModule: true,
  PartyRow: () => <div data-testid="party-row">Party Row</div>,
}));

const mockUseParties = useParties as jest.MockedFunction<typeof useParties>;

describe('SudokuSidebar', () => {
  const defaultProps = {
    showSidebar: true,
    setShowSidebar: jest.fn(),
    puzzleId: 'puzzle123',
    redirectUri: '/puzzle/123',
    refreshSessionParties: jest.fn(),
    sessionParties: {},
  };

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof SudokuSidebar>> = {},
    context: {
      user?: Partial<UserContextInterface>;
      revenueCat?: Partial<RevenueCatContextInterface>;
    } = {}
  ) => {
    const userContext: UserContextInterface = {
      user: { sub: 'user1' } as any,
      isLoggingIn: false,
      isInitialised: true,
      loginRedirect: jest.fn(),
      logout: jest.fn(),
      handleAuthUrl: jest.fn(),
      handleRestoreState: jest.fn(),
      ...context.user,
    };
    const revenueCatContext: RevenueCatContextInterface = {
      isSubscribed: false,
      subscribeModal: { showModalIfRequired: jest.fn() } as any,
      refreshEntitlements: jest.fn(),
      ...context.revenueCat,
    } as unknown as RevenueCatContextInterface;

    return render(
      <UserContext.Provider value={userContext}>
        <RevenueCatContext.Provider
          value={revenueCatContext as unknown as RevenueCatContextInterface}
        >
          <SudokuSidebar {...defaultProps} {...props} />
        </RevenueCatContext.Provider>
      </UserContext.Provider>
    );
  };

  beforeEach(() => {
    mockUseParties.mockReturnValue({
      parties: [],
      isLoading: false,
      showCreateParty: false,
      setShowCreateParty: jest.fn(),
      isSaving: false,
      memberNickname: '',
      setMemberNickname: jest.fn(),
      partyName: '',
      setPartyName: jest.fn(),
      saveParty: jest.fn(),
      refreshParties: jest.fn(),
    });
  });

  it('renders the sidebar with title and description', () => {
    renderComponent();
    expect(screen.getByText('Races')).toBeInTheDocument();
    expect(screen.getByText(/Challenge your friends/)).toBeInTheDocument();
  });

  it('shows the create party form when button is clicked', () => {
    const setShowCreateParty = jest.fn();
    mockUseParties.mockReturnValueOnce({ parties: [], setShowCreateParty });
    renderComponent();
    fireEvent.click(screen.getByText('Create Racing Team'));
    expect(setShowCreateParty).toHaveBeenCalledWith(true);
  });

  it('displays existing parties', () => {
    mockUseParties.mockReturnValue({
      parties: [
        {
          partyId: '1',
          partyName: 'Party 1',
          isOwner: true,
          maxMembers: 5,
          members: [],
          createdAt: new Date(),
        },
        {
          partyId: '2',
          partyName: 'Party 2',
          isOwner: false,
          maxMembers: 5,
          members: [],
          createdAt: new Date(),
        },
      ],
    });
    renderComponent();
    expect(screen.getAllByTestId('party-row')).toHaveLength(2);
  });

  it('prompts for login if creating a party while logged out', () => {
    const loginRedirect = jest.fn();
    renderComponent({}, { user: { user: undefined, loginRedirect } });
    fireEvent.click(screen.getByText('Create Racing Team'));
    expect(loginRedirect).toHaveBeenCalled();
  });

  it('shows subscription modal if creating a second party without subscription', () => {
    const showModalIfRequired = jest.fn();
    mockUseParties.mockReturnValueOnce({
      parties: [{ partyId: '1' }],
      setShowCreateParty: jest.fn(),
    });
    renderComponent(
      {},
      {
        revenueCat: {
          isSubscribed: false,
          subscribeModal: { showModalIfRequired } as any,
        },
      }
    );
    fireEvent.click(screen.getByText('Create Racing Team'));
    expect(showModalIfRequired).toHaveBeenCalled();
  });
});
