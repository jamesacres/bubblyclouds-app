'use client';
import React from 'react';
import { ServerStateResult, Party } from '@bubblyclouds-app/types/serverTypes';
import { UserProfile } from '@bubblyclouds-app/types/userProfile';
import { UserSessions } from '@bubblyclouds-app/types/userSessions';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import Leaderboard from '@bubblyclouds-app/games/components/Leaderboard';
import { SCORING_CONFIG } from '@bubblyclouds-app/games/helpers/scoringConfig';

interface UnblockLeaderboardProps<
  State extends BaseServerState = BaseServerState,
> {
  sessions: ServerStateResult<State>[] | null;
  friendSessions: UserSessions<State>;
  parties: Party[];
  user: UserProfile;
  selectedParty?: Party;
  isPuzzleCheated: (state: State) => boolean;
  gameName: string;
}

function UnblockLeaderboard<State extends BaseServerState = BaseServerState>(
  props: UnblockLeaderboardProps<State>
) {
  return (
    <Leaderboard<State>
      {...props}
      scoringOptions={{ dailyCombo: SCORING_CONFIG.DAILY_COMBO }}
    />
  );
}

export default UnblockLeaderboard;
