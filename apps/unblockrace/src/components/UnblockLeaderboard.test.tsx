import React from 'react';
import { render, screen } from '@testing-library/react';
import UnblockLeaderboard from './UnblockLeaderboard';

let receivedProps: Record<string, unknown> | undefined;

jest.mock('@bubblyclouds-app/games/components/Leaderboard', () => {
  return function MockLeaderboard(props: Record<string, unknown>) {
    receivedProps = props;
    return <div data-testid="leaderboard" />;
  };
});

describe('UnblockLeaderboard', () => {
  const isPuzzleCheated = jest.fn().mockReturnValue(false);

  beforeEach(() => {
    receivedProps = undefined;
  });

  it('renders the shared Leaderboard', () => {
    render(
      <UnblockLeaderboard
        sessions={null}
        friendSessions={{}}
        parties={[]}
        user={{ sub: 'user-1' } as never}
        isPuzzleCheated={isPuzzleCheated}
        gameName="Unblock Race"
      />
    );

    expect(screen.getByTestId('leaderboard')).toBeInTheDocument();
  });

  it('forwards its props and the daily combo scoring config to Leaderboard', () => {
    render(
      <UnblockLeaderboard
        sessions={null}
        friendSessions={{}}
        parties={[]}
        user={{ sub: 'user-1' } as never}
        isPuzzleCheated={isPuzzleCheated}
        gameName="Unblock Race"
      />
    );

    expect(receivedProps).toMatchObject({
      gameName: 'Unblock Race',
      scoringOptions: { dailyCombo: { increment: 0.1, max: 1.5 } },
    });
  });
});
