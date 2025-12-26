# Types Audit: Generic vs Sudoku-Specific

## Generic Types (Move to Template)

- **userProfile.ts** - User profile type definitions
- **subscriptionContext.ts** - Subscription/purchase types (RevenueCat)
- **tabs.ts** - Tab navigation types

## Sudoku-Specific Types (Keep in Sudoku)

- **StateType.ts** - Game state type definitions
- **state.ts** - Puzzle state types
- **notes.ts** - Puzzle notes types
- **puzzle.ts** - Puzzle definition types
- **serverTypes.ts** - Server API types for game
- **timer.ts** - Timer types
- **userSessions.ts** - User session types (puzzle sessions)

## Summary
- **Generic**: 3 type files to extract
- **Sudoku-Specific**: 7 type files to keep
