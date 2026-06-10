import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnlinePlayerRow } from './OnlinePlayerRow';
import { Session } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '../../types/state';

const MockCompactState = ({ state: _state }: { state: BaseServerState }) => (
  <div data-testid="compact-state">State</div>
);

const baseState: BaseServerState = {
  answerStack: [],
  initial: [],
  final: [],
};

const makeSession = (
  overrides: Partial<BaseServerState> = {}
): Session<BaseServerState> => ({
  sessionId: 's1',
  state: { ...baseState, ...overrides },
  updatedAt: new Date('2026-06-10T10:00:00Z'),
});

const defaultProps = {
  userId: 'user1',
  memberNickname: 'Alice',
  session: makeSession(),
  parties: [],
  now: new Date('2026-06-10T10:01:00Z').getTime(),
  isAway: false,
  calculateCompletionPercentageFromState: () => 0,
  CompactSimpleState: MockCompactState,
  onSetConfirmRemove: jest.fn(),
};

describe('OnlinePlayerRow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the member nickname', () => {
    render(<OnlinePlayerRow {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows "In lobby" when not away, not finished, and timer not started', () => {
    render(<OnlinePlayerRow {...defaultProps} />);
    expect(screen.getByText('In lobby')).toBeInTheDocument();
  });

  it('does not render CompactSimpleState when player is in lobby', () => {
    render(<OnlinePlayerRow {...defaultProps} />);
    expect(screen.queryByTestId('compact-state')).not.toBeInTheDocument();
  });

  it('renders CompactSimpleState when player has started', () => {
    const session = makeSession({
      timer: {
        seconds: 30,
        inProgress: {
          start: '2026-06-10T10:00:00Z',
          lastInteraction: '2026-06-10T10:00:30Z',
        },
      },
    });
    render(
      <OnlinePlayerRow
        {...defaultProps}
        session={session}
        calculateCompletionPercentageFromState={() => 25}
      />
    );
    expect(screen.getByTestId('compact-state')).toBeInTheDocument();
  });

  it('shows FinishedBadge when player is completed', () => {
    const session = makeSession({
      completed: { at: '2026-06-10T10:00:30Z', seconds: 30 },
      timer: {
        seconds: 30,
        inProgress: {
          start: '2026-06-10T10:00:00Z',
          lastInteraction: '2026-06-10T10:00:30Z',
        },
      },
    });
    render(<OnlinePlayerRow {...defaultProps} session={session} />);
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  it('shows "Solved in" clock label when finished', () => {
    const session = makeSession({
      completed: { at: '2026-06-10T10:00:30Z', seconds: 90 },
      timer: {
        seconds: 90,
        inProgress: {
          start: '2026-06-10T10:00:00Z',
          lastInteraction: '2026-06-10T10:01:30Z',
        },
      },
    });
    render(<OnlinePlayerRow {...defaultProps} session={session} />);
    expect(screen.getByText('Solved in 1:30')).toBeInTheDocument();
  });

  it('shows percentage and clock when player has started but not finished', () => {
    const session = makeSession({
      timer: {
        seconds: 60,
        inProgress: {
          start: '2026-06-10T10:00:00Z',
          lastInteraction: '2026-06-10T10:01:00Z',
        },
      },
    });
    render(
      <OnlinePlayerRow
        {...defaultProps}
        session={session}
        calculateCompletionPercentageFromState={() => 40}
      />
    );
    expect(screen.getByText('40% · 1:00')).toBeInTheDocument();
  });

  it('includes "last seen" label when player is away', () => {
    const session = makeSession({
      timer: {
        seconds: 120,
        inProgress: {
          start: '2026-06-10T10:00:00Z',
          lastInteraction: '2026-06-10T10:02:00Z',
        },
      },
    });
    const now = new Date('2026-06-10T10:05:00Z').getTime();
    render(
      <OnlinePlayerRow
        {...defaultProps}
        session={session}
        isAway={true}
        now={now}
        calculateCompletionPercentageFromState={() => 50}
      />
    );
    expect(screen.getByText(/last seen/)).toBeInTheDocument();
  });

  it('renders party tags for each party', () => {
    const parties = [
      { partyId: 'p1', partyName: 'Team A', isOwner: false },
      { partyId: 'p2', partyName: 'Team B', isOwner: true },
    ];
    render(<OnlinePlayerRow {...defaultProps} parties={parties} />);
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
  });

  it('shows remove button when player owns at least one party', () => {
    const parties = [{ partyId: 'p1', partyName: 'Team A', isOwner: true }];
    render(<OnlinePlayerRow {...defaultProps} parties={parties} />);
    expect(screen.getByLabelText('Remove Alice')).toBeInTheDocument();
  });

  it('does not show remove button when player owns no parties', () => {
    const parties = [{ partyId: 'p1', partyName: 'Team A', isOwner: false }];
    render(<OnlinePlayerRow {...defaultProps} parties={parties} />);
    expect(screen.queryByLabelText('Remove Alice')).not.toBeInTheDocument();
  });

  it('calls onSetConfirmRemove with correct args when remove is clicked', () => {
    const onSetConfirmRemove = jest.fn();
    const parties = [{ partyId: 'p1', partyName: 'Team A', isOwner: true }];
    render(
      <OnlinePlayerRow
        {...defaultProps}
        parties={parties}
        onSetConfirmRemove={onSetConfirmRemove}
      />
    );
    fireEvent.click(screen.getByLabelText('Remove Alice'));
    expect(onSetConfirmRemove).toHaveBeenCalledWith({
      userId: 'user1',
      memberNickname: 'Alice',
      ownedParties: [{ partyId: 'p1', partyName: 'Team A', isOwner: true }],
    });
  });

  it('does not show remove button when no parties', () => {
    render(<OnlinePlayerRow {...defaultProps} parties={[]} />);
    expect(screen.queryByLabelText('Remove Alice')).not.toBeInTheDocument();
  });
});
