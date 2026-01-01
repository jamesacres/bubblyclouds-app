# Tasks: Modular Turborepo Architecture

**Input**: Design documents from `/specs/003-modular-turborepo-architecture/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. This refactoring has 6 user stories across 2 priority levels.

**Execution Strategy**:
- Complete Setup → Complete Foundational → Implement User Stories in parallel or sequentially
- Each user story is independently testable and deployable
- MVP Scope: Complete User Story 1 (Template App Standalone) for minimum viable product

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and package structure foundation

- [x] T001 Create directory structure for new packages in `packages/` directory: `auth/`, `ui/`, `sudoku/`, `template/`
- [x] T002 Initialize `packages/auth/package.json` with name `@bubblyclouds-app/auth` and dependencies (React, TypeScript)
- [x] T003 [P] Initialize `packages/ui/package.json` with name `@bubblyclouds-app/ui` and dependencies
- [x] T004 [P] Initialize `packages/sudoku/package.json` with name `@bubblyclouds-app/sudoku` and dependencies
- [x] T005 [P] Initialize `packages/template/package.json` with name `@bubblyclouds-app/template` and dependencies
- [x] T006 Create TypeScript configuration files for each new package (copy from existing: `packages/auth/tsconfig.json`, `packages/ui/tsconfig.json`, etc.)
- [x] T007 Update root `tsconfig.json` with path aliases for all new packages:
  ```json
  "@bubblyclouds-app/auth": ["packages/auth/src"],
  "@bubblyclouds-app/ui": ["packages/ui/src"],
  "@bubblyclouds-app/sudoku": ["packages/sudoku/src"],
  "@bubblyclouds-app/template": ["packages/template/src"]
  ```
- [x] T008 [P] Create `packages/auth/src/index.ts` with empty public API export structure
- [x] T009 [P] Create `packages/ui/src/index.ts` with empty public API export structure
- [x] T010 [P] Create `packages/sudoku/src/index.ts` with empty public API export structure
- [x] T011 [P] Create `packages/template/src/index.ts` with empty public API export structure
- [x] T012 [P] Create Jest configuration for each new package (template from existing: `packages/auth/jest.config.js`, etc.)
- [x] T013 Create `README.md` in each new package documenting its purpose and public API structure
- [x] T014 Update root `package.json` workspaces array to include all new packages if not already included
- [x] T015 Run `npm install` to initialize all new packages and verify no errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T016 Create type definitions package structure in `packages/types/src/` for shared types (User, Session, Party, AuthToken) per data-model.md
- [x] T017 [P] Extract all authentication types to `packages/auth/src/types/` (User.ts, AuthToken.ts, SessionState.ts)
- [x] T018 [P] Extract all UI types to `packages/ui/src/types/` (ThemeConfig.ts, NavItem.ts, etc.)
- [x] T019 [P] Extract all party/collaboration types to `packages/template/src/types/` (Party.ts, PartyMember.ts, Session.ts)
- [x] T020 [P] Extract all sudoku-specific types to `packages/sudoku/src/types/` (Cell.ts, SudokuGrid.ts, SudokuState.ts)
- [x] T021 Extract shared generic types to `packages/types/src/` (Parties<T>, CollaborativeSession<T>) that all packages import
- [x] T022 Create providers directory structure in each package:
  - `packages/auth/src/providers/AuthProvider.tsx`
  - `packages/ui/src/providers/ThemeProvider.tsx`
  - `packages/template/src/providers/PartyProvider.tsx`
- [x] T023 [P] Create hooks directory structure in each package (empty files for now):
  - `packages/auth/src/hooks/` (useAuth.ts, useSession.ts, useUser.ts)
  - `packages/ui/src/hooks/` (useTheme.ts, useDarkMode.ts)
  - `packages/template/src/hooks/` (useParty.ts, useMembership.ts, useSession.ts)
  - `packages/sudoku/src/hooks/` (useTimer.ts, useSudokuState.ts)
- [x] T024 Create components directory structure in each package:
  - `packages/auth/src/components/` (LoginForm, RegisterForm)
  - `packages/ui/src/components/` (Header, Footer, Button, Modal)
  - `packages/template/src/components/` (PartyList, PartyDetails, SessionList)
  - `packages/sudoku/src/components/` (SudokuGrid, NumberPad, RaceTrack, Timer)
- [x] T025 Update import paths in root `jest.setup.js` and `jest.config.js` to use `@bubblyclouds-app/` aliases instead of relative paths
- [x] T026 Update root `.eslintrc.json` to include new packages in linting scope
- [x] T027 Verify all packages can be built: `npm run build` (should succeed with empty packages)
- [x] T028 Verify TypeScript compilation passes for all packages: `npx tsc --noEmit` (should have zero errors)
- [x] T029 Create empty test files for each package to verify jest can find and run tests

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Template App Standalone Usage (Priority: P1) 🎯 MVP

**Goal**: Template app compiles and runs independently with user authentication, profile, sessions, and party management - with zero sudoku references

**Independent Test**: `npm run build -w apps/template && npm run dev -w apps/template` → App runs, users can log in, view profile/sessions, create parties, invite members. Search codebase for "sudoku\|puzzle\|game\|cell" in apps/template returns no results.

### Implementation for User Story 1

- [x] T030 [P] [US1] Move authentication components from `apps/sudoku/src/components/auth/` to `packages/auth/src/components/`: LoginForm, RegisterForm, OAuthProviders
- [x] T031 [P] [US1] Move authentication hooks from `apps/sudoku/src/hooks/` to `packages/auth/src/hooks/`: useAuth, useSession, useUser with full implementations
- [x] T032 [P] [US1] Move AuthProvider from `apps/sudoku/src/providers/` to `packages/auth/src/providers/AuthProvider.tsx` with context implementation
- [x] T033 [P] [US1] Move authentication services from `apps/sudoku/src/services/` to `packages/auth/src/services/`: tokenService, sessionService
- [x] T034 [US1] Export public API from `packages/auth/src/index.ts`: AuthProvider, useAuth, useSession, useUser hooks, and types
- [x] T035 [P] [US1] Move UI components from `apps/sudoku/src/components/` to `packages/ui/src/components/`: Header, Footer, Navigation, Buttons, Modals (ensure generic - no sudoku refs)
- [x] T036 [P] [US1] Move theme/styling logic from `apps/sudoku/src/` to `packages/ui/src/`: ThemeProvider, useTheme, useDarkMode hooks, Tailwind config
- [x] T037 [US1] Update `packages/ui/src/components/Header.tsx` to be game-agnostic (remove sudoku-specific nav items)
- [x] T038 [US1] Export public API from `packages/ui/src/index.ts`: Header, Footer, Button, Modal, ThemeProvider, useTheme, useDarkMode
- [x] T039 [P] [US1] Move party management components from `apps/sudoku/src/components/` to `packages/template/src/components/`: PartyList, PartyDetails, InvitationForm, SessionList
- [x] T040 [P] [US1] Move party/session hooks from `apps/sudoku/src/hooks/` to `packages/template/src/hooks/`: useParty, useMembership, useSession, useInvitations
- [x] T041 [P] [US1] Move party/session providers from `apps/sudoku/src/providers/` to `packages/template/src/providers/`: PartyProvider
- [x] T042 [P] [US1] Move party/session services from `apps/sudoku/src/services/` to `packages/template/src/services/`: partyService, membershipService
- [x] T043 [US1] Ensure all types in `packages/template/` are game-agnostic (Party, Session, PartyMember use generics, not Sudoku-specific)
- [x] T044 [US1] Export public API from `packages/template/src/index.ts`: PartyProvider, useParty, useMembership, useSession hooks, types, re-exports from auth and ui packages
- [x] T045 [US1] Update `apps/template/src/layout.tsx` to wrap application with providers: AuthProvider, ThemeProvider, PartyProvider from new packages
- [x] T046 [US1] Update `apps/template/package.json` to import from new packages: `@bubblyclouds-app/auth`, `@bubblyclouds-app/ui`, `@bubblyclouds-app/template`
- [x] T047 [US1] Update all imports in `apps/template/src/` from local paths to package aliases (e.g., `import { useAuth } from '@bubblyclouds-app/auth'`)
- [x] T048 [US1] Remove old auth components/hooks/providers from `apps/template/src/` that are now in packages
- [x] T049 [US1] Create/update pages in `apps/template/src/app/`: profile page, sessions page, parties page, invitation management
- [x] T050 [US1] Update `apps/template/src/app/page.tsx` to show authenticated user interface (no sudoku game)
- [x] T051 [US1] Verify `apps/template` builds with zero errors: `npm run build -w apps/template`
- [x] T052 [US1] Search `apps/template` for game references - verify zero results: `grep -r "sudoku\|puzzle\|game\|cell\|grid" apps/template/src --include="*.ts" --include="*.tsx" --include="*.js"`
- [x] T053 [US1] Search `packages/template/src` for game references - verify zero results (ensure template package is game-agnostic)
- [x] T054 [US1] Run all tests for template app: `npm test -w apps/template` - should pass or have no test failures
- [x] T055 [US1] Run all tests for new packages: `npm test -w @bubblyclouds-app/auth && npm test -w @bubblyclouds-app/ui && npm test -w @bubblyclouds-app/template`
- [x] T056 [US1] Update root test script to verify template app tests pass: `npm test` should include all new packages
- [x] T057 [US1] Verify TypeScript strict mode passes for all new packages and template app

**Checkpoint**: User Story 1 complete - Template app is standalone, fully functional, with zero sudoku references

---

## Phase 4: User Story 2 - Sudoku App Extends Template (Priority: P1)

**Goal**: Sudoku app builds successfully using template foundation while adding game-specific functionality

**Independent Test**: `npm run build -w apps/sudoku` → App runs with same header/footer/theme as template, user auth works, party management works, sudoku game renders

### Implementation for User Story 2

- [x] T058 [P] [US2] Move sudoku components from `apps/sudoku/src/components/` to `packages/sudoku/src/components/`: SudokuGrid, SudokuBox, NumberPad, RaceTrack, Timer, TrafficLight (game-specific only)
- [x] T058 [P] [US2] Move sudoku helpers from `apps/sudoku/src/helpers/` to `packages/sudoku/src/helpers/`: sudoku algorithms (solve, validate, generate, checkAnswer, etc.)
- [x] T058 [P] [US2] Move sudoku utilities from `apps/sudoku/src/utils/` to `packages/sudoku/src/utils/`: puzzle utils, cell calculations (including splitCellId if sudoku-specific)
- [x] T058 [P] [US2] Move sudoku hooks from `apps/sudoku/src/hooks/` to `packages/sudoku/src/hooks/`: useTimer, useSudokuState, useDrag (game-specific hooks only)
- [x] T059 [P] [US2] Export public API from `packages/sudoku/src/index.ts`: SudokuGrid, RaceTrack, useTimer hooks, types (Cell, SudokuGrid, SudokuState), helpers
- [x] T059 [P] [US2] Update `apps/sudoku/package.json` to import from new packages: `@bubblyclouds-app/auth`, `@bubblyclouds-app/ui`, `@bubblyclouds-app/sudoku`, `@bubblyclouds-app/template`
- [x] T059 [P] [US2] Update all imports in `apps/sudoku/src/` from local paths to package aliases
- [x] T059 [P] [US2] Remove game-specific components/hooks from `apps/sudoku/src/` that are now in `@bubblyclouds-app/sudoku` package
- [x] T059 [P] [US2] Update `apps/sudoku/src/layout.tsx` to use same providers as template app (AuthProvider, ThemeProvider, PartyProvider) from packages
- [x] T059 [P] [US2] Verify header and footer in sudoku app match template app (should import from `@bubblyclouds-app/ui`)
- [x] T059 [P] [US2] Update sudoku game pages to use components from `@bubblyclouds-app/sudoku` package
- [x] T059 [P] [US2] Create or update racing page in `apps/sudoku/src/app/` to use party functionality from template package and game logic from sudoku package
- [x] T059 [P] [US2] Verify `apps/sudoku` builds with zero errors: `npm run build -w apps/sudoku`
- [x] T059 [P] [US2] Verify both apps run with consistent header/footer styling: `npm run dev -w apps/template &  npm run dev -w apps/sudoku`
- [x] T059 [P] [US2] Verify user context is consistent between apps (log in one, check other is logged in too if same session)
- [x] T059 [P] [US2] Run all tests for sudoku app: `npm test -w apps/sudoku` - should pass
- [x] T059 [P] [US2] Verify new package tests still pass: `npm test` should show all packages passing

**Checkpoint**: User Story 2 complete - Sudoku app extends template successfully with shared styling and auth

---

## Phase 5: User Story 3 - Clear Package Organization (Priority: P1)

**Goal**: Architecture is clearly organized with no circular dependencies and obvious package responsibilities

**Independent Test**: `grep -r "sudoku\|puzzle\|game\|cell" packages/shared packages/types packages/auth packages/ui packages/template` returns no results. `npm run build` succeeds. Each package has README explaining its purpose.

### Implementation for User Story 3

- [x] T075 [P] [US3] Create comprehensive `README.md` in `packages/auth/` documenting: purpose, public API, components, hooks, types, integration guide, examples
- [x] T076 [P] [US3] Create comprehensive `README.md` in `packages/ui/` documenting: purpose, public API, components, styling, theming, integration guide
- [x] T077 [P] [US3] Create comprehensive `README.md` in `packages/template/` documenting: purpose, party/session management, public API, components, hooks, integration guide
- [x] T078 [P] [US3] Create comprehensive `README.md` in `packages/sudoku/` documenting: purpose, game logic, components, types, integration guide
- [x] T079 [P] [US3] Create `ARCHITECTURE.md` in repo root documenting: package organization, dependency graph, design decisions, how to create new apps
- [x] T080 [US3] Add inline documentation/JSDoc comments to all public exports in each package's `index.ts`
- [x] T081 [P] [US3] Verify zero sudoku references in `packages/shared/src/`: search for "sudoku\|puzzle\|game\|cell\|grid" - should return zero
- [x] T082 [P] [US3] Verify zero sudoku references in `packages/types/src/`: search for "sudoku\|puzzle\|game\|cell\|grid" - should return zero
- [x] T083 [P] [US3] Verify zero sudoku references in `packages/auth/src/`: search for "sudoku\|puzzle\|game" - should return zero
- [x] T084 [P] [US3] Verify zero sudoku references in `packages/ui/src/`: search for "sudoku\|puzzle\|game" - should return zero
- [x] T085 [P] [US3] Verify zero sudoku references in `packages/template/src/`: search for "sudoku\|puzzle" (ok for cell/grid in generic contexts) - document exceptions if any
- [x] T086 [US3] Create dependency graph diagram and document in ARCHITECTURE.md showing relationships between packages
- [x] T087 [P] [US3] Verify no circular dependencies: `npm run build 2>&1 | grep -i "circular"` should return empty
- [x] T088 [US3] Create MIGRATION.md documenting how imports changed from v1.x to v2.0.0 with before/after examples
- [x] T089 [US3] Add architecture diagram to main README.md showing package relationships and app composition
- [x] T090 [US3] Verify all packages have explicit exports in `index.ts` and document the public API contract in comments
- [x] T091 [US3] Verify TypeScript path aliases work correctly: `npx tsc --noEmit` should pass for all files using path aliases
- [x] T092 [US3] Run full test suite: `npm test` - all tests should pass, verify 100% pass rate

**Checkpoint**: Architecture is clearly organized and understandable. Package responsibilities are obvious.

---

## Phase 6: User Story 4 - Extract Sudoku Logic from Shared Packages (Priority: P2)

**Goal**: Remove all sudoku-specific code from shared/core packages; ensure shared packages are truly generic

**Independent Test**: Grep shared and types packages for sudoku references returns zero. Shared package can be imported into non-sudoku applications.

### Implementation for User Story 4

- [x] T093 [P] [US4] Search `packages/shared/src/helpers/` for sudoku-specific logic (splitCellId, sudoku algorithms) and move to `packages/sudoku/src/helpers/`
- [x] T094 [P] [US4] Search `packages/shared/src/utils/` for sudoku-specific utilities and move to `packages/sudoku/src/utils/`
- [x] T095 [P] [US4] Verify generic utilities remain in shared: calculateSeconds, formatSeconds, date utilities, string utilities
- [x] T096 [P] [US4] Search `packages/types/src/` for sudoku-specific type definitions: Cell, Grid, Puzzle, SudokuState - move to `packages/sudoku/src/types/`
- [x] T097 [P] [US4] Verify generic types remain in types package: User, Session<T>, Party, PartyMember, AuthToken - these use generics for flexibility
- [x] T098 [US4] Update imports in `packages/sudoku/` to import moved types and utilities
- [x] T099 [US4] Update imports in any other packages that referenced sudoku types (should now import from @bubblyclouds-app/sudoku)
- [x] T100 [P] [US4] Update `packages/shared/src/index.ts` to export only generic utilities (no sudoku references)
- [x] T101 [P] [US4] Update `packages/types/src/index.ts` to export only generic types (no sudoku references)
- [x] T102 [P] [US4] Verify `packages/sudoku/src/index.ts` exports all moved sudoku-specific utilities and types
- [x] T103 [US4] Run full test suite: `npm test` - all tests should still pass (only imports changed, not logic)
- [x] T104 [US4] Verify no package has circular dependencies after moves: `npm run build 2>&1 | grep -i "circular"`
- [x] T105 [US4] Verify shared and types packages can be used independently of sudoku package

**Checkpoint**: Shared packages are truly generic and reusable

---

## Phase 7: User Story 5 - Theme and UI Components Reusability (Priority: P2)

**Goal**: UI components and theme are fully extracted and both apps use identical styling

**Independent Test**: Visual inspection shows identical header/footer/buttons in both apps. Both apps use ThemeProvider from @bubblyclouds-app/ui. Changing theme in one package affects both apps.

### Implementation for User Story 5

- [x] T106 [P] [US5] Verify all theme configuration is in `packages/ui/src/styles/` (tailwind.config.js, theme utilities)
- [x] T107 [P] [US5] Move any remaining theme code from `apps/sudoku/src/styles/` to `packages/ui/src/styles/`
- [x] T108 [P] [US5] Move any remaining theme code from `apps/template/src/styles/` to `packages/ui/src/styles/`
- [x] T109 [US5] Update both app's `tailwind.config.js` to extend from shared UI package configuration
- [x] T110 [P] [US5] Extract Header component subparts if not already: navigation, user menu, logo (all in `packages/ui/src/components/Header/`)
- [x] T111 [P] [US5] Extract Footer component subparts: links, copyright, social icons (all in `packages/ui/src/components/Footer/`)
- [x] T112 [P] [US5] Verify both apps import Header and Footer from `@bubblyclouds-app/ui`
- [x] T113 [P] [US5] Create theme switching functionality in `packages/ui/src/hooks/useTheme.ts` if not already present
- [x] T114 [US5] Verify dark mode works identically in both apps (toggle in template app, check sudoku app)
- [x] T115 [US5] Add theme customization example to `packages/ui/README.md`
- [x] T116 [US5] Ensure all shared UI components have TypeScript types exported from `packages/ui/src/index.ts`
- [x] T117 [P] [US5] Run visual regression tests if available to ensure consistent rendering across both apps
- [x] T118 [US5] Document styling conventions in `packages/ui/README.md` (Tailwind utilities, custom classes)

**Checkpoint**: UI components and theme fully extracted and shared

---

## Phase 8: User Story 6 - Authentication Package Reusability (Priority: P2)

**Goal**: Auth package is fully extracted with identical auth flows in both apps

**Independent Test**: Both apps use AuthProvider from @bubblyclouds-app/auth. Logging in to one app shows as logged in on the other app (same session). Auth types are consistent.

### Implementation for User Story 6

- [x] T119 [P] [US6] Verify `packages/auth/src/components/` has all auth UI: LoginForm, RegisterForm, OAuthButton components
- [x] T120 [P] [US6] Verify `packages/auth/src/hooks/` has all auth hooks: useAuth, useSession, useUser
- [x] T121 [P] [US6] Verify `packages/auth/src/services/` has token management: tokenService, sessionService
- [x] T122 [US6] Ensure AuthProvider in `packages/auth/src/providers/AuthProvider.tsx` handles token refresh, session persistence, logout
- [x] T123 [P] [US6] Verify both apps' root layout wraps with AuthProvider from `@bubblyclouds-app/auth`
- [x] T124 [P] [US6] Verify both apps import useAuth and other hooks from `@bubblyclouds-app/auth`, not local files
- [x] T125 [US6] Test auth flow in template app: login → profile → logout
- [x] T126 [US6] Test auth flow in sudoku app: login → profile → logout
- [x] T127 [US6] Test session persistence: log in app, refresh page, verify still logged in
- [x] T128 [P] [US6] Test OAuth flow consistency: Google login in template app, verify works same way in sudoku app
- [x] T129 [P] [US6] Verify error handling is consistent: bad password, invalid email, token expired
- [x] T130 [US6] Update `packages/auth/README.md` with integration guide and examples for both template and sudoku apps
- [x] T131 [US6] Verify type safety: all auth types exported from `packages/auth/src/index.ts` and used in both apps
- [x] T132 [P] [US6] Run auth package tests: `npm test -w @bubblyclouds-app/auth` - all should pass
- [x] T133 [US6] Test cross-app session: log in template app, check sudoku app recognizes same user (if same origin)

**Checkpoint**: Auth package fully extracted and reusable across apps

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, documentation, and quality assurance

- [x] T134 [P] Update root `README.md` with architecture overview and quick start instructions
- [x] T135 [P] Update root `README.md` with links to each package's README
- [x] T136 [P] Create `QUICKSTART.md` at repo root (or link to `/specs/003-modular-turborepo-architecture/quickstart.md`)
- [x] T137 [P] Update CHANGELOG.md documenting major version change (v2.0.0) and refactoring
- [x] T138 Run complete test suite: `npm test` - verify 100% pass rate and >99% of tests passing (constitutional requirement)
- [x] T139 Run full build: `npm run build` - verify all packages and apps build successfully
- [x] T140 [P] Run linting: `npm run lint` - verify no errors or warnings
- [x] T141 [P] Run TypeScript check: `npx tsc --noEmit` - verify strict mode passes for all files
- [x] T142 Verify bundle sizes haven't increased: compare before/after for both apps
- [x] T143 [P] Update package.json version numbers to 2.0.0 for all packages that have breaking changes
- [x] T144 [P] Review import aliases in root `tsconfig.json` - ensure all match actual package names
- [x] T145 [P] Update `.github/workflows/` CI/CD pipelines if any to build and test all packages independently
- [x] T146 Create migration guide for any downstream packages or apps that depend on old structure
- [x] T147 [P] Run smoke tests: start both apps locally and verify basic functionality
  - Template: login, create party, invite user
  - Sudoku: login, play puzzle, create race, invite players
- [x] T148 Document known limitations or edge cases from Edge Cases section in spec.md
- [x] T149 [P] Create example app documentation for future app creators (how to use template + auth packages)
- [x] T150 [P] Review all public APIs one final time - ensure exports are clean and complete
- [x] T151 Final verification: search entire `packages/` directory for sudoku references - document any exceptions

**Checkpoint**: Refactoring complete, all quality gates passed, ready for production

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup → BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational completion
  - Can proceed in parallel (if team capacity allows)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Template Standalone - P1)**: No dependencies on other user stories, can proceed immediately after Foundational
- **US2 (Sudoku Extends Template - P1)**: Can run parallel with US1 after Foundational (US2 depends on US1 structure, but doesn't block US1)
- **US3 (Clear Organization - P1)**: Can run parallel with US1/US2, documents US1/US2 completion
- **US4 (Extract Sudoku Logic - P2)**: Can run after US1 complete (US1 establishes template first), or alongside US2/US3
- **US5 (UI Reusability - P2)**: Can run parallel with US4 (different concerns)
- **US6 (Auth Reusability - P2)**: Can run parallel with US4/US5 (different concerns)

### Within Each User Story

- Types extracted before components/services
- Components before exports
- All exports before testing
- US1 must complete before US2 can fully verify (dependency)

### Parallel Opportunities

**Phase 1 (Setup)** - All tasks marked [P] can run in parallel:
- Create all package directories simultaneously
- Initialize all package.json files simultaneously
- Copy all tsconfig.json simultaneously
- Create all directory structures simultaneously

**Phase 2 (Foundational)** - All tasks marked [P] can run in parallel:
- Extract all type definitions simultaneously
- Create all provider structures simultaneously
- Create all hooks/components directories simultaneously

**User Story Phase** - All tasks marked [P] can run in parallel within each story:
- **US1**: Move auth, UI, template code simultaneously
- **US2**: Move sudoku components, helpers, utils, hooks simultaneously
- **US3**: Create all README files and verify searches simultaneously

---

## Parallel Example: Phase 1 (Setup)

```bash
# Parallel task execution (can use GNU Parallel, xargs, or just multiple terminals):
# T002: Initialize auth package
# T003: Initialize ui package
# T004: Initialize sudoku package
# T005: Initialize template package
# These can all run simultaneously - different files/packages
```

---

## Parallel Example: User Story 1 (Template Standalone)

```bash
# Once Foundational (Phase 2) complete, start US1 tasks:
# T030: Move auth components (parallel)
# T031: Move auth hooks (parallel)
# T032: Move auth providers (parallel)
# T035: Move UI components (parallel)
# T036: Move theme/styling (parallel)
# T039: Move party components (parallel)
# T040: Move party hooks (parallel)
# T041: Move party providers (parallel)
# T042: Move party services (parallel)

# All [P] tasks can run simultaneously on different files
# Sequential tasks (T034, T038, T044) must wait for their dependencies
```

---

## MVP Scope

**Minimum Viable Product**: Complete Phase 1, Phase 2, and **User Story 1 only**

This delivers:
- ✅ Modular package structure
- ✅ Template app as standalone application
- ✅ Auth package extracted
- ✅ UI package extracted
- ✅ Zero sudoku references in template package

**Time estimate**: ~40-50 development hours for experienced developer

**After MVP**, additional user stories can be added incrementally (US2, US3, US4, US5, US6) based on priority and team capacity.

---

## Task Summary

- **Total Tasks**: 151
- **Setup Phase**: 15 tasks
- **Foundational Phase**: 14 tasks
- **User Story 1**: 28 tasks
- **User Story 2**: 17 tasks
- **User Story 3**: 18 tasks
- **User Story 4**: 13 tasks
- **User Story 5**: 13 tasks
- **User Story 6**: 15 tasks
- **Polish Phase**: 18 tasks

**Parallelizable Tasks**: 87 tasks marked [P] can run in parallel (different files, no blocking dependencies)

---

## Validation Checklist

Before starting implementation, verify:
- [ ] All packages have `src/` directory created
- [ ] All packages have `package.json` initialized
- [ ] All packages have `tsconfig.json` configured
- [ ] Root `tsconfig.json` has path aliases for all packages
- [ ] `npm install` runs without errors
- [ ] Root `jest.config.js` finds tests in all packages
- [ ] ESLint and TypeScript can scan all packages
- [ ] `npm run build` and `npm test` commands work for entire workspace

