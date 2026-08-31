'use client';
import React from 'react';
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

// Unblock Race's own difficulty tiers for the scoring legend, in place of
// sudoku's default puzzle-book tiers. Used for both the daily and collection
// sections since Unblock Race scores both puzzle types off the same
// beginner/challenging/hard/expert multipliers (see UNBLOCK_DIFFICULTY_MULTIPLIERS).
const UNBLOCK_DIFFICULTIES = [
  UnblockRaceDifficulty.BEGINNER,
  UnblockRaceDifficulty.CHALLENGING,
  UnblockRaceDifficulty.HARD,
  UnblockRaceDifficulty.EXPERT,
].map((key) => ({
  key,
  label: unblockDifficultyDisplay(key).label,
  multiplier: UNBLOCK_DIFFICULTY_MULTIPLIERS[key],
}));

function UnblockLeaderboard<State extends BaseServerState = BaseServerState>(
  props: UnblockLeaderboardProps<State>
) {
  return (
    <Leaderboard<State>
      {...props}
      scoringOptions={{
        dailyCombo: SCORING_CONFIG.DAILY_COMBO,
        difficultyMultipliers: UNBLOCK_DIFFICULTY_MULTIPLIERS,
        speedThresholds: UNBLOCK_SPEED_THRESHOLDS,
      }}
      dailyDifficulties={UNBLOCK_DIFFICULTIES}
      collectionLabel="Collection"
      collectionDetailNoun="collections"
      collectionDifficulties={UNBLOCK_DIFFICULTIES}
      showScannedPuzzles={false}
    />
  );
}

export default UnblockLeaderboard;
