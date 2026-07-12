/**
 * Enum for login modal contexts
 * Used to provide specific messaging based on which action triggered sign-in
 */
export enum LoginContext {
  DAILY_PUZZLE = 'dailyPuzzle',
  PUZZLE_BOOK = 'puzzleBook',
  JOIN_TEAM = 'joinTeam',
  SUBSCRIBE = 'subscribe',
  RACE_LOBBY = 'raceLobby',
  PUZZLE_ENTRY = 'puzzleEntry',
}
