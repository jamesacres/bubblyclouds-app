# @sudoku-web/games

Generic game UI components for reuse across multiple game applications (Sudoku, Wordsearch, etc.).

## Purpose

This package provides a collection of reusable game components that are not specific to any single game. These components are designed to be used across multiple game applications in the sudoku-web monorepo.

## Components

### TimerDisplay
A simple countdown timer display component.

### RaceTrack
A visual race track component for competitive gameplay.

### TrafficLight
A traffic light component for visual state indication.

### NumberPad
A numeric input pad component for number entry.

### Leaderboard
A leaderboard component for displaying game scores and rankings.

### ActivityWidget
A widget component for displaying user activity.

### FriendLeaderboardEntry
A component representing a single friend entry on a leaderboard.

### SidebarButton
A sidebar navigation button component.

### HintBox
A component for displaying hints during gameplay.

## Usage

Install via npm in your application:

```bash
npm install @sudoku-web/games
```

Import and use components:

```tsx
import { TimerDisplay } from '@sudoku-web/games/components/TimerDisplay';

export function MyGame() {
  return <TimerDisplay seconds={300} onTimeUp={() => {}} />;
}
```

## Architecture

- **No dependencies on game-specific packages**: This package maintains zero dependencies on `@sudoku-web/sudoku` or other feature packages
- **Uses dependency injection**: Components accept all necessary data as props
- **Platform-agnostic**: Works across web, iOS (Capacitor), Android (Capacitor), and Electron

## Constraints

- No barrel exports (index.ts files) - import directly from component files
- Relative imports within the package
- Package name imports when used from other packages (`@sudoku-web/games/components/ComponentName`)
