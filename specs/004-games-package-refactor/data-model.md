# Data Model: Games Package Refactoring

**Date**: 2025-11-16
**Status**: Complete

## Overview

This refactoring does not introduce new data models or modify existing ones. Instead, it reorganizes existing components into appropriate packages. This document describes the organizational model and component categories.

## Component Categories (Organizational Model)

### Category 1: Generic Game Components → `@sudoku-web/games`

**Purpose**: Reusable UI components for competitive game applications

**Components**:

| Component | Responsibility | Key Props |
|-----------|---------------|-----------|
| `TimerDisplay` | Display elapsed time in game format | `seconds: number`, `format?: 'compact' \| 'full'` |
| `RaceTrack` | Visualize competitive progress | `players: Array<{id, position, color}>` |
| `TrafficLight` | Show race/competition status | `status: 'waiting' \| 'ready' \| 'go' \| 'finished'` |
| `NumberPad` | Generic number input interface | `onNumber: (n: number) => void`, `disabled?: boolean` |
| `Leaderboard` | Display ranked player scores | `entries: Array<{id, score, player}>` |
| `ActivityWidget` | Show recent game activity | `activities: Array<{id, type, timestamp, data}>` |
| `FriendLeaderboardEntry` | Single leaderboard row | `rank: number`, `player: Player`, `score: number` |
| `SidebarButton` | Generic sidebar action button | `label: string`, `onClick: () => void`, `icon?: ReactNode` |
| `HintBox` | Generic hint/help container | `children: ReactNode`, `title?: string` |

**State**: Stateless (controlled components) - state managed by consuming applications

**Dependencies**: None (zero package dependencies, only React/UI framework)

### Category 2: Sudoku-Specific Components → `@sudoku-web/sudoku`

**Purpose**: Sudoku game logic and game-specific UI

**Components**:

| Component | Responsibility | Key Props |
|-----------|---------------|-----------|
| `Sudoku` | Main game orchestration | `puzzle: SudokuPuzzle`, `onSolve: () => void` |
| `SudokuControls` | Game-specific controls | `gameState: SudokuGameState` |
| `SudokuBox` | 3x3 sudoku sub-grid | `values: number[]`, `highlights: boolean[]` |
| `SimpleSudoku` | Simplified sudoku display | `grid: SudokuGrid`, `readonly?: boolean` |
| `SudokuInput` | Sudoku grid cell input | `value: number`, `onChange: (n: number) => void` |
| `SudokuInputNotes` | Pencil marks for cells | `notes: number[]`, `onToggle: (n: number) => void` |
| `SudokuSidebar` | Sudoku game sidebar | `gameState: SudokuGameState` |
| `BookCover` | Sudoku book presentation | `book: SudokuBook` |
| `ScoringLegend` | Sudoku scoring explanation | `rules: ScoringRules` |
| `ScoreBreakdown` | Detailed score calculation | `score: SudokuScore` |

**Helpers**:
- `scoringUtils.ts` - Sudoku-specific scoring calculations

**State**: Game state managed internally or via sudoku-specific providers

**Dependencies**: May import from `@sudoku-web/games` for generic components (e.g., TimerDisplay)

### Category 3: Party/Collaboration Components → `@sudoku-web/template`

**Purpose**: Multi-player party management (game-agnostic)

**Components**:

| Component | Responsibility | Key Props |
|-----------|---------------|-----------|
| `PartyRow` | Display single party | `party: Party`, `onJoin?: () => void` |
| `PartyInviteButton` | Invite to party | `partyId: string`, `onInvite: (userId: string) => void` |
| `PartyConfirmationDialog` | Confirm party actions | `action: string`, `onConfirm: () => void` |
| `FriendsTab` | Friends list view | `friends: User[]` |
| `MyPuzzlesTab` | User's puzzle history | `sessions: GameSession[]` |
| `IntegratedSessionRow` | Single session display | `session: GameSession` |

**State**: Uses Parties provider from `@sudoku-web/template` (existing)

**Dependencies**: May import from `@sudoku-web/ui` for base UI components

### Category 4: App-Specific Components → `apps/sudoku`

**Purpose**: Sudoku app-level orchestration and modals

**Components**:

| Component | Responsibility | Key Props |
|-----------|---------------|-----------|
| `HeaderWrapper` | App header composition | App-specific layout |
| `RacingPromptModal` | Racing feature modal | `onStart: () => void` |
| `SudokuPlusModal` | Premium feature modal | `onUpgrade: () => void` |

**State**: App-level state and routing

**Dependencies**: Imports from all packages (apps consume packages)

## Package Dependency Graph

```
┌─────────────────────────────────────────────────┐
│                 apps/sudoku                     │
│   (HeaderWrapper, RacingPromptModal, etc.)     │
└────────┬────────┬────────┬──────────────────────┘
         │        │        │
         │        │        └──────────┐
         │        │                   │
         ▼        ▼                   ▼
┌────────────┐ ┌────────────┐ ┌──────────────┐
│ @sudoku-   │ │ @sudoku-   │ │ @sudoku-web/ │
│ web/sudoku │ │ web/       │ │ template     │
│            │ │ games      │ │              │
└─────┬──────┘ └────────────┘ └──────┬───────┘
      │                              │
      │                              │
      └──────────┬───────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ @sudoku-web/  │
         │ ui            │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ @sudoku-web/  │
         │ shared, types │
         └───────────────┘
```

**Key Dependency Rules**:
1. `@sudoku-web/games` → Zero dependencies on feature packages
2. `@sudoku-web/template` → No dependency on games or sudoku
3. `@sudoku-web/sudoku` → Can import from games (generic components)
4. `apps/sudoku` → Can import from all packages (apps consume)

## Component Interface Contracts

### Generic Component Pattern (Games Package)

All components in the games package follow this pattern:

```typescript
// Props are fully typed
interface ComponentProps {
  // Required data (no defaults)
  data: SomeDataType;

  // Event handlers (optional, use callbacks not imports)
  onAction?: (param: Type) => void;

  // Optional configuration
  variant?: 'default' | 'compact';
  disabled?: boolean;
  className?: string; // For Tailwind extension
}

// Stateless functional component
export const Component: React.FC<ComponentProps> = ({
  data,
  onAction,
  variant = 'default',
  disabled = false,
  className = '',
}) => {
  // Render UI only, no game logic
  return (/* JSX */);
};
```

### Sudoku Component Pattern (Sudoku Package)

```typescript
// Can include game-specific logic
interface SudokuComponentProps {
  gameState: SudokuGameState; // Sudoku-specific types
  puzzle: SudokuPuzzle;
  onMove?: (move: SudokuMove) => void;
}

// May use sudoku-specific hooks
export const SudokuComponent: React.FC<SudokuComponentProps> = ({
  gameState,
  puzzle,
  onMove,
}) => {
  // Can import from @sudoku-web/games for generic UI
  // Can use sudoku-specific helpers
  return (/* JSX */);
};
```

## Migration Impact on Data

**No data migrations required**:
- No database schema changes
- No API contract changes
- No data format changes
- No state structure changes

**Only code organization changes**:
- File locations change
- Import paths change
- Package.json exports change

## Validation Rules

### Package Boundary Validation

After migration, these rules MUST hold:

1. **No circular dependencies**: Dependency graph must be acyclic
2. **Games package purity**: Zero imports from sudoku or template packages
3. **Import conventions**: Relative within package, package names across packages
4. **No barrel exports**: Direct imports from source files only
5. **Test co-location**: Test files in same directory as components

### TypeScript Validation

```bash
# Must succeed with zero errors
npx tsc --noEmit
```

### Test Validation

```bash
# Must maintain 99%+ pass rate
npm test

# Must maintain 80%+ coverage
npm test:coverage
```

### Dependency Validation

```bash
# Check for circular dependencies
npx madge --circular packages/ apps/
```

## Next Steps

Proceed to contracts generation (though no API contracts needed for this refactoring).
