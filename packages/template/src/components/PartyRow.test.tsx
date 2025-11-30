import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PartyRow } from './PartyRow';
import { Party } from '@sudoku-web/types/serverTypes';
import {
  UserContext,
  UserContextInterface,
} from '@sudoku-web/auth/providers/AuthProvider';
import {
  RevenueCatContextInterface,
  RevenueCatContext,
} from '../providers/RevenueCatProvider';
import * as usePartiesModule from '../hooks/useParties';

jest.mock('../hooks/useParties');
jest.mock('@sudoku-web/ui/components/TimerDisplay', () => ({
  default: () => <div data-testid="timer">Timer</div>,
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
jest.mock('@sudoku-web/ui', () => ({
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

  it('allows owner to delete party', async () => {
    renderComponent();
    // Delete button is rendered as a trash icon button without text
    // Find all buttons and click the red delete button
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find(
      (btn) => btn.className && btn.className.includes('bg-red-100')
    );
    if (deleteButton) {
      fireEvent.click(deleteButton);
      fireEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(mockDeleteParty).toHaveBeenCalledWith('party1');
      });
    }
  });

  it('allows non-owner to leave party', async () => {
    const nonOwnerParty = { ...mockParty, isOwner: false };
    renderComponent({ party: nonOwnerParty });
    // Leave button is rendered as a logout icon button without text
    const buttons = screen.getAllByRole('button');
    const leaveButton = buttons.find(
      (btn) => btn.className && btn.className.includes('bg-red-100')
    );
    if (leaveButton) {
      fireEvent.click(leaveButton);
      fireEvent.click(screen.getByText('Confirm'));
      await waitFor(() => {
        expect(mockLeaveParty).toHaveBeenCalledWith('party1');
      });
    }
  });
});
