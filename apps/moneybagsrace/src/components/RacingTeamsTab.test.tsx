import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RacingTeamsTab from './RacingTeamsTab';
import { Party } from '@bubblyclouds-app/types/serverTypes';

const buildParty = (partyId: string, partyName: string): Party => ({
  partyId,
  appId: 'moneybagsrace',
  partyName,
  createdBy: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  isOwner: true,
  members: [
    {
      userId: 'user-1',
      resourceId: `party-${partyId}`,
      memberNickname: 'Me',
      createdAt: new Date(),
      updatedAt: new Date(),
      isOwner: true,
      isUser: true,
    },
    {
      userId: 'user-2',
      resourceId: `party-${partyId}`,
      memberNickname: 'Alex',
      createdAt: new Date(),
      updatedAt: new Date(),
      isOwner: false,
      isUser: false,
    },
  ],
});

describe('RacingTeamsTab', () => {
  it('shows an empty state when there are no parties', () => {
    render(
      <RacingTeamsTab user={undefined} parties={[]} onRefresh={undefined} />
    );
    expect(screen.getByText('No racing teams yet')).toBeInTheDocument();
  });

  it('lists parties and members excluding the current user', () => {
    render(
      <RacingTeamsTab
        user={{ sub: 'user-1' } as never}
        parties={[buildParty('1', 'Team A')]}
        onRefresh={undefined}
      />
    );

    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.queryByText('Me')).not.toBeInTheDocument();
  });

  it('calls onRefresh when the refresh button is clicked', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    render(
      <RacingTeamsTab
        user={{ sub: 'user-1' } as never}
        parties={[buildParty('1', 'Team A')]}
        onRefresh={onRefresh}
      />
    );

    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefresh).toHaveBeenCalled();
  });
});
