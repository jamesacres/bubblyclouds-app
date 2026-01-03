# Hooks Audit: Generic vs Sudoku-Specific

## Generic Hooks (Move to Template)

- **fetch.ts** - Generic fetch hook with error handling
- **localStorage.ts** - Generic localStorage wrapper hook
- **online.ts** - Generic online/offline detection hook
- **documentVisibility.ts** - Generic document visibility hook
- **useDrag.ts** - Generic drag handler hook
- **useWakeLock.ts** - Generic wake lock hook (prevent screen sleep)

## Sudoku-Specific Hooks (Keep in Sudoku)

- **gameState.ts** - Sudoku game state management
- **timer.ts** - Puzzle timer hook
- **useParties.ts** - Party/racing management hook
- **serverStorage.ts** - Server storage for game state

## Summary
- **Generic**: 6 hooks to extract
- **Sudoku-Specific**: 4 hooks to keep
