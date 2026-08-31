/**
 * Enum for login modal contexts
 * Used to provide specific messaging based on which action triggered sign-in
 */
export enum LoginContext {
  DAILY_PUZZLE = 'dailyPuzzle',
  PUZZLE_BOOK = 'puzzleBook',
  // Unblock Race's puzzle collection browser — same trigger point as
  // PUZZLE_BOOK (sudoku's monthly book), separate context since the two
  // games use different terminology for it.
  COLLECTION = 'collection',
  JOIN_TEAM = 'joinTeam',
  SUBSCRIBE = 'subscribe',
  RACE_LOBBY = 'raceLobby',
  PUZZLE_ENTRY = 'puzzleEntry',
}
