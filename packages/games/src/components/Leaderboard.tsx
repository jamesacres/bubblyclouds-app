'use client';
import React, { useState, useMemo } from 'react';
import { Award } from 'lucide-react';
import { ServerStateResult, Party } from '@bubblyclouds-app/types/serverTypes';
import { UserProfile } from '@bubblyclouds-app/types/userProfile';
import {
  FriendsLeaderboardScore,
  AllFriendsSessionsMap,
  ScoringOptions,
} from '../types/scoringTypes';
import {
  calculateUserScore,
  getUsernameFromParties,
} from '../helpers/scoringUtils';
import FriendLeaderboardEntry from './FriendLeaderboardEntry';
import ScoringLegend, { CollectionDifficultyTier } from './ScoringLegend';
import { UserSessions } from '@bubblyclouds-app/types/userSessions';
import {
  BaseState,
  BaseServerState,
} from '@bubblyclouds-app/template/types/state';

interface LeaderboardProps<TState extends BaseServerState = BaseServerState> {
  sessions: ServerStateResult<TState>[] | null;
  friendSessions: UserSessions<BaseState>;
  parties: Party[];
  user: UserProfile;
  selectedParty?: Party;
  isPuzzleCheated: (state: TState) => boolean;
  gameName: string;
  scoringOptions?: ScoringOptions;
  // The difficulty tiers for this game's daily puzzles — defaults to
  // sudoku's Tricky/Challenging/Hard.
  dailyDifficulties?: CollectionDifficultyTier[];
  // What this game calls its collection-type puzzles and the difficulty
  // tiers that apply to them — sudoku's monthly puzzle book (the default,
  // matching its pre-existing copy) vs Unblock Race's own collections.
  collectionLabel?: string;
  collectionDetailNoun?: string;
  collectionDifficulties?: CollectionDifficultyTier[];
  showScannedPuzzles?: boolean;
}

function Leaderboard<TState extends BaseServerState = BaseServerState>({
  sessions,
  friendSessions,
  parties,
  user,
  selectedParty,
  isPuzzleCheated,
  gameName,
  scoringOptions,
  dailyDifficulties,
  collectionLabel,
  collectionDetailNoun,
  collectionDifficulties,
  showScannedPuzzles,
}: LeaderboardProps<TState>) {
  const [showScoringLegend, setShowScoringLegend] = useState(false);

  // Calculate leaderboard data
  const leaderboardData = useMemo(() => {
    if (!sessions || !parties || !user || !friendSessions) return [];

    // Filter sessions and friends based on selected party
    const partyUserIds =
      selectedParty && selectedParty.members
        ? new Set(selectedParty.members.map((m) => m.userId))
        : new Set();

    // Get all friend sessions for racing bonus calculation (filtered by party if selected)
    const allFriendsSessions: AllFriendsSessionsMap = {};
    Object.entries(friendSessions).forEach(([userId, userSession]) => {
      if (
        userSession?.sessions &&
        (!selectedParty || partyUserIds.has(userId))
      ) {
        allFriendsSessions[userId] = userSession.sessions;
      }
    });

    // Add current user's sessions (always included)
    if (sessions) {
      allFriendsSessions[user.sub] = sessions;
    }

    const leaderboard: FriendsLeaderboardScore[] = [];

    // Calculate score for current user
    if (sessions) {
      const userScore = calculateUserScore(
        sessions,
        allFriendsSessions,
        user.sub,
        isPuzzleCheated,
        scoringOptions
      );
      const totalScore =
        userScore.volumeScore +
        userScore.dailyPuzzleScore +
        userScore.collectionPuzzleScore +
        userScore.scannedPuzzleScore +
        userScore.difficultyBonus +
        userScore.speedBonus +
        userScore.racingBonus +
        userScore.comboBonus;

      leaderboard.push({
        userId: user.sub,
        username: user.name || 'You',
        totalScore,
        breakdown: {
          volumeScore: userScore.volumeScore,
          dailyPuzzleScore: userScore.dailyPuzzleScore,
          collectionPuzzleScore: userScore.collectionPuzzleScore,
          scannedPuzzleScore: userScore.scannedPuzzleScore,
          difficultyBonus: userScore.difficultyBonus,
          speedBonus: userScore.speedBonus,
          racingBonus: userScore.racingBonus,
          comboBonus: userScore.comboBonus,
        },
        stats: userScore.stats,
      });
    }

    // Calculate scores for friends (filtered by selected party)
    Object.entries(friendSessions).forEach(([userId, userSession]) => {
      if (
        userSession?.sessions &&
        userId !== user.sub &&
        (!selectedParty || partyUserIds.has(userId))
      ) {
        const friendScore = calculateUserScore(
          userSession.sessions as ServerStateResult<TState>[],
          allFriendsSessions,
          userId,
          isPuzzleCheated,
          scoringOptions
        );
        const totalScore =
          friendScore.volumeScore +
          friendScore.dailyPuzzleScore +
          friendScore.collectionPuzzleScore +
          friendScore.scannedPuzzleScore +
          friendScore.difficultyBonus +
          friendScore.speedBonus +
          friendScore.racingBonus +
          friendScore.comboBonus;

        leaderboard.push({
          userId,
          username: getUsernameFromParties(
            userId,
            selectedParty ? [selectedParty] : parties
          ),
          totalScore,
          breakdown: {
            volumeScore: friendScore.volumeScore,
            dailyPuzzleScore: friendScore.dailyPuzzleScore,
            collectionPuzzleScore: friendScore.collectionPuzzleScore,
            scannedPuzzleScore: friendScore.scannedPuzzleScore,
            difficultyBonus: friendScore.difficultyBonus,
            speedBonus: friendScore.speedBonus,
            racingBonus: friendScore.racingBonus,
            comboBonus: friendScore.comboBonus,
          },
          stats: friendScore.stats,
        });
      }
    });

    // Sort by total score descending
    return leaderboard
      .filter((entry) => entry.stats.totalPuzzles > 0)
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [
    sessions,
    friendSessions,
    parties,
    user,
    selectedParty,
    isPuzzleCheated,
    scoringOptions,
  ]);

  if (leaderboardData.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
            Leaderboard
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Last 30 days
            {selectedParty ? ` · ${selectedParty.partyName}` : ' · All teams'}
          </p>
        </div>
        <button
          onClick={() => setShowScoringLegend(true)}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-all duration-200 hover:bg-zinc-100 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          <Award className="h-3.5 w-3.5 text-amber-500" />
          How scoring works
        </button>
      </div>

      <div className="mb-6 space-y-2">
        {leaderboardData.map((entry, index) => (
          <FriendLeaderboardEntry
            key={entry.userId}
            entry={entry}
            rank={index + 1}
            isCurrentUser={entry.userId === user?.sub}
            collectionLabel={collectionLabel}
            collectionDetailNoun={collectionDetailNoun}
          />
        ))}
      </div>

      <ScoringLegend
        isOpen={showScoringLegend}
        onClose={() => setShowScoringLegend(false)}
        gameName={gameName}
        dailyCombo={scoringOptions?.dailyCombo}
        dailyDifficulties={dailyDifficulties}
        collectionLabel={collectionLabel}
        collectionDifficulties={collectionDifficulties}
        showScannedPuzzles={showScannedPuzzles}
        speedThresholds={scoringOptions?.speedThresholds}
      />
    </div>
  );
}

export default Leaderboard;
