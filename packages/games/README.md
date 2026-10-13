# @bubblyclouds-app/games

Generic game UI components for reuse across multiple game applications (Sudoku,
Wordsearch, etc.).

## Purpose

This package provides a collection of reusable game components that are not
specific to any single game. These components are designed to be used across
multiple game applications in the bubblyclouds-app monorepo.

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

### LobbyButton

A lobby navigation button component.

### HintBox

A component for displaying hints during gameplay.

## Usage

Install via pnpm in your application:

```bash
pnpm add @bubblyclouds-app/games --filter workspace
```

Import and use components:

```tsx
import { TimerDisplay } from "@bubblyclouds-app/games/components/TimerDisplay";

export function MyGame() {
  return <TimerDisplay seconds={300} onTimeUp={() => {}} />;
}
```

## Architecture

- **No dependencies on game-specific packages**: This package maintains zero
  dependencies on `@bubblyclouds-app/sudoku` or other feature packages
- **Uses dependency injection**: Components accept all necessary data as props
- **Platform-agnostic**: Works across web, iOS (Capacitor), Android (Capacitor),
  and Electron

## Constraints

- No barrel exports (index.ts files) - import directly from component files
- Relative imports within the package
- Package name imports when used from other packages
  (`@bubblyclouds-app/games/components/ComponentName`)

## Localisation

User-facing strings live in `src/locales/en.json` (namespace `games`, exported as
`@bubblyclouds-app/games/locales/en`) and are read with
`useTranslation('games')`. See Internationalisation in `ARCHITECTURE.md`.

### Helpers that return display text

Non-React helpers never import an i18n singleton. They take a `Translate`
(`@bubblyclouds-app/games/types/i18n`) and the caller passes the `t` from
`useTranslation('games')`:

- `getTechniquesDisplay(techniques, t)` (keys `techniques.<techniqueId>`)
- `getDifficultyDisplay(difficulty, t)` (keys `difficulty.daily.*`,
  `difficulty.book.*`; emoji prefixes stay in code)
- `nextPuzzleProgressLabel({ ..., t })` (key `nextPuzzleProgress.bandComplete`)
- `getUsernameFromParties(userId, parties, unknownUserLabel)`

`calculateActivityStats` returns `dayIndex` (0 = Sunday) instead of a label;
`ActivityWidget` maps it to `activityWidget.days.*`.

Numbers use `toLocaleString(i18n.language)`; nothing hard-codes a locale.

### Agent identity versus display

`AgentConfig.id` (stable slug such as `bumblebee`) keys translations.
`AgentConfig.name` is the legacy identity token (persisted `agentNames`,
`agent-<name>` run ids, `selectAgentConfigsByName`) and is never rendered.

```ts
type AgentIdentity = { id: string; name: string };
type AgentDisplayResolver = (agent: AgentIdentity) => string;
```

The agent data and `agents.<id>.name` keys live in the owning game package's
namespace (`sudoku`, `unblockrace`), so `@games` receives a resolver instead of
reading those namespaces:

- `useAgentDisplayResolver(namespace)` (`hooks/useAgentDisplayResolver`) returns
  a resolver that reads `agents.<id>.name` in `namespace` and falls back to
  `name` when the key is missing.
- `useAgentDisplay(namespace)` (`hooks/useAgentDisplay`) returns the
  `getAgentDisplay` callback for the template lobby: `{ name, personality,
  emojiName }` from `agents.<id>.*` in `namespace`. Pass it with
  `agentOptions={DEFAULT_AGENT_CONFIGS}`.
- `LocalAgent.configId` carries `AgentConfig.id` next to the run id (`id`).
- `getAllAgentProgress(..., resolveAgentName)` fills `AgentProgress.name` with
  the display text, which `RaceTrack` renders as is, and
  `AgentProgress.configId` with the agent id (used for `/opponents/<id>.webp`).
- `calculateRunResults({ ..., resolveAgentName })` fills `nickname` for agent
  lines from `AgentRunInput.configId` and `AgentRunInput.name`.

`RaceTrack` itself never reads an agent's `name` for identity: its display
fields (`AgentProgress.name`, `PlayerRunResult.nickname`) are already resolved.
