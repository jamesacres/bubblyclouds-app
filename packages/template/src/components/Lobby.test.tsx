import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import Lobby from './Lobby';
import {
  UserContext,
  UserContextInterface,
} from '@bubblyclouds-app/auth/providers/AuthProvider';
import {
  RevenueCatContextInterface,
  RevenueCatContext,
} from '../providers/RevenueCatProvider';
import { useParties } from '../hooks/useParties';
import { Session } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '../types/state';
import { LoginContext } from '@bubblyclouds-app/types/loginContext';

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

describe('Lobby', () => {
  const defaultProps = {
    showLobby: true,
    setShowLobby: jest.fn(),
    puzzleId: 'puzzle123',
    redirectUri: '/puzzle/123',
    refreshSessionParties: jest.fn(),
    sessionParties: {},
    app: 'testapp',
    appName: 'Test App',
    apiUrl: 'https://api.test.com',
    appUrl: 'https://app.test.com',
    SimpleState: MockSimpleState,
    calculateCompletionPercentageFromState: mockCalculateCompletion,
  };

  const renderComponent = (
    props: Partial<React.ComponentProps<typeof Lobby>> = {},
    context: {
      user?: Partial<UserContextInterface>;
      revenueCat?: Partial<RevenueCatContextInterface>;
    } = {}
  ) => {
    const userContext: UserContextInterface = {
      user: { sub: 'user1' },
      isLoggingIn: false,
      isInitialised: true,
      loginRedirect: jest.fn(),
      showLoginModal: jest.fn(),
      logout: jest.fn(),
      handleAuthUrl: jest.fn(),
      handleRestoreState: jest.fn(),
      app: 'testapp',
      gameName: 'Test App',
      ...context.user,
    };
    const revenueCatContext: RevenueCatContextInterface = {
      isSubscribed: false,
      isLoading: false,
      packages: [],
      purchasePackage: jest.fn(),
      restorePurchases: jest.fn(),
      refreshEntitlements: jest.fn(),
      subscribeModal: {
        isOpen: false,
        callback: jest.fn(),
        cancelCallback: jest.fn(),
        showModalIfRequired: jest.fn(),
        hideModal: jest.fn(),
      },
      ...context.revenueCat,
    };

    return render(
      <UserContext.Provider value={userContext}>
        <RevenueCatContext.Provider value={revenueCatContext}>
          <Lobby {...defaultProps} {...props} />
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

  it('renders the lobby with race lobby label and start button', () => {
    renderComponent();
    expect(screen.getAllByText('Race Lobby').length).toBeGreaterThan(0);
    expect(screen.getByText('Start Solving')).toBeInTheDocument();
  });

  it('calls onStartRace and setShowLobby when X button is clicked', () => {
    const onStartRace = jest.fn();
    const setShowLobby = jest.fn();
    renderComponent({ onStartRace, setShowLobby });
    fireEvent.click(screen.getByLabelText('Close lobby'));
    expect(onStartRace).toHaveBeenCalledTimes(1);
    expect(setShowLobby).toHaveBeenCalledWith(false);
  });

  it('calls onStartRace and setShowLobby when backdrop is clicked', () => {
    const onStartRace = jest.fn();
    const setShowLobby = jest.fn();
    const { container } = renderComponent({ onStartRace, setShowLobby });
    const backdrop = container.querySelector('.fixed.inset-0.z-50');
    fireEvent.click(backdrop!);
    expect(onStartRace).toHaveBeenCalledTimes(1);
    expect(setShowLobby).toHaveBeenCalledWith(false);
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
              resourceId: 'res-other1',
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
              },
              updatedAt: new Date(),
            } satisfies Session<BaseServerState>,
          },
        },
      },
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('In lobby')).toBeInTheDocument();
  });

  it('prompts for login if inviting while logged out', () => {
    const showLoginModal = jest.fn();
    renderComponent({}, { user: { user: undefined, showLoginModal } });
    fireEvent.click(screen.getByText('Invite'));
    expect(showLoginModal).toHaveBeenCalledWith(
      undefined,
      LoginContext.RACE_LOBBY
    );
  });

  it('opens the invite sheet directly (no subscription gate) even with an existing party', () => {
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
          subscribeModal: {
            isOpen: false,
            callback: jest.fn(),
            cancelCallback: jest.fn(),
            showModalIfRequired,
            hideModal: jest.fn(),
          },
        },
      }
    );
    fireEvent.click(screen.getByText('Invite'));
    expect(showModalIfRequired).not.toHaveBeenCalled();
    expect(screen.getByText('Invite opponents')).toBeInTheDocument();
  });

  it('shows solo race summary when there are no rivals', () => {
    renderComponent();
    expect(
      screen.getByText('Solo race — just you and the clock')
    ).toBeInTheDocument();
  });

  it('shows race summary combining human and AI rivals', () => {
    renderComponent({
      localAgentProgress: [
        { agentId: 'a1', name: 'Bolt', emoji: '⚡', percentage: 10 },
      ],
      sessionParties: {
        '1': {
          memberSessions: {
            other1: {
              sessionId: 's1',
              state: { answerStack: [], initial: [], final: [] },
              updatedAt: new Date(),
            } satisfies Session<BaseServerState>,
          },
        },
      },
    });
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
              resourceId: 'res-other1',
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
      localAgentProgress: [
        { agentId: 'a1', name: 'Bolt', emoji: '⚡', percentage: 10 },
      ],
      sessionParties: {
        '1': {
          memberSessions: {
            other1: {
              sessionId: 's1',
              state: { answerStack: [], initial: [], final: [] },
              updatedAt: new Date(),
            } satisfies Session<BaseServerState>,
          },
        },
      },
    });
    expect(
      screen.getByText('Racing 1 friend and 1 AI opponent')
    ).toBeInTheDocument();
  });

  it('shows "no AI opponents" placeholder button and opens agent sheet when clicked and onAgentMode is set', () => {
    renderComponent({ onAgentMode: jest.fn() });
    expect(
      screen.getByText(
        'No AI opponents yet — add one to always have someone to race.'
      )
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByText(
        'No AI opponents yet — add one to always have someone to race.'
      )
    );
    expect(screen.getByText('Add')).toBeInTheDocument();
  });

  it('renders AI opponent progress with percentage while racing', () => {
    renderComponent({
      localAgentProgress: [
        { agentId: 'a1', name: 'Bolt', emoji: '⚡', percentage: 42 },
      ],
    });
    expect(screen.getByText('Bolt')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('renders finish time instead of percentage once an AI opponent finishes', () => {
    renderComponent({
      localAgentProgress: [
        {
          agentId: 'a1',
          name: 'Bolt',
          emoji: '⚡',
          percentage: 100,
          finishTime: 125,
        },
      ],
    });
    expect(screen.getByText(/Solved in/)).toBeInTheDocument();
  });

  it('does not render a remove button for a finished AI opponent even when onRemoveAgent is provided', () => {
    const onRemoveAgent = jest.fn();
    renderComponent({
      localAgentProgress: [
        {
          agentId: 'a1',
          name: 'Bolt',
          emoji: '⚡',
          percentage: 100,
          finishTime: 125,
        },
      ],
      onRemoveAgent,
    });
    expect(screen.queryByLabelText('Remove Bolt')).not.toBeInTheDocument();
  });

  it('calls onRemoveAgent when the remove button is clicked for an unfinished AI opponent', () => {
    const onRemoveAgent = jest.fn();
    renderComponent({
      localAgentProgress: [
        { agentId: 'a1', name: 'Bolt', emoji: '⚡', percentage: 42 },
      ],
      onRemoveAgent,
    });
    fireEvent.click(screen.getByLabelText('Remove Bolt'));
    expect(onRemoveAgent).toHaveBeenCalledWith('a1');
  });

  it('renders CompactSimpleState for a racing AI opponent with state', () => {
    const CompactSimpleState = () => (
      <div data-testid="compact-state">Compact</div>
    );
    renderComponent({
      localAgentProgress: [
        {
          agentId: 'a1',
          name: 'Bolt',
          emoji: '⚡',
          percentage: 42,
          state: { answerStack: [], initial: {}, final: {} },
        },
      ],
      CompactSimpleState,
    });
    expect(screen.getByTestId('compact-state')).toBeInTheDocument();
  });

  it('disables the refresh button and shows a spinner while parties are loading', () => {
    mockUseParties.mockReturnValue({
      parties: [],
      isLoading: true,
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
    renderComponent();
    const refreshButton = screen.getByLabelText('Refresh online opponents');
    expect(refreshButton).toBeDisabled();
  });

  it('calls refreshParties when the refresh button is clicked', () => {
    const refreshParties = jest.fn();
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
      refreshParties,
      updateParty: jest.fn(),
      getNicknameByUserId: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
    });
    renderComponent();
    // The Lobby also calls refreshParties once immediately on open (see the
    // "fires refreshParties once immediately when the Lobby opens" test) —
    // the click here adds one more on top of that.
    const callsAfterOpen = refreshParties.mock.calls.length;
    fireEvent.click(screen.getByLabelText('Refresh online opponents'));
    expect(refreshParties).toHaveBeenCalledTimes(callsAfterOpen + 1);
  });

  it('fires refreshParties once immediately when the Lobby opens, not just on the first 30s interval tick', () => {
    // Regression: without an immediate call, a friend who's already ahead
    // on stages we haven't reached yet would show as stuck on whatever
    // stage we last knew about them on until either 30s passed or the
    // manual refresh button was pressed.
    const refreshParties = jest.fn();
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
      refreshParties,
      updateParty: jest.fn(),
      getNicknameByUserId: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
    });
    renderComponent();
    expect(refreshParties).toHaveBeenCalledTimes(1);
  });

  it('does not loop-call refreshParties as its own isLoading transitions settle', async () => {
    // refreshParties itself flips isLoading true then false around its own
    // work — the immediate-on-open effect depends on isLoading (to wait for
    // useParties' own initial load to finish before firing), so a bug where
    // it re-fires on every isLoading transition would call refreshParties
    // again every time this component re-renders with isLoading swinging
    // back to false, looping forever.
    const refreshParties = jest.fn();
    let isLoading = false;
    mockUseParties.mockImplementation(() => ({
      parties: [],
      isLoading,
      showCreateParty: false,
      setShowCreateParty: jest.fn(),
      isSaving: false,
      memberNickname: '',
      setMemberNickname: jest.fn(),
      partyName: '',
      setPartyName: jest.fn(),
      saveParty: jest.fn(),
      refreshParties,
      updateParty: jest.fn(),
      getNicknameByUserId: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
    }));
    const { rerender } = renderComponent();
    expect(refreshParties).toHaveBeenCalledTimes(1);

    const wrappedTree = (
      <UserContext.Provider value={{ user: { sub: 'user1' } } as any}>
        <RevenueCatContext.Provider value={{ isSubscribed: false } as any}>
          <Lobby {...defaultProps} />
        </RevenueCatContext.Provider>
      </UserContext.Provider>
    );
    isLoading = true;
    rerender(wrappedTree);
    isLoading = false;
    rerender(wrappedTree);
    isLoading = true;
    rerender(wrappedTree);
    isLoading = false;
    rerender(wrappedTree);

    expect(refreshParties).toHaveBeenCalledTimes(1);
  });

  it('fires refreshParties once auth resolves on a hard reload, even though isLoading never toggled before that', () => {
    // Regression: on a hard page reload, auth (UserContext's `user`) isn't
    // resolved yet on first render, so useParties' own lazyLoadParties
    // no-ops (it requires `user`) and isLoading stays false throughout —
    // the immediate-on-open effect's old `!isLoading` check alone was
    // satisfied on THAT first render, so it fired refreshParties, which
    // itself also no-ops without `user` (PartiesProvider.refreshParties
    // warns and returns early) — and the once-per-open ref got marked as
    // "already fired" regardless, permanently suppressing the real
    // fetch once `user` resolved moments later. Navigating from elsewhere
    // in the app (where `user` is already resolved) never hit this window.
    const refreshParties = jest.fn();
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
      refreshParties,
      updateParty: jest.fn(),
      getNicknameByUserId: jest.fn(),
      leaveParty: jest.fn(),
      removeMember: jest.fn(),
      deleteParty: jest.fn(),
    });
    const { rerender } = renderComponent({}, { user: { user: undefined } });
    expect(refreshParties).not.toHaveBeenCalled();

    rerender(
      <UserContext.Provider value={{ user: { sub: 'user1' } } as any}>
        <RevenueCatContext.Provider value={{ isSubscribed: false } as any}>
          <Lobby {...defaultProps} />
        </RevenueCatContext.Provider>
      </UserContext.Provider>
    );

    expect(refreshParties).toHaveBeenCalledTimes(1);
  });

  it('shows offline party members and lets the owner remove them via confirmation dialog', async () => {
    const removeMember = jest.fn().mockResolvedValue(undefined);
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
              resourceId: 'res-other1',
              memberNickname: 'Offline Bob',
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
      removeMember,
      deleteParty: jest.fn(),
    });
    renderComponent({ sessionParties: {} });
    expect(screen.getByText('Offline Bob')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Remove Offline Bob'));
    expect(screen.getByText(/Remove Member/i)).toBeInTheDocument();
    const confirmButtons = screen.getAllByRole('button', { name: /Remove/i });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    await screen.findByText('Offline Bob');
    expect(removeMember).toHaveBeenCalledWith('1', 'other1');
  });

  it('does not show a remove button for an offline member the user does not own a party with', () => {
    mockUseParties.mockReturnValue({
      parties: [
        {
          partyId: '1',
          appId: 'app-1',
          partyName: 'Party 1',
          isOwner: false,
          members: [
            {
              userId: 'other1',
              resourceId: 'res-other1',
              memberNickname: 'Offline Bob',
              isUser: false,
              isOwner: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'other1',
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
    renderComponent({ sessionParties: {} });
    expect(screen.getByText('Offline Bob')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Remove Offline Bob')
    ).not.toBeInTheDocument();
  });

  it('marks a player away once their session has been idle past the threshold', () => {
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
              resourceId: 'res-other1',
              memberNickname: 'Away Alice',
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
              state: { answerStack: [], initial: [], final: [] },
              updatedAt: new Date(Date.now() - 60 * 60 * 1000),
            } satisfies Session<BaseServerState>,
          },
        },
      },
    });
    expect(screen.getByText('Away Alice')).toBeInTheDocument();
    expect(screen.getByText('Away')).toBeInTheDocument();
  });

  it('shows the "Online opponents" count as 0 (not the away count) when every known opponent is away', () => {
    // Regression: the header count used to sum active + away + run-only
    // members, so with a single away opponent it read "Online opponents 1"
    // right next to "Away 1" and an empty Online list underneath — which
    // looked exactly like a bug (a stale "online" count that never actually
    // showed anyone online), even though the number was a differently-scoped
    // total. The header should only ever count what's rendered under it.
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
              resourceId: 'res-other1',
              memberNickname: 'Away Alice',
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
              state: { answerStack: [], initial: [], final: [] },
              updatedAt: new Date(Date.now() - 60 * 60 * 1000),
            } satisfies Session<BaseServerState>,
          },
        },
      },
    });
    const onlineHeading = screen.getByText('Online opponents');
    expect(
      within(onlineHeading.parentElement!).getByText('0')
    ).toBeInTheDocument();
    // Away's own count still correctly reads 1, and its section still shows.
    expect(screen.getByText('Away Alice')).toBeInTheDocument();
    const awayHeading = screen.getByText('Away');
    expect(
      within(awayHeading.parentElement!).getByText('1')
    ).toBeInTheDocument();
    // The "no opponents online" placeholder must stay suppressed — there IS
    // a known opponent, just an away one, not zero opponents overall.
    expect(
      screen.queryByText('No opponents online — invite friends to race!')
    ).not.toBeInTheDocument();
  });

  it('renders the puzzle header when puzzleDifficulty is provided', () => {
    renderComponent({ puzzleDifficulty: 'Hard' });
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });

  it('does not render the puzzle header when neither puzzleDifficulty nor initialState is provided', () => {
    renderComponent();
    expect(screen.queryByText('Hard')).not.toBeInTheDocument();
  });

  it('renders nothing (returns null lobby content) when showLobby is false but still mounts the aside hidden', () => {
    renderComponent({ showLobby: false });
    expect(screen.getByText('Start Solving')).toBeInTheDocument();
  });

  it('calls onStartRace and setShowLobby when Start Solving is clicked', () => {
    const onStartRace = jest.fn();
    const setShowLobby = jest.fn();
    renderComponent({ onStartRace, setShowLobby });
    fireEvent.click(screen.getByText('Start Solving'));
    expect(onStartRace).toHaveBeenCalledTimes(1);
    expect(setShowLobby).toHaveBeenCalledWith(false);
  });

  it('groups a player who is a member of multiple parties under a single online row with both party tags', () => {
    mockUseParties.mockReturnValue({
      parties: [
        {
          partyId: '1',
          appId: 'app-1',
          partyName: 'Party One',
          isOwner: true,
          members: [
            {
              userId: 'other1',
              resourceId: 'res-other1',
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
        {
          partyId: '2',
          appId: 'app-1',
          partyName: 'Party Two',
          isOwner: true,
          members: [
            {
              userId: 'other1',
              resourceId: 'res-other1',
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
              state: { answerStack: [], initial: [], final: [] },
              updatedAt: new Date(),
            } satisfies Session<BaseServerState>,
          },
        },
      },
    });
    expect(screen.getAllByText('Party One').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Party Two').length).toBeGreaterThan(0);
    // Only one online-opponent row should be rendered for Alice, even though
    // "Alice" also appears once more inside the (hidden) InviteSheet.
    expect(
      screen.getAllByText('Alice', { selector: '.text-sm.font-bold' })
    ).toHaveLength(1);
  });

  it('groups an offline player who is a member of multiple parties under a single row', () => {
    mockUseParties.mockReturnValue({
      parties: [
        {
          partyId: '1',
          appId: 'app-1',
          partyName: 'Party One',
          isOwner: true,
          members: [
            {
              userId: 'other1',
              resourceId: 'res-other1',
              memberNickname: 'Offline Bob',
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
        {
          partyId: '2',
          appId: 'app-1',
          partyName: 'Party Two',
          isOwner: true,
          members: [
            {
              userId: 'other1',
              resourceId: 'res-other1',
              memberNickname: 'Offline Bob',
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
    renderComponent({ sessionParties: {} });
    expect(screen.getAllByText('Offline Bob')).toHaveLength(1);
    expect(screen.getAllByText('Party One').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Party Two').length).toBeGreaterThan(0);
  });

  it('invokes the invite-url copy action for an offline member the user owns a party with', async () => {
    mockUseParties.mockReturnValue({
      parties: [
        {
          partyId: '1',
          appId: 'app-1',
          partyName: 'Party One',
          isOwner: true,
          members: [
            {
              userId: 'other1',
              resourceId: 'res-other1',
              memberNickname: 'Offline Bob',
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
    renderComponent({ sessionParties: {} });
    const offlineRow = screen.getByText('Offline Bob').closest('div');
    const copyButton = offlineRow?.parentElement?.querySelector('button');
    expect(copyButton).toBeTruthy();
    fireEvent.click(copyButton as HTMLElement);
    await waitFor(() => {
      expect(copyButton).toBeInTheDocument();
    });
  });

  it('falls back to an emoji avatar for an AI opponent when its image fails to load', () => {
    renderComponent({
      localAgentProgress: [
        { agentId: 'a1', name: 'Bolt', emoji: '⚡', percentage: 42 },
      ],
    });
    const img = screen.getByAltText('Bolt');
    fireEvent.error(img);
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.queryByAltText('Bolt')).not.toBeInTheDocument();
  });

  describe('multi-stage runs (runProgressByUserId/totalStages)', () => {
    const singlePartyWithMember = (memberNickname: string) => ({
      parties: [
        {
          partyId: '1',
          appId: 'app-1',
          partyName: 'Party 1',
          isOwner: true,
          members: [
            {
              userId: 'other1',
              resourceId: 'res-other1',
              memberNickname,
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

    it('shows "Stage N of M" for an online opponent instead of the current-stage percentage', () => {
      mockUseParties.mockReturnValue(singlePartyWithMember('Alice'));
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
                  timer: {
                    seconds: 20,
                    inProgress: {
                      start: new Date().toISOString(),
                      lastInteraction: new Date().toISOString(),
                    },
                  },
                },
                updatedAt: new Date(),
              } satisfies Session<BaseServerState>,
            },
          },
        },
        runProgressByUserId: {
          other1: { completedStageCount: 1, totalSeconds: 30 },
        },
        totalStages: 3,
      });
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText(/Stage 2 of 3/)).toBeInTheDocument();
    });

    it('surfaces an opponent who has moved past the current stage under Online opponents, not Offline', () => {
      mockUseParties.mockReturnValue(singlePartyWithMember('Bob'));
      renderComponent({
        // Bob has left this stage's party entirely — sessionParties only
        // ever covers the current stage.
        sessionParties: {},
        runProgressByUserId: {
          other1: { completedStageCount: 2, totalSeconds: 55 },
        },
        totalStages: 5,
      });
      expect(screen.getByText('Online opponents')).toBeInTheDocument();
      expect(
        screen.queryByText('Racing another stage')
      ).not.toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText(/Stage 3 of 5/)).toBeInTheDocument();
      expect(
        screen.queryByText('Offline · in your teams')
      ).not.toBeInTheDocument();
    });

    it('shows a friend as Online (not Away) when their CURRENT-stage session is stale but they are recently active on a different stage', () => {
      // Regression: a friend can leave our stage mid-puzzle without ever
      // marking it completed (so the "friend completed our stage" trigger
      // that fetches later-stage data never fires) while still actively
      // playing a later stage right now. Judging them solely by their
      // stale session on OUR stage misclassified them as "Away" forever.
      mockUseParties.mockReturnValue(singlePartyWithMember('Bob'));
      renderComponent({
        sessionParties: {
          '1': {
            memberSessions: {
              other1: {
                sessionId: 's1',
                state: { answerStack: [], initial: [], final: [] },
                // Stale on the stage we're watching...
                updatedAt: new Date(Date.now() - 60 * 60 * 1000),
              } satisfies Session<BaseServerState>,
            },
          },
        },
        runProgressByUserId: {
          other1: { completedStageCount: 2, totalSeconds: 55 },
        },
        totalStages: 5,
        // ...but recently active on a later stage.
        mostRecentUpdatedAtByUserId: new Map([
          ['other1', new Date(Date.now() - 2 * 60 * 1000)],
        ]),
      });
      const onlineHeading = screen.getByText('Online opponents');
      expect(
        within(onlineHeading.parentElement!).getByText('1')
      ).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.queryByText('Away')).not.toBeInTheDocument();
    });

    it('shows a friend racing a different stage as Away once their cross-stage activity itself goes stale', () => {
      mockUseParties.mockReturnValue(singlePartyWithMember('Bob'));
      renderComponent({
        // No session at all for the stage we're watching.
        sessionParties: {},
        runProgressByUserId: {
          other1: { completedStageCount: 2, totalSeconds: 55 },
        },
        totalStages: 5,
        mostRecentUpdatedAtByUserId: new Map([
          ['other1', new Date(Date.now() - 60 * 60 * 1000)],
        ]),
      });
      const awayHeading = screen.getByText('Away');
      expect(
        within(awayHeading.parentElement!).getByText('1')
      ).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText(/last seen/)).toBeInTheDocument();
    });

    it('shows "Stage N of M" for an AI opponent instead of its raw per-stage percentage', () => {
      renderComponent({
        localAgentProgress: [
          { agentId: 'agent-0', name: 'Bolt', emoji: '⚡', percentage: 40 },
        ],
        runProgressByUserId: {
          'agent-0': { completedStageCount: 1, totalSeconds: 30 },
        },
        totalStages: 3,
      });
      expect(screen.getByText('Bolt')).toBeInTheDocument();
      expect(screen.getByText(/Stage 2 of 3/)).toBeInTheDocument();
    });

    it('shows "Finished the run" for an AI opponent only once it has completed every stage, not just the current one', () => {
      renderComponent({
        localAgentProgress: [
          {
            agentId: 'agent-0',
            name: 'Bolt',
            emoji: '⚡',
            percentage: 100,
            finishTime: 12,
          },
        ],
        runProgressByUserId: {
          'agent-0': { completedStageCount: 1, totalSeconds: 12 },
        },
        totalStages: 3,
      });
      expect(screen.getByText(/Stage 2 of 3/)).toBeInTheDocument();
      expect(screen.queryByText(/Finished the run/)).not.toBeInTheDocument();
    });
  });
});
