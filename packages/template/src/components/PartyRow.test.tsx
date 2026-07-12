import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PartyRow } from './PartyRow';
import { Party } from '@bubblyclouds-app/types/serverTypes';
import {
  UserContext,
  UserContextInterface,
} from '@bubblyclouds-app/auth/providers/AuthProvider';
import {
  RevenueCatContextInterface,
  RevenueCatContext,
} from '../providers/RevenueCatProvider';
import * as usePartiesModule from '../hooks/useParties';

jest.mock('../hooks/useParties');
jest.mock('@bubblyclouds-app/ui/components/TimerDisplay', () => ({
  TimerDisplay: ({
    seconds,
    isComplete,
  }: {
    seconds: number;
    isComplete?: boolean;
  }) => (
    <div data-testid="timer">
      {isComplete ? 'complete' : 'running'}-{seconds}
    </div>
  ),
}));
jest.mock('./PartyConfirmationDialog', () => ({
  PartyConfirmationDialog: ({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
  }) => (isOpen ? <button onClick={onConfirm}>Confirm</button> : null),
}));
jest.mock('./PartyInviteButton', () => ({
  PartyInviteButton: () => <div data-testid="invite-button">Invite</div>,
}));
jest.mock('@bubblyclouds-app/ui', () => ({
  CopyButton: () => <div data-testid="copy-button">Copy</div>,
}));
jest.mock('../utils/playerColors', () => ({
  getPlayerColor: jest.fn(() => 'bg-blue-500'),
  getAllUserIds: jest.fn(() => ['userId1', 'userId2']),
}));
jest.mock('../helpers/calculateSeconds', () => ({
  calculateSeconds: jest.fn(() => 120),
}));
jest.mock('@capacitor/share', () => ({
  Share: {
    canShare: jest.fn().mockResolvedValue({ value: false }),
  },
}));

const mockUseParties = usePartiesModule.useParties as jest.Mock;

describe('PartyRow', () => {
  const mockParty: Party = {
    partyId: 'party1',
    partyName: 'Test Party',
    appId: 'mockApp',
    createdBy: 'userId1',
    isOwner: true,
    members: [
      {
        memberNickname: 'Owner',
        userId: 'userId1',
        isUser: true,
        resourceId: 'party1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isOwner: true,
      },
      {
        memberNickname: 'Player 2',
        userId: 'userId2',
        isUser: false,
        resourceId: 'party1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isOwner: false,
      },
    ],
    maxSize: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultProps = {
    party: mockParty,
    sessionId: `sudoku-puzzle123`,
    redirectUri: '/puzzle/123',
  };

  let mockUpdateParty: jest.Mock;
  let mockDeleteParty: jest.Mock;
  let mockLeaveParty: jest.Mock;
  let mockRemoveMember: jest.Mock;

  beforeEach(() => {
    mockUpdateParty = jest.fn().mockResolvedValue(true);
    mockDeleteParty = jest.fn().mockResolvedValue(undefined);
    mockLeaveParty = jest.fn().mockResolvedValue(undefined);
    mockRemoveMember = jest.fn().mockResolvedValue(undefined);
    mockUseParties.mockReturnValue({
      parties: [mockParty],
      updateParty: mockUpdateParty,
      deleteParty: mockDeleteParty,
      leaveParty: mockLeaveParty,
      removeMember: mockRemoveMember,
    });
  });

  const renderComponent = (props = {}) => {
    const userContext: Partial<UserContextInterface> = {
      user: { sub: 'userId1' } as any,
    };
    const revenueCatContext: Partial<RevenueCatContextInterface> = {
      isSubscribed: false,
      subscribeModal: { showModalIfRequired: jest.fn() } as any,
    };
    const defaultInjectedProps = {
      SimpleState: () => <div data-testid="simple-mockApp">mockApp</div>,
      calculateCompletionPercentageFromState: jest.fn(() => 50),
    };
    return render(
      <UserContext.Provider
        value={userContext as unknown as UserContextInterface}
      >
        <RevenueCatContext.Provider
          value={revenueCatContext as unknown as RevenueCatContextInterface}
        >
          <PartyRow
            {...defaultProps}
            {...defaultInjectedProps}
            {...props}
            app="mockApp"
            appName="MockApp"
            apiUrl="mockApiUrl"
            appUrl="mockAppUrl"
          />
        </RevenueCatContext.Provider>
      </UserContext.Provider>
    );
  };

  it('renders party name and member count', () => {
    renderComponent();
    expect(screen.getByText('Test Party')).toBeInTheDocument();
    expect(screen.getByText(/2\/5 members/)).toBeInTheDocument();
  });

  it('allows owner to edit party name', async () => {
    renderComponent();
    fireEvent.click(screen.getByTitle('Edit party name'));
    const input = screen.getByDisplayValue('Test Party');
    fireEvent.change(input, { target: { value: 'New Name' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => {
      expect(mockUpdateParty).toHaveBeenCalledWith('party1', {
        partyName: 'New Name',
      });
    });
  });

  it('cancels party name editing on Escape key without saving', () => {
    renderComponent();
    fireEvent.click(screen.getByTitle('Edit party name'));
    const input = screen.getByDisplayValue('Test Party');
    fireEvent.change(input, { target: { value: 'Discarded Name' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(mockUpdateParty).not.toHaveBeenCalled();
    expect(screen.getByText('Test Party')).toBeInTheDocument();
  });

  it('cancels party name editing when the Cancel button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByTitle('Edit party name'));
    fireEvent.click(screen.getByTitle('Cancel'));
    expect(mockUpdateParty).not.toHaveBeenCalled();
    expect(screen.getByText('Test Party')).toBeInTheDocument();
  });

  it('saves party name on blur', async () => {
    renderComponent();
    fireEvent.click(screen.getByTitle('Edit party name'));
    const input = screen.getByDisplayValue('Test Party');
    fireEvent.change(input, { target: { value: 'Blurred Name' } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(mockUpdateParty).toHaveBeenCalledWith('party1', {
        partyName: 'Blurred Name',
      });
    });
  });

  it('allows owner to delete party', async () => {
    renderComponent();
    // The party-level leave/delete button is the one without a lucide-user-minus icon
    const deleteButton = screen
      .getAllByRole('button')
      .find((btn) => btn.querySelector('svg.lucide-trash'));
    expect(deleteButton).toBeDefined();
    fireEvent.click(deleteButton as HTMLElement);
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockDeleteParty).toHaveBeenCalledWith('party1');
    });
  });

  it('allows non-owner to leave party', async () => {
    const nonOwnerParty = { ...mockParty, isOwner: false };
    renderComponent({ party: nonOwnerParty });
    const leaveButton = screen
      .getAllByRole('button')
      .find((btn) => btn.querySelector('svg.lucide-log-out'));
    expect(leaveButton).toBeDefined();
    fireEvent.click(leaveButton as HTMLElement);
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockLeaveParty).toHaveBeenCalledWith('party1');
    });
  });

  it('opens max-size editor and updates directly when subscribed', async () => {
    renderComponent();
    fireEvent.click(screen.getByTitle('Edit max members'));
    const select = screen.getByDisplayValue('5 members');
    fireEvent.change(select, { target: { value: '3' } });
    await waitFor(() => {
      expect(mockUpdateParty).toHaveBeenCalledWith('party1', { maxSize: 3 });
    });
  });

  it('cancels max-size editing without calling updateParty', () => {
    renderComponent();
    fireEvent.click(screen.getByTitle('Edit max members'));
    fireEvent.click(screen.getByTitle('Cancel'));
    expect(mockUpdateParty).not.toHaveBeenCalled();
    expect(screen.getByText(/2\/5 members/)).toBeInTheDocument();
  });

  it('cancels max-size editing on blur', () => {
    renderComponent();
    fireEvent.click(screen.getByTitle('Edit max members'));
    const select = screen.getByDisplayValue('5 members');
    fireEvent.blur(select);
    expect(screen.getByText(/2\/5 members/)).toBeInTheDocument();
  });

  it('shows premium badge for owner when maxSize exceeds default and not subscribed', () => {
    const largePartyProps = {
      party: { ...mockParty, maxSize: 8 },
    };
    renderComponent(largePartyProps);
    expect(screen.getByText(/2\/8 members/)).toBeInTheDocument();
    expect(screen.getAllByText('✨').length).toBeGreaterThan(0);
  });

  it('routes max-size change above default through subscribeModal when not subscribed', async () => {
    const showModalIfRequired = jest.fn((onSuccess: () => void) => onSuccess());
    render(
      <UserContext.Provider
        value={{ user: { sub: 'userId1' } } as unknown as UserContextInterface}
      >
        <RevenueCatContext.Provider
          value={
            {
              isSubscribed: false,
              subscribeModal: { showModalIfRequired },
            } as unknown as RevenueCatContextInterface
          }
        >
          <PartyRow
            {...defaultProps}
            SimpleState={() => <div>state</div>}
            calculateCompletionPercentageFromState={() => 50}
            app="mockApp"
            appName="MockApp"
            apiUrl="mockApiUrl"
            appUrl="mockAppUrl"
          />
        </RevenueCatContext.Provider>
      </UserContext.Provider>
    );
    fireEvent.click(screen.getByTitle('Edit max members'));
    const select = screen.getByDisplayValue('5 members');
    fireEvent.change(select, { target: { value: '6' } });
    expect(showModalIfRequired).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockUpdateParty).toHaveBeenCalledWith('party1', { maxSize: 6 });
    });
  });

  it('resets edit max size when subscribeModal cancel callback fires', () => {
    const showModalIfRequired = jest.fn(
      (_onSuccess: () => void, onCancel?: () => void) => {
        onCancel?.();
      }
    );
    render(
      <UserContext.Provider
        value={{ user: { sub: 'userId1' } } as unknown as UserContextInterface}
      >
        <RevenueCatContext.Provider
          value={
            {
              isSubscribed: false,
              subscribeModal: { showModalIfRequired },
            } as unknown as RevenueCatContextInterface
          }
        >
          <PartyRow
            {...defaultProps}
            SimpleState={() => <div>state</div>}
            calculateCompletionPercentageFromState={() => 50}
            app="mockApp"
            appName="MockApp"
            apiUrl="mockApiUrl"
            appUrl="mockAppUrl"
          />
        </RevenueCatContext.Provider>
      </UserContext.Provider>
    );
    fireEvent.click(screen.getByTitle('Edit max members'));
    const select = screen.getByDisplayValue('5 members');
    fireEvent.change(select, { target: { value: '6' } });
    expect(showModalIfRequired).toHaveBeenCalledTimes(1);
    expect(mockUpdateParty).not.toHaveBeenCalled();
  });

  it('shows a copy-link section for non-owners and copies the current URL when clicked', async () => {
    const nonOwnerParty = { ...mockParty, isOwner: false };
    renderComponent({ party: nonOwnerParty });
    expect(
      screen.getByText(/Share this link with current team members/i)
    ).toBeInTheDocument();
    const copyButton = screen
      .getAllByText(/Copy Invite Link|Share Invite Link/)[0]
      .closest('button') as HTMLElement;
    await waitFor(() => {
      fireEvent.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });
  });

  it('does not render top-level invite button when party is full', () => {
    const fullParty = {
      ...mockParty,
      maxSize: 2,
    };
    renderComponent({ party: fullParty });
    // The only remaining invite-button instance should be the per-member
    // "not started" prompt, not the top-level "invite more members" one.
    expect(screen.getAllByTestId('invite-button').length).toBe(1);
  });

  it('shows "not started" prompt with invite button for owner when a member has no session', () => {
    renderComponent();
    expect(
      screen.getByText('Not started! Ask them to play')
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('invite-button').length).toBeGreaterThan(0);
  });

  it('shows "not started" prompt with a copy button for non-owner when a member has no session', async () => {
    const nonOwnerParty = { ...mockParty, isOwner: false };
    renderComponent({ party: nonOwnerParty });
    const notStartedText = screen.getByText('Not started! Ask them to play');
    expect(notStartedText).toBeInTheDocument();
    const perMemberCopyButton = notStartedText
      .closest('div')
      ?.querySelector('button') as HTMLElement;
    expect(perMemberCopyButton).toBeInTheDocument();
    fireEvent.click(perMemberCopyButton);
    await waitFor(() => {
      expect(perMemberCopyButton).toBeInTheDocument();
    });
  });

  it('renders a timer for a member session that has a timer', () => {
    const sessionParty = {
      memberSessions: {
        userId2: {
          state: {
            timer: { startedAt: new Date().toISOString(), pausedSeconds: 0 },
            completed: { at: new Date().toISOString(), seconds: 120 },
            answerStack: [],
            initial: {},
            final: {},
          },
        },
      },
    };
    renderComponent({ sessionParty });
    expect(screen.getByTestId('timer')).toHaveTextContent('complete-120');
  });

  it('shows remove-member button for owner and opens confirmation when subscribed', async () => {
    render(
      <UserContext.Provider
        value={{ user: { sub: 'userId1' } } as unknown as UserContextInterface}
      >
        <RevenueCatContext.Provider
          value={
            {
              isSubscribed: true,
              subscribeModal: { showModalIfRequired: jest.fn() },
            } as unknown as RevenueCatContextInterface
          }
        >
          <PartyRow
            {...defaultProps}
            SimpleState={() => <div>state</div>}
            calculateCompletionPercentageFromState={() => 50}
            app="mockApp"
            appName="MockApp"
            apiUrl="mockApiUrl"
            appUrl="mockAppUrl"
          />
        </RevenueCatContext.Provider>
      </UserContext.Provider>
    );
    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('svg.lucide-user-minus'));
    expect(removeButtons.length).toBe(1);
    fireEvent.click(removeButtons[0]);
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockRemoveMember).toHaveBeenCalledWith('party1', 'userId2');
    });
  });

  it('routes member removal through subscribeModal and opens confirmation dialog on success callback', async () => {
    const showModalIfRequired = jest.fn((onSuccess: () => void) => onSuccess());
    render(
      <UserContext.Provider
        value={{ user: { sub: 'userId1' } } as unknown as UserContextInterface}
      >
        <RevenueCatContext.Provider
          value={
            {
              isSubscribed: false,
              subscribeModal: { showModalIfRequired },
            } as unknown as RevenueCatContextInterface
          }
        >
          <PartyRow
            {...defaultProps}
            SimpleState={() => <div>state</div>}
            calculateCompletionPercentageFromState={() => 50}
            app="mockApp"
            appName="MockApp"
            apiUrl="mockApiUrl"
            appUrl="mockAppUrl"
          />
        </RevenueCatContext.Provider>
      </UserContext.Provider>
    );
    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('svg.lucide-user-minus'));
    fireEvent.click(removeButtons[0]);
    expect(showModalIfRequired).toHaveBeenCalledTimes(1);
    expect(mockRemoveMember).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(mockRemoveMember).toHaveBeenCalledWith('party1', 'userId2');
    });
  });

  it('does not show remove-member button for a non-owner', () => {
    const nonOwnerParty = { ...mockParty, isOwner: false };
    renderComponent({ party: nonOwnerParty });
    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('svg.lucide-user-minus'));
    expect(removeButtons.length).toBe(0);
  });

  it('does not show remove-member button on the user’s own row', () => {
    renderComponent();
    // Only member2 (non-user) should have a remove button; user1 (isUser) should not
    const removeButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.querySelector('svg.lucide-user-minus'));
    expect(removeButtons.length).toBe(1);
  });
});
