/**
 * Utility for consistent player colors across components
 */

export const PLAYER_COLORS = [
  'bg-blue-500', // Luigi blue
  'bg-yellow-500', // Wario yellow
  'bg-purple-500', // Waluigi purple
  'bg-pink-500', // Peach pink
  'bg-green-500', // Yoshi green
];

export const CURRENT_USER_COLOR = 'bg-red-500'; // Mario red

/**
 * Get the color class for a specific player
 * @param userId - The user ID
 * @param allUserIds - Array of all user IDs in consistent order
 * @param isCurrentUser - Whether this is the current user
 * @returns The Tailwind color class
 */
export const getPlayerColor = (
  userId: string,
  allUserIds: string[],
  isCurrentUser: boolean = false
): string => {
  if (isCurrentUser) {
    return CURRENT_USER_COLOR;
  }

  const userIndex = allUserIds.indexOf(userId);
  if (userIndex === -1) {
    // Fallback to a default color if user not found
    return PLAYER_COLORS[0];
  }

  return PLAYER_COLORS[userIndex % PLAYER_COLORS.length];
};

/**
 * Generate a consistent list of all user IDs from parties data
 * This ensures the same color assignment across components
 */
export const getAllUserIds = (parties: any[]): string[] => {
  const userIdSet = new Set<string>();

  parties.forEach((party) => {
    party.members.forEach((member: any) => {
      userIdSet.add(member.userId);
    });
  });

  // Sort to ensure consistent ordering
  return Array.from(userIdSet).sort();
};
