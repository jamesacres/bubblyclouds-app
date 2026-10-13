'use client';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ServerStateResult, Party } from '@bubblyclouds-app/types/serverTypes';
import { UserProfile } from '@bubblyclouds-app/types/userProfile';
import { UserSessions } from '@bubblyclouds-app/types/userSessions';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import Leaderboard from '@bubblyclouds-app/games/components/Leaderboard';
import { SCORING_CONFIG } from '@bubblyclouds-app/games/helpers/scoringConfig';
import { UnblockRaceDifficulty } from '@bubblyclouds-app/games/types/difficulty';
import {
  unblockDifficultyDisplay,
  UNBLOCK_DIFFICULTY_MULTIPLIERS,
  UNBLOCK_SPEED_THRESHOLDS,
} from '@bubblyclouds-app/unblockrace/helpers/difficultyDisplay';

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

const UNBLOCK_DIFFICULTY_KEYS = [
  UnblockRaceDifficulty.BEGINNER,
  UnblockRaceDifficulty.CHALLENGING,
  UnblockRaceDifficulty.HARD,
  UnblockRaceDifficulty.EXPERT,
];

function UnblockLeaderboard<State extends BaseServerState = BaseServerState>(
  props: UnblockLeaderboardProps<State>
) {
  const { t } = useTranslation('app');
  const { t: tUnblock } = useTranslation('unblockrace');
  const difficulties = useMemo(
    () =>
      UNBLOCK_DIFFICULTY_KEYS.map((key) => ({
        key,
        label: unblockDifficultyDisplay(key, tUnblock).label,
        multiplier: UNBLOCK_DIFFICULTY_MULTIPLIERS[key],
      })),
    [tUnblock]
  );

  return (
    <Leaderboard<State>
      {...props}
      scoringOptions={{
        dailyCombo: SCORING_CONFIG.DAILY_COMBO,
        difficultyMultipliers: UNBLOCK_DIFFICULTY_MULTIPLIERS,
        speedThresholds: UNBLOCK_SPEED_THRESHOLDS,
      }}
      dailyDifficulties={difficulties}
      collectionLabel={t('leaderboard.collectionLabel')}
      collectionDetailNoun={t('leaderboard.collectionDetailNoun')}
      collectionDifficulties={difficulties}
      showScannedPuzzles={false}
    />
  );
}

export default UnblockLeaderboard;
