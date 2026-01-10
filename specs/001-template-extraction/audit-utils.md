# Utils/Helpers Audit: Generic vs Sudoku-Specific

## Generic Helpers (Move to Template)

### Time/Formatting
- **formatSeconds.ts** - Format seconds to human-readable time
- **calculateSeconds.ts** - Calculate time intervals

### Platform Detection
- **capacitor.ts** - Capacitor platform detection utilities
- **electron.ts** - Electron platform detection utilities

### Authentication
- **pkce.ts** - PKCE (Proof Key for Code Exchange) authentication helper

### Utilities
- **playerColors.ts** - Player color assignment (can be generic for multi-user apps)
- **dailyActionCounter.ts** - Daily action limit tracker (generic pattern)

## Sudoku-Specific Helpers (Keep in Sudoku)

### Puzzle Management
- **buildPuzzleUrl.ts** - Build puzzle URLs
- **calculateCompletionPercentage.ts** - Calculate puzzle completion
- **calculateId.ts** - Generate puzzle identifiers

### Game Logic
- **cheatDetection.ts** - Detect cheating in puzzles
- **checkAnswer.ts** - Validate puzzle answers

### Counters
- **dailyPuzzleCounter.ts** - Track daily puzzles completed

## Summary
- **Generic**: 7 helper/util files to extract
- **Sudoku-Specific**: 6 helper/util files to keep
