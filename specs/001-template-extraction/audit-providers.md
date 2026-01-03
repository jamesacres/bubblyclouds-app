# Providers Audit: Generic vs Sudoku-Specific

## Generic Providers (Move to Template)

- **UserProvider/** - User authentication and profile management
- **FetchProvider/** - Generic fetch context with error handling
- **CapacitorProvider/** - Capacitor platform integration
- **RevenueCatProvider/** - In-app purchase and subscription management
- **ThemeColorProvider.tsx** - Theme color context

## Sudoku-Specific Providers (Keep in Sudoku)

- **GlobalStateProvider/** - Game state provider (puzzle state, moves, etc.)
- **SessionsProvider/** - Puzzle sessions management
- **PartiesProvider/** - Racing/party management
- **BookProvider/** - Puzzle book management

## Summary
- **Generic**: 5 providers to extract
- **Sudoku-Specific**: 4 providers to keep
