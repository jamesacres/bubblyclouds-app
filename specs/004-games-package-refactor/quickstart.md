# Quickstart: Games Package Refactoring

**Feature**: Games Package Refactoring
**Branch**: `004-games-package-refactor`
**Date**: 2025-11-16

## Overview

This guide explains how to use the reorganized package structure after the games package refactoring is complete.

## Package Structure

After this refactoring, components are organized by specificity:

```
@bubblyclouds-app/games       → Generic game components (timers, leaderboards, etc.)
@bubblyclouds-app/sudoku      → Sudoku-specific components and logic
@bubblyclouds-app/template    → Party/collaboration features
apps/sudoku             → App-level orchestration only
```

## Using Generic Game Components

### From the Games Package

The `@bubblyclouds-app/games` package provides reusable game components.

**Example: Using TimerDisplay**

```typescript
import { TimerDisplay } from '@bubblyclouds-app/games/components/TimerDisplay';

function MyGame() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <h1>My Game</h1>
      <TimerDisplay seconds={seconds} format="full" />
    </div>
  );
}
```

**Example: Using Leaderboard**

```typescript
import { Leaderboard } from '@bubblyclouds-app/games/components/Leaderboard';

function GameResults() {
  const scores = [
    { id: '1', player: 'Alice', score: 1000 },
    { id: '2', player: 'Bob', score: 950 },
    { id: '3', player: 'Charlie', score: 900 },
  ];

  return (
    <Leaderboard
      entries={scores}
      onEntryClick={(id) => console.log('Clicked:', id)}
    />
  );
}
```

**Available Components**:
- `TimerDisplay` - Display elapsed time
- `RaceTrack` - Visualize competitive progress
- `TrafficLight` - Show race status
- `NumberPad` - Number input interface
- `Leaderboard` - Ranked scores
- `ActivityWidget` - Recent activity feed
- `FriendLeaderboardEntry` - Single leaderboard row
- `SidebarButton` - Generic sidebar button
- `HintBox` - Hint/help container

## Using Sudoku-Specific Components

### From the Sudoku Package

The `@bubblyclouds-app/sudoku` package contains sudoku game logic.

**Example: Using SudokuBox**

```typescript
import { SudokuBox } from '@bubblyclouds-app/sudoku/components/SudokuBox';

function SudokuGrid() {
  const boxValues = [1, 2, 3, 0, 0, 0, 7, 8, 9]; // 0 = empty
  const highlights = [false, false, false, true, true, true, false, false, false];

  return (
    <SudokuBox
      values={boxValues}
      highlights={highlights}
    />
  );
}
```

**Example: Using Sudoku Scoring**

```typescript
import { ScoreBreakdown } from '@bubblyclouds-app/sudoku/components/ScoreBreakdown';
import { calculateScore } from '@bubblyclouds-app/sudoku/helpers/scoringUtils';

function SudokuResults() {
  const score = calculateScore({
    timeSeconds: 180,
    hintsUsed: 2,
    mistakes: 1,
  });

  return <ScoreBreakdown score={score} />;
}
```

## Using Party Components

### From the Template Package

The `@bubblyclouds-app/template` package provides collaboration features.

**Example: Using PartyRow**

```typescript
import { PartyRow } from '@bubblyclouds-app/template/components/PartyRow';

function PartyList() {
  const party = {
    id: 'party-123',
    name: 'Evening Puzzles',
    members: 4,
    status: 'active',
  };

  return (
    <PartyRow
      party={party}
      onJoin={() => console.log('Joining party')}
    />
  );
}
```

## Building a New Game App

### Step 1: Create App Structure

```bash
# Create new app directory
mkdir -p apps/wordsearch/src/app

# Copy package.json template from apps/sudoku
# Modify dependencies to import @bubblyclouds-app/games
```

### Step 2: Import Generic Components

```typescript
// apps/wordsearch/src/app/page.tsx
import { TimerDisplay } from '@bubblyclouds-app/games/components/TimerDisplay';
import { Leaderboard } from '@bubblyclouds-app/games/components/Leaderboard';
import { RaceTrack } from '@bubblyclouds-app/games/components/RaceTrack';

export default function WordSearchGame() {
  return (
    <div>
      <TimerDisplay seconds={gameTime} />
      <RaceTrack players={competitors} />
      <Leaderboard entries={scores} />
      {/* Your word search grid here */}
    </div>
  );
}
```

### Step 3: Add Game-Specific Logic

Create wordsearch-specific package if needed:

```bash
# Create wordsearch package
mkdir -p packages/wordsearch/src/components
```

## Import Rules

### Within Same Package (Relative Imports)

```typescript
// ✅ CORRECT: Relative import within games package
// File: packages/games/src/components/Leaderboard.tsx
import { SidebarButton } from './SidebarButton';
```

### Across Packages (Package Name Imports)

```typescript
// ✅ CORRECT: Import from another package
// File: packages/sudoku/src/components/Sudoku.tsx
import { TimerDisplay } from '@bubblyclouds-app/games/components/TimerDisplay';
```

### No Barrel Exports

```typescript
// ❌ WRONG: Barrel export (index.ts)
import { TimerDisplay } from '@bubblyclouds-app/games';

// ✅ CORRECT: Direct import
import { TimerDisplay } from '@bubblyclouds-app/games/components/TimerDisplay';
```

## Development Workflow

### Running the Sudoku App

```bash
# Development mode
npm run dev:sudoku

# Build
npm run build:sudoku

# Test
npm test
```

### Building Individual Packages

```bash
# Build all packages
npm run build

# Build specific package (if configured)
cd packages/games && npm run build
```

### Testing

```bash
# Run all tests
npm test

# Test specific package
npm test -- packages/games

# Test specific component
npm test -- TimerDisplay
```

## Troubleshooting

### Import Errors

**Problem**: `Cannot find module '@bubblyclouds-app/games/components/TimerDisplay'`

**Solution**:
1. Check package.json exports field in `packages/games/package.json`
2. Ensure TypeScript can resolve the path (check tsconfig.json)
3. Rebuild packages: `npm run build`

### TypeScript Errors

**Problem**: Type errors after importing components

**Solution**:
1. Ensure you're importing types correctly
2. Check that component props match interface
3. Run `npx tsc --noEmit` to see all type errors

### Test Failures

**Problem**: Tests fail after component move

**Solution**:
1. Check that test files moved with components
2. Update mock imports in test files
3. Verify jest.config.js paths are correct

## Verification

After implementation, verify the refactoring succeeded:

```bash
# 1. TypeScript compilation
npx tsc --noEmit
# Expected: Zero errors

# 2. All tests pass
npm test
# Expected: 99%+ pass rate

# 3. Build succeeds
npm run build
# Expected: No errors or warnings

# 4. No circular dependencies
npx madge --circular packages/ apps/
# Expected: No circular dependencies found

# 5. Sudoku app runs
npm run dev:sudoku
# Expected: App loads and functions identically to before
```

## Next Steps

Once this refactoring is complete:

1. ✅ Generic components available for reuse
2. ✅ Can create new game apps (wordsearch, crossword, etc.)
3. ✅ Clean package boundaries established
4. ✅ Constitutional compliance achieved

## References

- [Specification](./spec.md)
- [Implementation Plan](./plan.md)
- [Data Model](./data-model.md)
- [Project Constitution](/.specify/memory/constitution.md)
