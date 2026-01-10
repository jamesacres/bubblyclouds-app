# Services Audit: Generic vs Sudoku-Specific

## Note
The sudoku app doesn't have a separate services directory. Service-like functionality is embedded in providers and hooks.

## Generic Service Logic (in Providers/Hooks)
- User authentication (UserProvider)
- Fetch/API client (FetchProvider)
- Storage (localStorage hooks)
- Platform detection (CapacitorProvider)
- Purchases (RevenueCatProvider)

## Sudoku-Specific Service Logic (in Providers/Hooks)
- Game state management (GlobalStateProvider)
- Session management (SessionsProvider)
- Party/racing management (PartiesProvider)
- Book management (BookProvider)
- Puzzle fetching/validation (embedded in game state)

## Summary
No separate services directory to extract. Service logic is provider-based.
