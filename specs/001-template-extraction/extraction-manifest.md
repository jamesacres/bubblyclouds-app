# Template Extraction Manifest

## Summary Statistics
- **Total Generic Files**: ~40 files (components, hooks, providers, types, helpers)
- **Total Sudoku-Specific Files**: ~50+ files
- **Extraction Ratio**: ~45% of codebase is generic and reusable

## Files to Extract to Template

### Components (16 files)
```
apps/sudoku/src/components/ErrorBoundary/ → apps/template/src/components/ErrorBoundary/
apps/sudoku/src/components/GlobalErrorHandler/ → apps/template/src/components/GlobalErrorHandler/
apps/sudoku/src/components/Header/ → apps/template/src/components/Header/
apps/sudoku/src/components/HeaderBack/ → apps/template/src/components/HeaderBack/
apps/sudoku/src/components/HeaderUser/ → apps/template/src/components/HeaderUser/
apps/sudoku/src/components/HeaderOnline/ → apps/template/src/components/HeaderOnline/
apps/sudoku/src/components/Footer/ → apps/template/src/components/Footer/
apps/sudoku/src/components/ThemeSwitch/ → apps/template/src/components/ThemeSwitch/
apps/sudoku/src/components/ThemeControls/ → apps/template/src/components/ThemeControls/
apps/sudoku/src/components/ThemeColorSwitch/ → apps/template/src/components/ThemeColorSwitch/
apps/sudoku/src/components/CopyButton/ → apps/template/src/components/CopyButton/
apps/sudoku/src/components/Toggle/ → apps/template/src/components/Toggle/
apps/sudoku/src/components/SocialProof/ → apps/template/src/components/SocialProof/
apps/sudoku/src/components/CelebrationAnimation/ → apps/template/src/components/CelebrationAnimation/
apps/sudoku/src/components/PremiumFeatures/ → apps/template/src/components/PremiumFeatures/
apps/sudoku/src/components/AppDownloadModal/ → apps/template/src/components/AppDownloadModal/
apps/sudoku/src/components/tabs/ → apps/template/src/components/tabs/
```

### Hooks (6 files + tests)
```
apps/sudoku/src/hooks/fetch.ts → apps/template/src/hooks/fetch.ts
apps/sudoku/src/hooks/localStorage.ts → apps/template/src/hooks/localStorage.ts
apps/sudoku/src/hooks/online.ts → apps/template/src/hooks/online.ts
apps/sudoku/src/hooks/documentVisibility.ts → apps/template/src/hooks/documentVisibility.ts
apps/sudoku/src/hooks/useDrag.ts → apps/template/src/hooks/useDrag.ts
apps/sudoku/src/hooks/useWakeLock.ts → apps/template/src/hooks/useWakeLock.ts
```

### Providers (5 directories)
```
apps/sudoku/src/providers/UserProvider/ → apps/template/src/providers/UserProvider/
apps/sudoku/src/providers/FetchProvider/ → apps/template/src/providers/FetchProvider/
apps/sudoku/src/providers/CapacitorProvider/ → apps/template/src/providers/CapacitorProvider/
apps/sudoku/src/providers/RevenueCatProvider/ → apps/template/src/providers/RevenueCatProvider/
apps/sudoku/src/providers/ThemeColorProvider.tsx → apps/template/src/providers/ThemeColorProvider.tsx
```

### Types (3 files)
```
apps/sudoku/src/types/userProfile.ts → apps/template/src/types/userProfile.ts
apps/sudoku/src/types/subscriptionContext.ts → apps/template/src/types/subscriptionContext.ts
apps/sudoku/src/types/tabs.ts → apps/template/src/types/tabs.ts
```

### Helpers/Utils (7 files + tests)
```
apps/sudoku/src/helpers/formatSeconds.ts → apps/template/src/helpers/formatSeconds.ts
apps/sudoku/src/helpers/calculateSeconds.ts → apps/template/src/helpers/calculateSeconds.ts
apps/sudoku/src/helpers/capacitor.ts → apps/template/src/helpers/capacitor.ts
apps/sudoku/src/helpers/electron.ts → apps/template/src/helpers/electron.ts
apps/sudoku/src/helpers/pkce.ts → apps/template/src/helpers/pkce.ts
apps/sudoku/src/utils/playerColors.ts → apps/template/src/utils/playerColors.ts
apps/sudoku/src/utils/dailyActionCounter.ts → apps/template/src/utils/dailyActionCounter.ts
```

## Files to Keep in Sudoku (Sudoku-Specific)

### Components (~22 files)
- All Sudoku* components
- Game UI: NumberPad, HintBox, TimerDisplay, etc.
- Session/Party: IntegratedSessionRow, PartyRow, RaceTrack, etc.
- Book: BookCovers
- Leaderboard components

### Hooks (4 files)
- gameState.ts
- timer.ts
- useParties.ts
- serverStorage.ts

### Providers (4 directories)
- GlobalStateProvider/
- SessionsProvider/
- PartiesProvider/
- BookProvider/

### Types (7 files)
- StateType.ts
- state.ts
- notes.ts
- puzzle.ts
- serverTypes.ts
- timer.ts
- userSessions.ts

### Helpers (6 files)
- buildPuzzleUrl.ts
- calculateCompletionPercentage.ts
- calculateId.ts
- cheatDetection.ts
- checkAnswer.ts
- utils/dailyPuzzleCounter.ts

## Import Strategy

After extraction, sudoku app will import generic code:

```typescript
// From template
import { Header, Footer, ErrorBoundary } from '@bubblyclouds-app/template/components'
import { useLocalStorage, useFetch, useOnline } from '@bubblyclouds-app/template/hooks'
import { UserProvider, FetchProvider } from '@bubblyclouds-app/template/providers'
import type { UserProfile, SubscriptionContext } from '@bubblyclouds-app/template/types'

// Local sudoku-specific code
import { Sudoku, NumberPad } from '@/components'
import { useGameState, useTimer } from '@/hooks'
import { GlobalStateProvider, SessionsProvider } from '@/providers'
```

## Testing Strategy

All tests will be copied with their respective files and updated to reference new paths.
