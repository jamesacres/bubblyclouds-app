'use client';
import React, { useState, useMemo } from 'react';
import { Award } from 'react-feather';
import { ServerStateResult, Party } from '@bubblyclouds-app/types/serverTypes';
import { UserProfile } from '@bubblyclouds-app/types/userProfile';
import {
  FriendsLeaderboardScore,
  AllFriendsSessionsMap,
} from '../types/scoringTypes';
import {
  calculateUserScore,
  getUsernameFromParties,
} from '../helpers/scoringUtils';
import FriendLeaderboardEntry from './FriendLeaderboardEntry';
import ScoringLegend from './ScoringLegend';
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
}

function Leaderboard<TState extends BaseServerState = BaseServerState>({
  sessions,
  friendSessions,
  parties,
  user,
  selectedParty,
  isPuzzleCheated,
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
        isPuzzleCheated
      );
      const totalScore =
        userScore.volumeScore +
        userScore.dailyPuzzleScore +
        userScore.bookPuzzleScore +
        userScore.scannedPuzzleScore +
        userScore.difficultyBonus +
        userScore.speedBonus +
        userScore.racingBonus;

      leaderboard.push({
        userId: user.sub,
        username: user.name || 'You',
        totalScore,
        breakdown: {
          volumeScore: userScore.volumeScore,
          dailyPuzzleScore: userScore.dailyPuzzleScore,
          bookPuzzleScore: userScore.bookPuzzleScore,
          scannedPuzzleScore: userScore.scannedPuzzleScore,
          difficultyBonus: userScore.difficultyBonus,
          speedBonus: userScore.speedBonus,
          racingBonus: userScore.racingBonus,
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
          isPuzzleCheated
        );
        const totalScore =
          friendScore.volumeScore +
          friendScore.dailyPuzzleScore +
          friendScore.bookPuzzleScore +
          friendScore.scannedPuzzleScore +
          friendScore.difficultyBonus +
          friendScore.speedBonus +
          friendScore.racingBonus;

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
            bookPuzzleScore: friendScore.bookPuzzleScore,
            scannedPuzzleScore: friendScore.scannedPuzzleScore,
            difficultyBonus: friendScore.difficultyBonus,
            speedBonus: friendScore.speedBonus,
            racingBonus: friendScore.racingBonus,
          },
          stats: friendScore.stats,
        });
      }
    });

    // Sort by total score descending
    return leaderboard
      .filter((entry) => entry.stats.totalPuzzles > 0)
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [sessions, friendSessions, parties, user, selectedParty, isPuzzleCheated]);

  if (leaderboardData.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* Pro Tip about party-specific scoring */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/30">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Pro tip:</strong> Your racing wins and scores change for
          each tab above depending on who you&apos;ve beaten within that
          specific group. Switch between tabs to see your performance in
          different racing contexts!
        </p>
      </div>

      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center">
            <Award className="mr-3 text-yellow-500" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Leaderboard
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last 30 days
                {selectedParty
                  ? ` • ${selectedParty.partyName}`
                  : ' • All Parties'}
              </p>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <button
              onClick={() => setShowScoringLegend(true)}
              className="group relative flex cursor-pointer items-center overflow-hidden rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-purple-600 hover:to-blue-600 hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center whitespace-nowrap">
                🏆 How scoring works
                <span className="ml-1 animate-bounce">✨</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            </button>
          </div>
        </div>
      </div>

      {
        <div className="mb-6 space-y-3">
          {leaderboardData.map((entry, index) => (
            <FriendLeaderboardEntry
              key={entry.userId}
              entry={entry}
              rank={index + 1}
              isCurrentUser={entry.userId === user?.sub}
            />
          ))}
        </div>
      }

      <ScoringLegend
        isOpen={showScoringLegend}
        onClose={() => setShowScoringLegend(false)}
        gameName="Sudoku"
      />
    </div>
  );
}

export default Leaderboard;
