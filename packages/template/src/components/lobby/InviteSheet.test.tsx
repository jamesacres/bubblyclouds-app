import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InviteSheet } from './InviteSheet';

const mockSaveParty = jest.fn().mockResolvedValue({ partyId: 'new-party' });
const mockUpdateParty = jest.fn().mockResolvedValue(undefined);
const mockLeaveParty = jest.fn().mockResolvedValue(undefined);
const mockDeleteParty = jest.fn().mockResolvedValue(undefined);

jest.mock('../../hooks/serverStorage', () => ({
  useServerStorage: () => ({
    createInvite: jest.fn().mockResolvedValue({ inviteId: 'inv1' }),
  }),
}));

jest.mock('../../helpers/inviteUrl', () => ({
  buildPartyInviteUrl: jest
    .fn()
    .mockResolvedValue('https://app.test.com/invite/123'),
}));

jest.mock('@bubblyclouds-app/ui/helpers/share', () => ({
  shareOrCopyUrl: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../helpers/capacitor', () => ({
  isIOS: jest.fn().mockReturnValue(false),
}));

jest.mock('@bubblyclouds-app/ui/components/CopyButton', () => ({
  CopyButton: ({ getText }: { getText: () => Promise<string> }) => (
    <button onClick={() => getText()}>Copy Link</button>
  ),
}));

jest.mock('../PartyConfirmationDialog', () => ({
  PartyConfirmationDialog: ({
    isOpen,
    onConfirm,
    onClose,
    partyName,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onClose: () => void;
    partyName: string;
  }) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <span>{partyName}</span>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  parties: [],
  onCreateTeam: jest.fn(),
  sessionId: 'session1',
  redirectUri: '/puzzle/1',
  app: 'testapp',
  appName: 'Test App',
  apiUrl: 'https://api.test.com',
  appUrl: 'https://app.test.com',
  saveParty: mockSaveParty,
  updateParty: mockUpdateParty,
  leaveParty: mockLeaveParty,
  deleteParty: mockDeleteParty,
};

describe('InviteSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the invite sheet title when open', () => {
    render(<InviteSheet {...defaultProps} />);
    expect(screen.getByText('Invite opponents')).toBeInTheDocument();
  });

  it('renders the create team section', () => {
    render(<InviteSheet {...defaultProps} />);
    expect(screen.getByText('Create new racing team')).toBeInTheDocument();
  });

  it('renders display name and team name inputs', () => {
    render(<InviteSheet {...defaultProps} />);
    expect(screen.getByPlaceholderText('Display name')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Team name (e.g. Family)')
    ).toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<InviteSheet {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn();
    const { container } = render(
      <InviteSheet {...defaultProps} onClose={onClose} />
    );
    // The outer wrapper div has the outer absolute overlay as first child
    const outerWrapper = container.firstChild as HTMLElement;
    const backdrop = outerWrapper.firstChild as HTMLElement;
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalled();
  });

  it('create button is disabled when teamName or display is empty', () => {
    render(<InviteSheet {...defaultProps} />);
    expect(screen.getByText(/Create & copy link/)).toBeDisabled();
  });

  it('create button is enabled when both fields are filled', () => {
    render(<InviteSheet {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText('Display name'), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByPlaceholderText('Team name (e.g. Family)'), {
      target: { value: 'Dream Team' },
    });
    expect(screen.getByText(/Create & copy link/)).not.toBeDisabled();
  });

  it('pre-fills display name from defaultDisplayName', () => {
    render(<InviteSheet {...defaultProps} defaultDisplayName="Bob" />);
    expect(screen.getByPlaceholderText('Display name')).toHaveValue('Bob');
  });

  it('renders existing parties section when parties exist', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        isOwner: true,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    expect(screen.getByText('Invite to existing team')).toBeInTheDocument();
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
  });

  it('does not render existing parties section when parties is empty', () => {
    render(<InviteSheet {...defaultProps} parties={[]} />);
    expect(
      screen.queryByText('Invite to existing team')
    ).not.toBeInTheDocument();
  });

  it('shows member count for a party', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }, { userId: 'u2' }],
        isOwner: false,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    expect(screen.getByText('2 /')).toBeInTheDocument();
  });

  it('shows edit button for owned parties', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        isOwner: true,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    expect(screen.getByLabelText('Edit team name')).toBeInTheDocument();
  });

  it('does not show edit button for non-owned parties', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        isOwner: false,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    expect(screen.queryByLabelText('Edit team name')).not.toBeInTheDocument();
  });

  it('shows delete button for owned parties', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        isOwner: true,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    expect(screen.getByLabelText('Delete team')).toBeInTheDocument();
  });

  it('shows leave button for non-owned parties', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        isOwner: false,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    expect(screen.getByLabelText('Leave team')).toBeInTheDocument();
  });

  it('opens confirmation dialog when delete/leave button is clicked', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        isOwner: true,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    fireEvent.click(screen.getByLabelText('Delete team'));
    expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
  });

  it('enters edit mode for team name when edit button is clicked', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        isOwner: true,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    fireEvent.click(screen.getByLabelText('Edit team name'));
    expect(screen.getByDisplayValue('Team Alpha')).toBeInTheDocument();
  });

  it('exits edit mode on Escape key', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        isOwner: true,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    fireEvent.click(screen.getByLabelText('Edit team name'));
    fireEvent.keyDown(screen.getByDisplayValue('Team Alpha'), {
      key: 'Escape',
    });
    expect(screen.queryByDisplayValue('Team Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Team Alpha')).toBeInTheDocument();
  });

  it('calls saveParty and onCreateTeam on create', async () => {
    const onCreateTeam = jest.fn();
    render(<InviteSheet {...defaultProps} onCreateTeam={onCreateTeam} />);
    fireEvent.change(screen.getByPlaceholderText('Display name'), {
      target: { value: 'Alice' },
    });
    fireEvent.change(screen.getByPlaceholderText('Team name (e.g. Family)'), {
      target: { value: 'Dream Team' },
    });
    fireEvent.click(screen.getByText(/Create & copy link/));
    await waitFor(() => {
      expect(mockSaveParty).toHaveBeenCalledWith({
        memberNickname: 'Alice',
        partyName: 'Dream Team',
      });
    });
    await waitFor(() => {
      expect(onCreateTeam).toHaveBeenCalled();
    });
  });

  it('renders max-size selector for owned parties', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        maxSize: 5,
        isOwner: true,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    expect(screen.getByDisplayValue('5 members')).toBeInTheDocument();
  });

  it('renders static max-size text for non-owned parties', () => {
    const parties = [
      {
        partyId: 'p1',
        partyName: 'Team Alpha',
        members: [{ userId: 'u1' }],
        maxSize: 4,
        isOwner: false,
      },
    ];
    render(<InviteSheet {...defaultProps} parties={parties} />);
    expect(screen.getByText('4 members')).toBeInTheDocument();
  });
});
