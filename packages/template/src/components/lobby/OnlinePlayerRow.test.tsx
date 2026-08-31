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

  describe('getMovesDisplay / getStarRating', () => {
    it('shows moves graded against par for an in-progress player', () => {
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
          calculateCompletionPercentageFromState={() => 40}
          getMovesDisplay={() => ({ movesMade: 12, movesRequired: 8 })}
        />
      );
      expect(screen.getByText('40% · 0:30')).toBeInTheDocument();
      expect(screen.getByText('12/8 +4')).toBeInTheDocument();
    });

    it('shows moves and star rating for a finished player', () => {
      const session = makeSession({
        completed: { at: '2026-06-10T10:00:30Z', seconds: 30 },
      });
      render(
        <OnlinePlayerRow
          {...defaultProps}
          session={session}
          getMovesDisplay={() => ({ movesMade: 8, movesRequired: 8 })}
          getStarRating={() => 3}
        />
      );
      expect(screen.getByText('Solved in 0:30')).toBeInTheDocument();
      expect(screen.getByText('8/8')).toBeInTheDocument();
      expect(screen.getByLabelText('3 of 3 stars')).toBeInTheDocument();
    });

    it('does not show a star rating while the player is still in progress', () => {
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
          getStarRating={() => 3}
        />
      );
      expect(screen.queryByLabelText(/stars/)).not.toBeInTheDocument();
    });

    it('does not render a moves chip when getMovesDisplay returns undefined', () => {
      render(
        <OnlinePlayerRow
          {...defaultProps}
          session={makeSession({
            timer: {
              seconds: 30,
              inProgress: {
                start: '2026-06-10T10:00:00Z',
                lastInteraction: '2026-06-10T10:00:30Z',
              },
            },
          })}
          getMovesDisplay={() => undefined}
        />
      );
      expect(screen.queryByText(/\//)).not.toBeInTheDocument();
    });

    it('omits moves and stars entirely when no callbacks are provided', () => {
      const session = makeSession({
        completed: { at: '2026-06-10T10:00:30Z', seconds: 30 },
      });
      render(<OnlinePlayerRow {...defaultProps} session={session} />);
      expect(screen.getByText('Solved in 0:30')).toBeInTheDocument();
      expect(screen.queryByText(/\//)).not.toBeInTheDocument();
    });
  });

  describe('runProgress (multi-stage runs)', () => {
    it('shows "Stage N of M" instead of the current-stage percentage', () => {
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
          calculateCompletionPercentageFromState={() => 80}
          runProgress={{
            completedStageCount: 2,
            totalStages: 5,
            totalSeconds: 40,
          }}
        />
      );
      // Stage 3 = 2 completed stages + the one they're live on now
      expect(screen.getByText('Stage 3 of 5 · 0:30')).toBeInTheDocument();
      expect(screen.queryByText(/80%/)).not.toBeInTheDocument();
    });

    it('does not show FinishedBadge or "Finished" state when the current stage is complete but the run is not', () => {
      // session.state.completed is set (this stage is done) but only 2 of 5
      // stages are complete overall — the run isn't finished yet.
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
      render(
        <OnlinePlayerRow
          {...defaultProps}
          session={session}
          runProgress={{
            completedStageCount: 2,
            totalStages: 5,
            totalSeconds: 60,
          }}
        />
      );
      expect(screen.queryByText('Finished')).not.toBeInTheDocument();
      expect(screen.getByText('Stage 3 of 5 · 0:30')).toBeInTheDocument();
    });

    it('shows the run total time once every stage is complete', () => {
      const session = makeSession({
        completed: { at: '2026-06-10T10:00:30Z', seconds: 30 },
      });
      render(
        <OnlinePlayerRow
          {...defaultProps}
          session={session}
          runProgress={{
            completedStageCount: 5,
            totalStages: 5,
            totalSeconds: 245,
          }}
        />
      );
      expect(screen.getByText('Finished')).toBeInTheDocument();
      expect(screen.getByText('Finished the run in 4:05')).toBeInTheDocument();
    });

    it('renders the "Stage N of M" label with no session at all — a player racing a stage we have no live session for', () => {
      // No session means no live in-stage timer either — the elapsed time
      // shown is 0:00 until they finish that stage and totalSeconds updates.
      const { session: _session, ...propsWithoutSession } = defaultProps;
      render(
        <OnlinePlayerRow
          {...propsWithoutSession}
          runProgress={{
            completedStageCount: 2,
            totalStages: 5,
            totalSeconds: 40,
          }}
        />
      );
      expect(screen.getByText('Stage 3 of 5 · 0:00')).toBeInTheDocument();
      expect(screen.queryByText('In lobby')).not.toBeInTheDocument();
      expect(screen.queryByTestId('compact-state')).not.toBeInTheDocument();
    });

    it('does not crash and shows no board preview when a finished, session-less player has completed every stage', () => {
      const { session: _session, ...propsWithoutSession } = defaultProps;
      render(
        <OnlinePlayerRow
          {...propsWithoutSession}
          runProgress={{
            completedStageCount: 5,
            totalStages: 5,
            totalSeconds: 200,
          }}
        />
      );
      expect(screen.getByText('Finished')).toBeInTheDocument();
      expect(screen.getByText('Finished the run in 3:20')).toBeInTheDocument();
      expect(screen.queryByTestId('compact-state')).not.toBeInTheDocument();
    });
  });
});
