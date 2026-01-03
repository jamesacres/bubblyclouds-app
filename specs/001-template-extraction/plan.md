# Implementation Plan: Template Extraction for Multi-App Platform

**Branch**: `001-template-extraction` | **Date**: 2025-11-01 | **Spec**: [Feature Specification](./spec.md)

**Note**: This is a refactoring/extraction task. No new data models or API contracts. Backend implementation is unchanged.

## Summary

Refactor and extract Sudoku app's generic infrastructure (authentication, user management, session/party systems, theme management, multi-platform support) into a reusable template package (`packages/template/`). The template will contain generic components, hooks, types, and services with zero Sudoku-specific code. Sudoku app refactored to depend on template, isolating all Sudoku-specific code in `src/sudoku/` directory.

**Key Point**: Template remains backend-agnostic. All service layers, types, and API calls are unchanged. Template doesn't care how the backend works.

## Technical Context

**Language/Version**: TypeScript 5+, React 18, Next.js 14.1+ (App Router)

**Backend**: Existing backend API (unchanged)

**Testing**: Jest 29+, React Testing Library, existing Capacitor mocks

**Target Platform**: Multi-platform - web (Next.js), iOS (Capacitor), Android (Capacitor), desktop (Electron)

**Project Type**: Turborepo monorepo (from feature 002) with template package + Sudoku app

**Existing Architecture Preserved**:
- Service layer abstraction (auth, user, session, party services)
- Type definitions (User, Session, Party, Invite, etc.)
- API client implementation
- Authentication flow
- State management patterns
- Build & test setup

## Constitution Check

✅ All principles supported by refactoring:
- **Test-First**: Existing tests preserved and organized
- **TypeScript Safety**: Existing types remain, extraction maintains strict typing
- **Component-Driven**: Existing components organized into template
- **Multi-Platform**: Existing multi-platform code organized for reuse
- **User-Centric**: Existing UX and accessibility preserved

## Code Extraction Plan

### What Gets Extracted to Template (`packages/template/src/`)

**Components** (generic, no game logic)
- Navigation & layout components
- Tab structure (Home, Sessions, Friends)
- User profile & settings pages/components
- Theme toggle component
- Error boundaries & error display
- Loading skeletons & spinners
- Shared UI components

**Hooks** (generic, no game state)
- `useAuth()` - User auth state, logout (OAuth handled by auth service)
- `useUser()` - Current user profile & updates
- `useTheme()` - Dark/light mode with persistence
- `useSession<T>()` - Generic session CRUD
- `useParty()` - Party/group management
- `useRevenueCat()` - In-app purchase wrapper
- `useError()` - Global error handling
- `useOnline()` - Online/offline detection
- Other generic hooks (useFetch, useLocalStorage, etc.)

**Providers** (context setup)
- AuthProvider (authentication session, OAuth via auth service)
- UserProvider (user profile)
- ThemeProvider (dark/light mode)
- SessionProvider (generic state container)
- PartyProvider (group collaboration)
- ErrorProvider (global error handling)

**Types & Services**
- **NO CHANGES**: Keep existing types as-is from `src/types/`
- **NO CHANGES**: Keep existing API calls and services
- Move service files: authService, userService, sessionService, partyService
- API client configuration (unchanged)
- Utility functions & constants

**Configuration & Setup**
- Tailwind config (shared)
- Next.js config adjustments for monorepo
- Jest setup & mocks
- Environment configuration patterns

### What Stays in Sudoku (`apps/sudoku/src/sudoku/`)

All game-specific code:
- Game logic (puzzle generation, solver, scoring, timer)
- Sudoku UI components (GameBoard, SudokuGrid, SudokuSessionRow, etc.)
- Sudoku-specific hooks (usePuzzle, useGameState, useDailyPuzzle)
- Daily puzzle system & management
- Leaderboards & racing features
- Book system (series/collection management)
- Sudoku-specific pages & layouts
- Sudoku-specific types extending generic types (if any)

### What Sudoku Imports from Template

```typescript
// From template package
import { useAuth, useUser, useSession, useParty } from '@packages/template';
import { Navigation, ErrorBoundary } from '@packages/template/components';
import { AuthProvider, SessionProvider } from '@packages/template/providers';
import type { User, Session, Party } from '@packages/template/types';
```

## Project Structure

### Documentation (this feature)

```
specs/001-template-extraction/
├── plan.md              # This file (extraction planning)
├── research.md          # Research & approach decisions
├── quickstart.md        # Template usage guide
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (Turborepo monorepo - from feature 002)

```
├── packages/
│   ├── template/                    # NEW: Extracted generic template
│   │   ├── src/
│   │   │   ├── components/          # Navigation, Profile, Settings, Home, etc.
│   │   │   ├── hooks/               # useAuth, useSession, useParty, etc.
│   │   │   ├── providers/           # AuthProvider, SessionProvider, etc.
│   │   │   ├── services/            # authService, sessionService, etc.
│   │   │   ├── types/               # User, Session, Party, Invite, etc.
│   │   │   ├── utils/               # Formatting, validation, helpers
│   │   │   └── config/              # Constants, configuration
│   │   ├── __mocks__/               # Jest mocks (Capacitor, etc.)
│   │   ├── tests/                   # Unit & integration tests
│   │   └── package.json
│   │
│   └── (other shared packages as needed)
│
├── apps/
│   ├── sudoku/                      # REFACTORED: Depends on template
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router pages
│   │   │   ├── sudoku/              # All Sudoku-specific code
│   │   │   │   ├── components/      # GameBoard, Grid, SessionRow, etc.
│   │   │   │   ├── hooks/           # usePuzzle, useGameState, etc.
│   │   │   │   ├── services/        # Puzzle generation, scoring, etc.
│   │   │   │   ├── types/           # Sudoku-specific types
│   │   │   │   └── pages/           # Sudoku-specific routes
│   │   │   ├── lib/                 # Utilities, constants
│   │   │   └── config/              # App configuration
│   │   ├── tests/                   # Sudoku-specific tests
│   │   ├── public/                  # Static assets
│   │   └── package.json             # Depends on @packages/template
│   │
│   └── (other apps - future)
│
├── turbo.json                       # Turbo config (from feature 002)
├── package.json                     # Root workspace config
└── tsconfig.json                    # Shared TypeScript config
```

**Structure Decision**: Template extraction uses Turborepo monorepo structure established in feature 002. Template is in `packages/template/`, Sudoku in `apps/sudoku/`. Both share root configuration, build tools, and test setup. Sudoku imports template via workspace dependency.

## Extraction Approach

### Phase 1: Identify Extraction Boundaries

1. **Audit existing code** to identify generic vs. game-specific:
   - Walk through `src/components`, `src/hooks`, `src/services`
   - Mark each file as "generic" or "sudoku-specific"
   - Identify shared utilities and types

2. **Create template package structure** in `packages/template/` with same structure as Sudoku `src/`

3. **Copy generic code** to template, preserving imports and structure

### Phase 2: Refactor Imports

1. **Update type imports**: Components/hooks in template import types from template
2. **Update service imports**: Services updated to relative paths within template
3. **API client**: Verify import path in template

### Phase 3: Wire Sudoku to Import Template

1. **Install template**: `npm install @packages/template` in Sudoku app
2. **Update Sudoku imports**: Change `import { ... } from '@/hooks'` to `import { ... } from '@packages/template'` for generic hooks
3. **Keep Sudoku imports**: Sudoku-specific hooks remain local: `import { usePuzzle } from '@/sudoku/hooks'`
4. **Update providers**: Wrap Sudoku app with template providers (AuthProvider, SessionProvider, etc.)

### Phase 4: Testing & Validation

1. **Run tests**: Verify all tests pass after extraction
2. **Check imports**: Ensure no circular dependencies
3. **Build verification**: Build succeeds for all platforms (web, iOS, Android, Electron)
4. **Feature parity**: Sudoku app works identically before/after refactor

## Success Criteria

- ✅ Template package contains 0 Sudoku-specific code
- ✅ Sudoku imports generic code from template
- ✅ Sudoku-specific code isolated in `src/sudoku/`
- ✅ All existing tests pass (no regressions)
- ✅ App builds successfully for all platforms
- ✅ Bundle size unchanged (no increase from extraction)
- ✅ No changes to backend, types, or API calls
- ✅ Documentation updated with template usage examples

## Complexity Tracking

No Constitution violations or complexity notes. Straightforward refactoring with no architecture changes.

## Next Steps

**⚠️ IMPORTANT: Features 001 and 002 are Combined**

Feature 001 (Template Extraction) **depends on** Feature 002 (Turborepo Monorepo Setup) and should be executed together for maximum efficiency (40% faster than sequential).

**See `/specs/002-turborepo-monorepo-setup/tasks.md` for the complete, combined task list covering both features 001 and 002.**

### How to Start Implementation

1. **Review both feature specs**: Start with `/specs/002-turborepo-monorepo-setup/spec.md` (prerequisite)
2. **Review combined plan**: Read `/specs/002-turborepo-monorepo-setup/plan.md` (covers both features)
3. **Execute combined tasks**: Follow `/specs/002-turborepo-monorepo-setup/tasks.md` (181 total tasks across 11 phases)

### Why Combined?

- Feature 002 creates the monorepo structure that feature 001 depends on
- Executing them sequentially would waste time with redundant setup
- Combined approach: single Turborepo setup → immediate template extraction → cohesive refactoring

### Execution Order

1. **Phases 1-3**: Turborepo monorepo setup + platform build configuration (Feature 002)
2. **Phase 3.5**: Validate platform builds (iOS, Android, Electron)
3. **Phases 4-8**: Code audit, template extraction, and Sudoku refactoring (Feature 001)
4. **Phases 9-11**: Testing, validation, documentation, and polish (Both features)

Total timeline: 28-38 hours for complete implementation with full platform validation.
