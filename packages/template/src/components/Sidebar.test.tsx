import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';
import {
  UserContext,
  UserContextInterface,
} from '@bubblyclouds-app/auth/providers/AuthProvider';
import {
  RevenueCatContextInterface,
  RevenueCatContext,
} from '../providers/RevenueCatProvider';
import { useParties } from '../hooks/useParties';

jest.mock('../hooks/useParties');
jest.mock('../hooks/serverStorage', () => ({
  useServerStorage: () => ({ createInvite: jest.fn() }),
}));
jest.mock('./PartyRow', () => ({
  __esModule: true,
  PartyRow: () => <div data-testid="party-row">Party Row</div>,
}));

const mockUseParties = useParties as jest.MockedFunction<typeof useParties>;

const MockSimpleState = ({ state: _state }: { state: unknown }) => (
  <div data-testid="simple-state">Simple State</div>
);

const mockCalculateCompletion = () => 50;

describe('Sidebar', () => {
  const defaultProps = {
    showSidebar: true,
    setShowSidebar: jest.fn(),
    puzzleId: 'puzzle123',
    redirectUri: '/puzzle/123',
    refreshSessionParties: jest.fn(),
    sessionParties: {},
    app: 'testapp',
    appName: 'TestApp',
    apiUrl: 'https://api.test.com',
    appUrl: 'https://app.test.com',
    SimpleState: MockSimpleState,
    calculateCompletionPercentageFromState: mockCalculateCompletion,
  };

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof Sidebar>> = {},
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
      app: 'testapp',
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
          <Sidebar {...defaultProps} {...props} />
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
      updateParty: jest.fn(),
      getNicknameByUserId: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
    });
  });

  it('renders the sidebar with race lobby label and start button', () => {
    renderComponent();
    expect(screen.getAllByText('Race Lobby').length).toBeGreaterThan(0);
    expect(screen.getByText('Start Solving')).toBeInTheDocument();
  });

  it('calls onStartRace and setShowSidebar when X button is clicked', () => {
    const onStartRace = jest.fn();
    const setShowSidebar = jest.fn();
    renderComponent({ onStartRace, setShowSidebar });
    fireEvent.click(screen.getByLabelText('Close lobby'));
    expect(onStartRace).toHaveBeenCalledTimes(1);
    expect(setShowSidebar).toHaveBeenCalledWith(false);
  });

  it('calls onStartRace and setShowSidebar when backdrop is clicked', () => {
    const onStartRace = jest.fn();
    const setShowSidebar = jest.fn();
    const { container } = renderComponent({ onStartRace, setShowSidebar });
    const backdrop = container.querySelector('.fixed.inset-0.z-50');
    fireEvent.click(backdrop!);
    expect(onStartRace).toHaveBeenCalledTimes(1);
    expect(setShowSidebar).toHaveBeenCalledWith(false);
  });

  it('shows the invite sheet when Invite button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Invite'));
    expect(screen.getByText('Invite opponents')).toBeInTheDocument();
  });

  it('displays online opponents from session parties', () => {
    mockUseParties.mockReturnValue({
      parties: [
        {
          partyId: '1',
          appId: 'app-1',
          partyName: 'Party 1',
          isOwner: true,
          members: [
            {
              userId: 'other1',
              memberNickname: 'Alice',
              isUser: false,
              isOwner: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user1',
        },
      ],
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
      updateParty: jest.fn(),
      getNicknameByUserId: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
    });
    renderComponent({
      sessionParties: {
        '1': {
          memberSessions: {
            other1: {
              sessionId: 's1',
              state: {
                answerStack: [],
                initial: [],
                final: [],
                completed: undefined,
              },
              updatedAt: new Date(),
            } as any,
          },
        },
      },
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('In lobby')).toBeInTheDocument();
  });

  it('prompts for login if inviting while logged out', () => {
    const loginRedirect = jest.fn();
    renderComponent({}, { user: { user: undefined, loginRedirect } });
    fireEvent.click(screen.getByText('Invite'));
    expect(loginRedirect).toHaveBeenCalled();
  });

  it('shows subscription modal if inviting a second party without subscription', () => {
    const showModalIfRequired = jest.fn();
    mockUseParties.mockReturnValueOnce({
      parties: [
        {
          partyId: '1',
          appId: 'app-1',
          partyName: 'Party 1',
          isOwner: true,
          members: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'user1',
        },
      ],
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
      updateParty: jest.fn(),
      getNicknameByUserId: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
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
    fireEvent.click(screen.getByText('Invite'));
    expect(showModalIfRequired).toHaveBeenCalled();
  });
});
