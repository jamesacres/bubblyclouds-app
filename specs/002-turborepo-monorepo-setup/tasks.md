# Tasks: Turborepo Monorepo Setup + Template Extraction

**Input**: Design documents from `/specs/002-turborepo-monorepo-setup/` and `/specs/001-template-extraction/`
**Prerequisites**: Both plan.md and spec.md files reviewed
**Status**: IN PROGRESS - Phases 1-6 largely complete, Phases 7-11 in progress
**Last Updated**: 2025-11-02
**Current Blocker**: Root `/src/` directory still exists (needs deletion), Jest imports need updating
**Context**: These features are interdependent. Feature 002 (Turborepo monorepo) must establish the structure, then feature 001 (Template extraction) leverages that structure. This task list executes them together in phases.

## Overview: Combined Implementation Strategy

**Why together?** Feature 001 depends on feature 002's monorepo structure. By doing them together:
- Feature 002 creates the `/apps/template/` and `/apps/sudoku/` workspace structure
- Feature 001 extracts generic code INTO that structure during the same effort
- Result: Single cohesive refactoring with monorepo governance enabled from day one
- Time savings: ~40% faster than sequential execution

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which feature/story this task belongs to (e.g., F002-US1, F001-US1)
- Include exact file paths in descriptions

---

## Phase 1: Setup & Workspace Initialization

**Purpose**: Initialize monorepo structure and establish workspace boundaries

**Duration**: ~1-2 hours | **Parallel**: Yes (setup tasks can run in parallel)

### Feature 002 (Turborepo) - US1: Configure Monorepo Structure

- [x] T001 [P] [F002-US1] Create Turborepo configuration file at `turbo.json` with workspace globs for `/apps/*` and `/packages/*`, task pipelines for build/dev/lint/test, and caching rules
- [x] T002 [P] [F002-US1] Update root `package.json` with workspace list (`"workspaces": ["apps/*", "packages/*"]`) and add Turborepo as dev dependency
- [x] T003 [P] [F002-US1] Create shared TypeScript configuration at root `tsconfig.json` with strict mode, path aliases for `@bubblyclouds-app/*` imports, and base configs for workspace inheritance
- [x] T004 [P] [F002-US1] Create workspace directory structure: `mkdir -p apps/template apps/sudoku packages/types packages/shared`
- [x] T005 [P] [F002-US1] Initialize `packages/types/package.json` as shared types package with `"name": "@bubblyclouds-app/types"` and TypeScript build configuration
- [x] T006 [P] [F002-US1] Initialize `packages/shared/package.json` as shared utilities package with `"name": "@bubblyclouds-app/shared"` and helper functions

**Checkpoint**: Monorepo structure ready, workspaces discoverable by npm and Turborepo

---

## Phase 2: Foundational Setup (Blocking for Both Features)

**Purpose**: Core infrastructure required before any feature extraction or refactoring can proceed

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Duration**: ~2-3 hours

### Feature 002 (Turborepo) - US1 & US2: Workspace Configuration & Boundaries

- [x] T007 [P] [F002-US1] Copy and adjust root `next.config.js` to support monorepo workspace resolution, ensuring both `/apps/template/` and `/apps/sudoku/` can be built as independent Next.js apps
- [x] T008 [P] [F002-US1] Copy and adjust ESLint configuration at root `eslint.config.js` with workspace-aware linting rules that enforce import boundaries (Sudoku can import from template, template cannot import from Sudoku)
- [x] T009 [P] [F002-US1] Set up Jest configuration at root `jest.config.js` with workspace-specific test patterns for parallel test execution across all workspaces
- [x] T010 [F002-US2] Create `.eslintrc` rules in root that enforce workspace dependency direction: add eslint-plugin-import rules to block template importing from sudoku apps (violation = build failure)
- [x] T011 [F002-US1] Copy `apps/sudoku/` entire source tree to create initial workspace shell, preserving all existing code (we'll refactor in next phases)
- [x] T012 [P] [F002-US1] Create `apps/sudoku/package.json` with `"name": "@bubblyclouds-app/sudoku"` and dependencies on `@bubblyclouds-app/types` and `@bubblyclouds-app/shared` via workspace protocol
- [x] T013 [P] [F002-US1] Create `apps/sudoku/tsconfig.json` extending root config with path aliases pointing to workspace packages
- [x] T014 [F002-US2] Create `apps/template/package.json` as placeholder with `"name": "@bubblyclouds-app/template"` (will be populated in feature 001)
- [x] T015 [F002-US2] Create `apps/template/tsconfig.json` extending root config

**Checkpoint**: Turborepo workspaces configured, ESLint boundary enforcement active, initial workspace structure in place

---

## Phase 3: Feature 002 (Turborepo) - User Story 1 & 2: Build & Test Workflow Setup

**Goal**: Establish efficient Turborepo build pipeline with caching and parallel execution

**Independent Test**: Developer can run `turbo run build` from root and see both template and sudoku apps build in parallel with caching enabled

**Duration**: ~2-3 hours

### Implementation

- [x] T016 [P] [F002-US1] Configure Turborepo task pipeline in `turbo.json`: define `build` task with inputs (src/, tsconfig.json, package.json) and outputs (.next/, dist/) for both apps
- [x] T017 [P] [F002-US1] Configure Turborepo task pipeline in `turbo.json`: define `dev` task with no caching (always run), enable `--parallel` flag for concurrent dev servers
- [x] T018 [P] [F002-US1] Configure Turborepo task pipeline in `turbo.json`: define `lint` task with workspace filtering, running across all workspaces
- [x] T019 [P] [F002-US1] Configure Turborepo task pipeline in `turbo.json`: define `test` task with workspace parallelization and coverage reporting
- [x] T020 [F002-US1] Create npm scripts in root `package.json`: `npm run build`, `npm run dev`, `npm run lint`, `npm run test`, `npm run build:sudoku`, `npm run dev:sudoku` with Turborepo filters
- [x] T021 [P] [F002-US1] Update `apps/sudoku/package.json` npm scripts: ensure `build`, `dev`, `lint`, `test` scripts reference correct locations (no breaking changes to existing scripts)
- [x] T022 [P] [F002-US1] Create `apps/template/package.json` npm scripts: placeholder `build`, `dev`, `lint`, `test` commands (will reference correct paths in phase 4)
- [ ] T023 [F002-US3] Test Turborepo build caching: run `npm run build` (should complete, save artifacts), then run again (should use cache and complete in <30 seconds) **NEEDS VERIFICATION**
- [ ] T024 [F002-US3] Test Turborepo parallel execution: verify that multiple workspaces build/lint/test simultaneously (check logs for concurrent execution) **NEEDS VERIFICATION**
- [x] T025 [P] [F002-US1] Update `.gitignore` to exclude Turborepo cache: add `.turbo/` directory

**Checkpoint**: Turborepo build pipeline working with caching enabled, <30 second cached builds verified

---

## Phase 3.5: Feature 002 (Turborepo) - Platform Build Configuration & Validation

**Goal**: Ensure Capacitor (iOS/Android) and Electron builds work correctly with the new monorepo structure

**Independent Test**: iOS, Android, and Electron builds complete successfully using the monorepo workspace structure without any path errors

**Duration**: ~3-4 hours | **Parallel**: Limited (platform builds depend on understanding of each platform's configuration)

⚠️ **CRITICAL**: Platform builds are external dependencies. This phase must be completed before final validation can occur.

### Capacitor Configuration (iOS & Android)

- [ ] T026 [F002-US3] Audit Capacitor configuration at `capacitor.config.ts`: verify it correctly references web app at `/apps/sudoku/` and any shared assets
- [ ] T027 [F002-US3] Update Capacitor `capacitor.config.ts`: adjust web root path from current structure to `apps/sudoku` to point to built Next.js output location
- [ ] T028 [F002-US3] Verify `capacitor.config.ts` build command: ensure it runs `npm run build --filter=@bubblyclouds-app/sudoku` to build only Sudoku workspace
- [ ] T029 [F002-US3] Test iOS build path resolution: verify Capacitor can locate `apps/sudoku/` and built web assets from monorepo structure
- [ ] T030 [P] [F002-US3] Update iOS native code if needed: check `ios/App/App/` for any hardcoded asset paths that reference old structure, update to work with `/apps/sudoku/`
- [ ] T031 [P] [F002-US3] Update Android native code if needed: check `android/app/src/` for any hardcoded asset paths, update to work with `/apps/sudoku/`
- [ ] T032 [F002-US3] Test Android build: run `npm run build:android` (or equivalent) and verify it correctly locates and bundles Sudoku app assets
- [ ] T033 [F002-US3] Test iOS build: run `npm run build:ios` (or equivalent) and verify it correctly locates and bundles Sudoku app assets
- [ ] T034 [P] [F002-US3] Update `.gitignore`: exclude platform build artifacts from monorepo (`ios/build/`, `android/build/`, etc.)

### Electron Configuration (Desktop)

- [ ] T035 [F002-US3] Audit Electron configuration at `electron/main.js` (or equivalent): verify it correctly references app at `/apps/sudoku/` and preload scripts
- [ ] T036 [F002-US3] Update Electron `main.js`: adjust `app.getAppPath()` and any path references to work with monorepo structure, ensure correct paths to `/apps/sudoku/`
- [ ] T037 [F002-US3] Verify Electron preload script: check `electron/preload.js` (if exists) for any hardcoded paths that need updating
- [ ] T038 [F002-US3] Update Electron build script in `electron/package.json`: ensure it runs `npm run build --filter=@bubblyclouds-app/sudoku` to build Sudoku workspace
- [ ] T039 [F002-US3] Update Electron dev script: ensure `npm run dev --filter=@bubblyclouds-app/sudoku` or equivalent runs Sudoku dev server correctly
- [ ] T040 [F002-US3] Test Electron build: run Electron build command and verify it correctly locates and bundles Sudoku web app
- [ ] T041 [F002-US3] Test Electron dev mode: run Electron dev mode and verify hot reload works with Sudoku app changes
- [ ] T042 [P] [F002-US3] Update `.gitignore`: exclude Electron build artifacts (`electron/dist/`, `electron/build/`, `.webpack/`, etc.)

### Shared Platform Configuration

- [ ] T043 [P] [F002-US3] Create platform build documentation at `docs/PLATFORM-BUILDS.md`: explain how Capacitor and Electron builds work with monorepo, how to build for each platform, troubleshooting
- [ ] T044 [F002-US3] Update npm scripts in root `package.json`: add platform build commands with Turborepo filters:
  - `npm run build:ios` → `turbo run build --filter=@bubblyclouds-app/sudoku && capacitor build ios`
  - `npm run build:android` → `turbo run build --filter=@bubblyclouds-app/sudoku && capacitor build android`
  - `npm run build:electron` → `turbo run build --filter=@bubblyclouds-app/sudoku && electron-builder`
- [ ] T045 [P] [F002-US3] Create CI/CD workflow for platform builds (if using GitHub Actions): update `.github/workflows/` to run platform builds with Turborepo caching
- [ ] T046 [F002-US3] Test full platform build chain: run `npm run build` → `npm run build:ios` to verify web build cascades correctly to platform builds

**Checkpoint**: All platform build configurations updated and tested, platform builds can be triggered from monorepo root with correct asset references

---

## Phase 4: Feature 001 (Template Extraction) - User Story 1 & 2: Code Audit & Organization

**Goal**: Identify generic vs Sudoku-specific code, establish extraction boundaries

**Duration**: ~3-4 hours | **Parallel**: Limited (requires understanding of codebase)

### Feature 001 - US1: Create Reusable Template Repository

#### Audit: Categorize Existing Code

- [ ] T047 [F001-US1] Audit `apps/sudoku/src/components/` directory: categorize each component as "generic" (Navigation, Profile, Settings, UserAvatar, ThemeToggle, Loading, Error) or "sudoku-specific" (GameBoard, SudokuGrid, SessionRow, PartyRow). Document results in `specs/001-template-extraction/audit-components.md`
- [ ] T048 [F001-US1] Audit `apps/sudoku/src/hooks/` directory: categorize each hook as "generic" (useAuth, useUser, useTheme, useSession, useParty, useError, useOnline) or "sudoku-specific" (usePuzzle, useGameState, useDailyPuzzle). Document in `specs/001-template-extraction/audit-hooks.md`
- [ ] T049 [F001-US1] Audit `apps/sudoku/src/services/` directory: categorize each service as "generic" (authService, userService, sessionService, partyService) or "sudoku-specific" (puzzleService, scoringService, dailyPuzzleService). Document in `specs/001-template-extraction/audit-services.md`
- [ ] T050 [F001-US1] Audit `apps/sudoku/src/types/` directory: categorize each type file as "generic" (User, Session, Party, Invite, Member) or "sudoku-specific" (Puzzle, GameState, ServerState). Document in `specs/001-template-extraction/audit-types.md`
- [ ] T051 [F001-US1] Audit `apps/sudoku/src/providers/` directory: categorize providers as "generic" (AuthProvider, UserProvider, ThemeProvider, SessionProvider, PartyProvider, ErrorProvider) or "sudoku-specific" (GameProvider). Document in `specs/001-template-extraction/audit-providers.md`
- [ ] T052 [F001-US1] Audit `apps/sudoku/src/utils/` directory: categorize utilities as "generic" (formatters, validators, storage helpers, constants) or "sudoku-specific" (puzzle solvers, scoring algorithms). Document in `specs/001-template-extraction/audit-utils.md`
- [ ] T053 [F001-US1] Create master extraction manifest at `specs/001-template-extraction/extraction-manifest.md` listing all files to move to template vs files to keep in sudoku, organized by directory

**Checkpoint**: Complete code audit performed, extraction boundaries clearly defined in documentation

---

## Phase 5: Feature 001 (Template Extraction) - User Story 1: Create Template Package Structure

**Goal**: Build template workspace with proper directory structure and configuration

**Duration**: ~2 hours | **Parallel**: Yes (directory creation and file copying can run in parallel)

### Initialize Template Package

- [x] T054 [P] [F001-US1] Create directory structure in `apps/template/src/`: `mkdir -p components hooks providers services types utils config lib`
- [x] T055 [P] [F001-US1] Create `apps/template/src/__mocks__/` directory for Jest mocks (Capacitor, RevenueCat, platform-specific code)
- [x] T056 [P] [F001-US1] Create `apps/template/tests/` directory with subdirectories: `unit/`, `integration/`, `contract/`
- [x] T057 [F001-US1] Create `apps/template/package.json` with dependencies: copy from sudoku app, adjust name to `"@bubblyclouds-app/template"`, remove sudoku-specific deps, add workspace dependencies to `@bubblyclouds-app/types` and `@bubblyclouds-app/shared`
- [x] T058 [F001-US1] Copy `apps/sudoku/tailwind.config.ts` to `apps/template/tailwind.config.ts` (shared Tailwind configuration)
- [x] T059 [F001-US1] Copy `apps/sudoku/next.config.js` to `apps/template/next.config.js` and adjust for monorepo workspace paths
- [x] T060 [F001-US1] Create `apps/template/tsconfig.json` extending root config with path aliases for template-local imports
- [x] T061 [P] [F001-US1] Create `apps/template/.eslintrc.json` extending root eslint config
- [x] T062 [P] [F001-US1] Create `apps/template/jest.config.js` with template-specific test configuration
- [x] T063 [P] [F001-US1] Create `apps/template/public/` directory for static assets (will be populated from sudoku)
- [x] T064 [P] [F001-US1] Create `apps/template/README.md` with description of template purpose, contents, and extension points

**Checkpoint**: Template workspace structure created, all configuration files in place, ready for code extraction

---

## Phase 6: Feature 001 (Template Extraction) - User Story 1 & 2: Extract Generic Code

**Goal**: Copy all generic code from Sudoku into template workspace, preserving tests and maintaining imports

**Duration**: ~4-5 hours | **Parallel**: Extensive (different files, no dependencies)

### Extract Generic Components

- [x] T065 [P] [F001-US1] Copy generic components from `apps/sudoku/src/components/Navigation*` to `apps/template/src/components/Navigation.tsx` (3-tab navigation structure)
- [x] T066 [P] [F001-US1] Copy generic components from `apps/sudoku/src/components/Profile*` to `apps/template/src/components/Profile.tsx`
- [x] T067 [P] [F001-US1] Copy generic components from `apps/sudoku/src/components/Settings*` to `apps/template/src/components/Settings.tsx`
- [x] T068 [P] [F001-US1] Copy generic components from `apps/sudoku/src/components/UserAvatar*` to `apps/template/src/components/UserAvatar.tsx`
- [x] T069 [P] [F001-US1] Copy generic components from `apps/sudoku/src/components/ThemeToggle*` to `apps/template/src/components/ThemeToggle.tsx`
- [x] T070 [P] [F001-US1] Copy generic components from `apps/sudoku/src/components/ErrorBoundary*` to `apps/template/src/components/ErrorBoundary.tsx`
- [x] T071 [P] [F001-US1] Copy generic loading and skeleton components from `apps/sudoku/src/components/` to `apps/template/src/components/Loading.tsx`, `Skeleton.tsx`, etc.
- [x] T072 [P] [F001-US1] Copy generic form components (Input, Button, Modal, etc.) from `apps/sudoku/src/components/` to `apps/template/src/components/`

### Extract Generic Hooks

- [x] T073 [P] [F001-US1] Copy `apps/sudoku/src/hooks/useAuth.ts` to `apps/template/src/hooks/useAuth.ts` - no changes needed
- [x] T074 [P] [F001-US1] Copy `apps/sudoku/src/hooks/useUser.ts` to `apps/template/src/hooks/useUser.ts`
- [x] T075 [P] [F001-US1] Copy `apps/sudoku/src/hooks/useTheme.ts` to `apps/template/src/hooks/useTheme.ts`
- [x] T076 [P] [F001-US1] Copy `apps/sudoku/src/hooks/useSession.ts` to `apps/template/src/hooks/useSession.ts` - ensure it's generic with TypeScript generics `useSession<T>()`
- [x] T077 [P] [F001-US1] Copy `apps/sudoku/src/hooks/useParty.ts` to `apps/template/src/hooks/useParty.ts` - ensure generic party management
- [x] T078 [P] [F001-US1] Copy `apps/sudoku/src/hooks/useError.ts` to `apps/template/src/hooks/useError.ts`
- [x] T079 [P] [F001-US1] Copy `apps/sudoku/src/hooks/useOnline.ts` to `apps/template/src/hooks/useOnline.ts` (online/offline detection)
- [x] T080 [P] [F001-US1] Copy other generic hooks (useFetch, useLocalStorage, etc.) to `apps/template/src/hooks/`

### Extract Generic Providers

- [x] T081 [P] [F001-US1] Copy `apps/sudoku/src/providers/AuthProvider.tsx` to `apps/template/src/providers/AuthProvider.tsx`
- [x] T082 [P] [F001-US1] Copy `apps/sudoku/src/providers/UserProvider.tsx` to `apps/template/src/providers/UserProvider.tsx`
- [x] T083 [P] [F001-US1] Copy `apps/sudoku/src/providers/ThemeProvider.tsx` to `apps/template/src/providers/ThemeProvider.tsx`
- [x] T084 [P] [F001-US1] Copy `apps/sudoku/src/providers/SessionProvider.tsx` to `apps/template/src/providers/SessionProvider.tsx`
- [x] T085 [P] [F001-US1] Copy `apps/sudoku/src/providers/PartyProvider.tsx` to `apps/template/src/providers/PartyProvider.tsx`
- [x] T086 [P] [F001-US1] Copy `apps/sudoku/src/providers/ErrorProvider.tsx` to `apps/template/src/providers/ErrorProvider.tsx`

### Extract Generic Services

- [x] T087 [P] [F001-US1] Copy `apps/sudoku/src/services/authService.ts` to `apps/template/src/services/authService.ts`
- [x] T088 [P] [F001-US1] Copy `apps/sudoku/src/services/userService.ts` to `apps/template/src/services/userService.ts`
- [x] T089 [P] [F001-US1] Copy `apps/sudoku/src/services/sessionService.ts` to `apps/template/src/services/sessionService.ts`
- [x] T090 [P] [F001-US1] Copy `apps/sudoku/src/services/partyService.ts` to `apps/template/src/services/partyService.ts`
- [x] T091 [P] [F001-US1] Copy API client configuration from `apps/sudoku/src/services/apiClient.ts` to `apps/template/src/services/apiClient.ts` - backend-agnostic

### Extract Generic Types

- [x] T092 [P] [F001-US1] Copy generic type definitions from `apps/sudoku/src/types/` to `apps/template/src/types/`: User, Session<T>, Party, Member, Invite
- [x] T093 [P] [F001-US1] Copy generic auth types to `apps/template/src/types/auth.ts`
- [x] T094 [P] [F001-US1] Copy generic session/party types to `apps/template/src/types/session.ts` and `party.ts`

### Extract Generic Utilities

- [x] T095 [P] [F001-US1] Copy generic utility functions to `apps/template/src/utils/`: formatting functions (formatDate, formatTime), validators, storage helpers
- [x] T096 [P] [F001-US1] Copy generic constants to `apps/template/src/config/constants.ts`
- [x] T097 [P] [F001-US1] Copy `apps/sudoku/src/lib/` generic helpers to `apps/template/src/lib/`

### Extract Configuration & Constants

- [x] T098 [P] [F001-US1] Copy environment configuration patterns to `apps/template/src/config/`
- [x] T099 [P] [F001-US1] Copy app configuration interfaces to `apps/template/src/config/appConfig.ts` for extensibility

### Extract Tests

- [x] T100 [P] [F001-US1] Copy generic component tests to `apps/template/tests/unit/components/`
- [x] T101 [P] [F001-US1] Copy generic hook tests to `apps/template/tests/unit/hooks/`
- [x] T102 [P] [F001-US1] Copy generic service tests to `apps/template/tests/unit/services/`
- [x] T103 [P] [F001-US1] Copy integration tests to `apps/template/tests/integration/`

### Create Template Barrel Exports

- [x] T104 [F001-US1] Create `apps/template/src/index.ts` barrel export file exporting all public hooks: `useAuth`, `useUser`, `useTheme`, `useSession`, `useParty`, `useError`, `useOnline`
- [x] T105 [F001-US1] Create `apps/template/src/components/index.ts` barrel export for all components: `Navigation`, `Profile`, `Settings`, `UserAvatar`, `ThemeToggle`, `ErrorBoundary`
- [x] T106 [F001-US1] Create `apps/template/src/providers/index.ts` barrel export for all providers
- [x] T107 [F001-US1] Create `apps/template/src/types/index.ts` barrel export for all type definitions
- [x] T108 [F001-US1] Create `apps/template/src/services/index.ts` barrel export for all services

**Checkpoint**: All generic code copied to template, barrel exports created, template is now a standalone package (not yet tested)

---

## ⚠️ **CRITICAL BLOCKER BEFORE PROCEEDING TO PHASE 7**

**Status**: ROOT `/src/` DIRECTORY STILL EXISTS - MUST DELETE FIRST
- The original `/src/` directory at repository root was copied to `/apps/sudoku/src/` but never deleted
- This creates code duplication and import path confusion
- `/src/` contains old imports (e.g., `@/providers/UserProvider`) that don't match new template paths
- **ACTION REQUIRED**: Delete root `/src/` directory before continuing with import path updates
- After deletion: Root should have only `/apps/`, `/packages/`, `/public/`, etc. - NO `/src/`

**Test failures caused by this blocker**:
- 33+ tests in sudoku failing due to module resolution errors
- Jest moduleNameMapper trying to resolve `@/` paths that no longer exist locally
- Test mocks importing from paths that have been moved to template

**Next steps after deleting /src/**:
1. Update Jest moduleNameMapper in apps/sudoku to resolve `@bubblyclouds-app/template` imports
2. Update all test mocks to import from `@bubblyclouds-app/template` instead of `@/`
3. Fix remaining import paths in sudoku app

---

## Phase 7: Feature 001 (Template Extraction) - User Story 1 & 2: Update Imports in Template

**Goal**: Fix import paths within template package to be self-referential and handle path aliases

**Duration**: ~2-3 hours | **Parallel**: Limited (requires import consistency)

### Refactor Template Internal Imports

- [ ] T109 [F001-US1] Update all component imports in `apps/template/src/components/` to reference other components and hooks using `@bubblyclouds-app/template` path prefix (e.g., `import { useAuth } from '@bubblyclouds-app/template'` or relative imports)
- [ ] T110 [F001-US1] Update all hook imports in `apps/template/src/hooks/` to reference services and types using appropriate paths
- [ ] T111 [F001-US1] Update all provider imports in `apps/template/src/providers/` to reference hooks and services correctly
- [ ] T112 [F001-US1] Update all service imports in `apps/template/src/services/` to reference types and utilities correctly
- [ ] T113 [F001-US1] Update all test imports in `apps/template/tests/` to reference template components, hooks, services with correct paths
- [ ] T114 [F001-US1] Verify template has zero imports from sudoku app (search for `sudoku/`, `apps/sudoku`, should find none)
- [ ] T115 [F001-US1] Update TypeScript path aliases in `apps/template/tsconfig.json` to point to template locations, ensuring `@bubblyclouds-app/*` aliases resolve correctly within template

**Checkpoint**: All template internal imports use correct paths, no circular dependencies, template builds successfully

---

## Phase 8: Feature 001 (Template Extraction) - User Story 3: Refactor Sudoku to Use Template

**Goal**: Wire Sudoku app to import generic code from template package instead of local copies

**Duration**: ~3-4 hours | **Parallel**: Limited (requires coordinated import updates)

### Configure Sudoku Workspace Dependencies

- [ ] T116 [F001-US3] Verify `apps/sudoku/package.json` already has workspace dependency on `@bubblyclouds-app/template` (added in phase 2)
- [ ] T117 [F001-US3] Verify `apps/sudoku/tsconfig.json` includes path alias `"@bubblyclouds-app/*": ["../template/src/*"]` for template imports
- [ ] T118 [F001-US3] Update `apps/sudoku/package.json` npm scripts if needed to ensure build/dev/lint/test work with template imports

### Refactor Sudoku Imports - Generic to Template

- [ ] T119 [F001-US3] Update imports in `apps/sudoku/src/` components: change `import { ... } from '@/components'` to `import { ... } from '@bubblyclouds-app/template/components'` for generic components (Navigation, Profile, Settings, etc.)
- [ ] T120 [F001-US3] Update imports in `apps/sudoku/src/` hooks: change `import { useAuth, useUser, useTheme, useSession, useParty } from '@/hooks'` to `import { useAuth, useUser, useTheme, useSession, useParty } from '@bubblyclouds-app/template'`
- [ ] T121 [F001-US3] Update imports in `apps/sudoku/src/` providers: change `import { AuthProvider, UserProvider, ... } from '@/providers'` to `import { AuthProvider, UserProvider, ... } from '@bubblyclouds-app/template/providers'`
- [ ] T122 [F001-US3] Update imports in `apps/sudoku/src/` services: change `import { authService, userService, ... } from '@/services'` to `import { authService, userService, ... } from '@bubblyclouds-app/template/services'` for generic services
- [ ] T123 [F001-US3] Update imports in `apps/sudoku/src/` types: change `import { User, Session, Party } from '@/types'` to `import { User, Session, Party } from '@bubblyclouds-app/template/types'` for generic types
- [ ] T124 [F001-US3] Update imports in `apps/sudoku/src/` utilities: change `import { ... } from '@/utils'` to `import { ... } from '@bubblyclouds-app/template'` for generic utilities

### Keep Sudoku-Specific Code Local

- [ ] T125 [F001-US3] Verify Sudoku-specific hooks (usePuzzle, useGameState, useDailyPuzzle) remain in `apps/sudoku/src/sudoku/hooks/` with imports from `@/sudoku/hooks`
- [ ] T126 [F001-US3] Verify Sudoku-specific components (GameBoard, SudokuGrid, SessionRow, PartyRow) remain in `apps/sudoku/src/sudoku/components/` with imports from `@/sudoku/components`
- [ ] T127 [F001-US3] Verify Sudoku-specific services (puzzleService, scoringService, dailyPuzzleService) remain in `apps/sudoku/src/sudoku/services/` with imports from `@/sudoku/services`
- [ ] T128 [F001-US3] Create `apps/sudoku/src/sudoku/hooks/index.ts` barrel export for Sudoku-specific hooks
- [ ] T129 [F001-US3] Create `apps/sudoku/src/sudoku/components/index.ts` barrel export for Sudoku-specific components
- [ ] T130 [F001-US3] Create `apps/sudoku/src/sudoku/services/index.ts` barrel export for Sudoku-specific services

### Remove Duplicated Code from Sudoku

- [ ] T131 [F001-US3] Delete duplicated generic components from `apps/sudoku/src/components/` (Navigation, Profile, Settings, UserAvatar, ThemeToggle, ErrorBoundary, Loading, etc.) - keep only Sudoku-specific components (GameBoard, SudokuGrid, SessionRow, etc.)
- [ ] T132 [F001-US3] Delete duplicated generic hooks from `apps/sudoku/src/hooks/` (useAuth, useUser, useTheme, useSession, useParty, useError, useOnline) - keep only Sudoku-specific hooks
- [ ] T133 [F001-US3] Delete duplicated generic providers from `apps/sudoku/src/providers/` - keep only Sudoku-specific providers if any
- [ ] T134 [F001-US3] Delete duplicated generic services from `apps/sudoku/src/services/` (authService, userService, sessionService, partyService) - keep only Sudoku-specific services
- [ ] T135 [F001-US3] Delete duplicated generic types from `apps/sudoku/src/types/` (User, Session, Party, Invite, Member) - keep only Sudoku-specific types
- [ ] T136 [F001-US3] Delete duplicated generic utilities from `apps/sudoku/src/utils/` and `/lib/` - keep only Sudoku-specific utilities
- [ ] T137 [F001-US3] Verify `apps/sudoku/src/` directory structure now has: `app/`, `sudoku/` (Sudoku-specific code), `lib/` (app-specific), `config/` (app config), no longer has generic components/hooks/services

### Update Sudoku Root Layout

- [ ] T138 [F001-US3] Update `apps/sudoku/src/app/layout.tsx` to wrap app with template providers: `<AuthProvider><UserProvider><ThemeProvider><SessionProvider>...</SessionProvider></ThemeProvider></UserProvider></AuthProvider>`

**Checkpoint**: Sudoku successfully imports from template, no duplicate code in Sudoku, structure reorganized with Sudoku-specific code in `/sudoku/` directory

---

## Phase 9: Feature 001 (Template Extraction) - Testing & Validation

**Goal**: Ensure both template and Sudoku work correctly after extraction, no regressions

**Duration**: ~3-4 hours | **Parallel**: Yes (tests can run in parallel)

### Test Template Package

- [ ] T139 [P] [F001-US1] Run template tests: `npm run test --filter=@bubblyclouds-app/template` - all tests should pass
- [ ] T140 [F001-US1] Build template package: `npm run build --filter=@bubblyclouds-app/template` - should complete successfully
- [ ] T141 [F001-US1] Verify template has zero Sudoku-specific code: grep for "sudoku", "puzzle", "game" in template/src - should find none
- [ ] T142 [F001-US1] Verify template exports are complete: import all public hooks/components in test file and verify no missing exports
- [ ] T143 [P] [F001-US1] Run template linting: `npm run lint --filter=@bubblyclouds-app/template` - should pass without workspace boundary violations

### Test Sudoku App Imports

- [ ] T144 [P] [F001-US3] Run Sudoku tests: `npm run test --filter=@bubblyclouds-app/sudoku` - existing tests should pass without regressions
- [ ] T145 [F001-US3] Build Sudoku app: `npm run build --filter=@bubblyclouds-app/sudoku` - should complete successfully
- [ ] T146 [P] [F001-US3] Run Sudoku linting: `npm run lint --filter=@bubblyclouds-app/sudoku` - should pass, including workspace boundary checks
- [ ] T147 [F001-US3] Verify Sudoku imports: check `apps/sudoku/src/` for any remaining duplicate imports of generic code - should only import from `@bubblyclouds-app/template`
- [ ] T148 [P] [F001-US3] Check for circular dependencies: `npm ls @bubblyclouds-app/template` should show clean hierarchy (sudoku → template, no reverse)

### Full Monorepo Validation

- [ ] T149 [F001-US1] Run all tests from root: `npm test` - entire test suite should pass (all 1987+ tests)
- [ ] T150 [F001-US1] Build all workspaces from root: `npm run build` - both template and sudoku should build successfully
- [ ] T151 [F001-US1] Run all linting from root: `npm run lint` - should pass workspace boundary enforcement
- [ ] T152 [F001-US3] Verify cached builds work: run `npm run build` twice - second run should complete in <30 seconds using cache
- [ ] T153 [P] [F001-US3] Build Sudoku for platforms: `npm run build:ios`, `npm run build:android`, `npm run build:electron` - all platform builds should succeed

### Feature Parity Validation

- [ ] T154 [F001-US3] Manual testing: start Sudoku dev server, verify authentication flow works (login, logout, session persistence)
- [ ] T155 [F001-US3] Manual testing: verify user profile display, theme switching (dark/light mode persistence)
- [ ] T156 [F001-US3] Manual testing: verify navigation tabs (Home, Sessions, Friends) work identically to pre-refactor
- [ ] T157 [F001-US3] Manual testing: verify daily puzzle system works (puzzle generation, timer, scoring, leaderboards)
- [ ] T158 [F001-US3] Manual testing: verify racing/party features work (create party, invite users, synchronize state)
- [ ] T159 [F001-US3] Manual testing: verify book system works (series selection, puzzle collections)
- [ ] T160 [P] [F001-US3] Bundle size comparison: verify build output size is same or smaller than pre-refactor (no increase from extraction)

**Checkpoint**: Template is fully functional standalone, Sudoku works identically to pre-refactor, all tests pass, no regressions

---

## Phase 10: Documentation & Cleanup

**Goal**: Document the new monorepo structure, update guides, ensure knowledge is captured

**Duration**: ~2-3 hours

### Documentation Updates

- [ ] T161 [P] [F002-US1] Create `quickstart.md` in root: guide for developer setup - clone repo, `npm install`, run dev/build commands using Turborepo
- [ ] T162 [P] [F001-US1] Update `specs/001-template-extraction/quickstart.md` with actual template API after extraction (copy generated content)
- [ ] T163 [P] [F001-US1] Create template usage guide: `apps/template/USAGE.md` with examples of how to extend template for new apps
- [ ] T164 [P] [F001-US1] Create workspace documentation: `docs/MONOREPO.md` explaining Turborepo structure, workspace boundaries, import rules
- [ ] T165 [P] [F002-US1] Document Turborepo best practices: `docs/TURBOREPO.md` with build caching strategy, task pipeline, CI/CD integration
- [ ] T166 [P] [F001-US3] Update main `README.md` with new monorepo structure, links to workspace documentation
- [ ] T167 [P] [F001-US3] Create migration guide: `docs/SUDOKU-REFACTOR.md` explaining what changed, why, and how to extend Sudoku features

### Code Cleanup

- [ ] T168 [F001-US1] Remove extraction audit documents from specs (cleanup: delete `specs/001-template-extraction/audit-*.md` files after using them)
- [ ] T169 [F001-US3] Remove extraction manifest from specs (cleanup: delete `specs/001-template-extraction/extraction-manifest.md`)
- [ ] T170 [P] [F002-US1] Update `.github/workflows/` CI/CD scripts to use Turborepo filters for conditional builds (if needed)
- [ ] T171 [P] [F002-US1] Update deployment scripts to reference correct workspace paths

### Final Validation

- [ ] T172 [F002-US1] Update agent context: run `./.specify/scripts/bash/update-agent-context.sh claude` to add Turborepo knowledge to Claude context for future features
- [ ] T173 [F002-US1] Update project CLAUDE.md: add Turborepo commands, monorepo structure, and workspace info to project guidelines
- [ ] T174 [P] [F001-US1] Run final code review: verify all code follows project style guidelines, no console.logs, proper error handling
- [ ] T175 [P] [F001-US3] Create `CHANGELOG.md` entry documenting: monorepo setup, template extraction, Sudoku refactoring, benefits, migration notes

**Checkpoint**: Documentation complete, project knowledge captured, ready for team handoff

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, optimization, and knowledge sharing

**Duration**: ~1-2 hours

- [ ] T176 [P] Verify all workspace paths in documentation are correct and match actual structure
- [ ] T177 [P] Test onboarding: have a team member clone repo and follow `quickstart.md` - verify they can build and run both apps without issues
- [ ] T178 Create git tags: `turborepo-setup-complete` and `template-extraction-complete` for future reference
- [ ] T179 [P] Archive old branch structures: if there were separate template/sudoku repos, document cleanup plan
- [ ] T180 Communicate to team: send announcement of new monorepo structure, workspace organization, how to use Turborepo commands
- [ ] T181 Run final full test suite: `npm test` - ensure 100% pass rate and coverage maintained

**Checkpoint**: Features 002 (Turborepo) and 001 (Template Extraction) are complete and fully integrated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion - BLOCKS all feature work
- **Phase 3 (Turborepo Build Setup)**: Depends on Phase 2 completion
- **Phase 4 (Code Audit)**: Depends on Phase 3 completion (Turborepo workspace structure must exist)
- **Phase 5 (Template Structure)**: Depends on Phase 4 completion
- **Phase 6 (Extract Code)**: Depends on Phase 5 completion
- **Phase 7 (Update Template Imports)**: Depends on Phase 6 completion
- **Phase 8 (Refactor Sudoku)**: Depends on Phase 7 completion
- **Phase 9 (Testing & Validation)**: Depends on Phase 8 completion (can start partial validation earlier)
- **Phase 10 (Documentation)**: Depends on Phase 9 completion
- **Phase 11 (Polish)**: Depends on Phase 10 completion

### Critical Path

1. Phase 1 → Phase 2 (must complete before feature work starts)
2. Phase 2 → Phase 3 (Turborepo pipeline setup)
3. Phase 3 → Phase 4 (code audit with workspace structure in place)
4. Phase 4 → Phase 5 → Phase 6 (template structure and code extraction)
5. Phase 6 → Phase 7 (fix template imports)
6. Phase 7 → Phase 8 (Sudoku refactoring)
7. Phase 8 → Phase 9 (validation and testing)
8. Phase 9 → Phase 10 → Phase 11 (documentation and polish)

### Parallelization Within Phases

- **Phase 1**: All setup tasks [P] can run in parallel
- **Phase 2**: All foundational tasks [P] can run in parallel
- **Phase 3**: All Turborepo config tasks [P] can run in parallel
- **Phase 6 (Extraction)**: Most extraction tasks [P] can run in parallel (different files being copied)
- **Phase 9 (Testing)**: All tests [P] can run in parallel

### Team Execution Strategy (If Available)

**With 2 developers**:
1. Both: Phases 1-2 (setup & foundational)
2. Both: Phase 3 (Turborepo pipeline)
3. Dev A: Phase 4-7 (audit, template structure, extract code)
4. Both: Phase 8 (Sudoku refactoring - coordinate to avoid conflicts)
5. Both: Phase 9-11 (testing, documentation, cleanup)

**With 1 developer**:
- Execute sequentially: Phase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11
- Within-phase parallelization not necessary, just complete tasks sequentially

---

## Implementation Strategy

### MVP First (Recommended)

1. **Complete Phases 1-2**: Monorepo setup complete, workspaces initialized (4-5 hours)
2. **Complete Phase 3**: Turborepo build pipeline working (2-3 hours)
3. **Complete Phase 3.5**: Platform build configuration & validation (3-4 hours) **[CRITICAL: Tests iOS, Android, Electron builds]**
4. **Complete Phases 4-7**: Template extraction complete (12-15 hours)
5. **Complete Phase 8**: Sudoku refactored to use template (3-4 hours)
6. **STOP and VALIDATE**: Run full test suite, manual testing confirms feature parity, platform builds verified
7. **If all tests pass**: Commit to main branch, announce completion
8. **Complete Phases 9-11**: Documentation and knowledge capture (4-5 hours)

**Total timeline**: 28-38 hours for complete monorepo setup + template extraction + platform validation

### Incremental Delivery

- **Milestone 1 (Day 1)**: Phases 1-3 complete - monorepo structure working with Turborepo
- **Milestone 2 (Day 1.5)**: Phase 3.5 complete - platform builds (iOS, Android, Electron) validated and working
- **Milestone 3 (Day 2)**: Phases 4-7 complete - template extracted and configured
- **Milestone 4 (Day 3)**: Phase 8 complete - Sudoku refactored, all tests passing
- **Milestone 5 (Day 4)**: Phases 9-11 complete - documentation and cleanup done

Each milestone is independently deployable and represents measurable progress.

---

## Success Criteria Checklist

### Feature 002 (Turborepo) Success

- ✅ `turbo.json` configured with workspaces and task pipelines
- ✅ `/apps/template/` and `/apps/sudoku/` workspaces exist with independent `package.json`
- ✅ `npm run build` builds both workspaces in parallel
- ✅ Subsequent `npm run build` uses cache, completes in <30 seconds
- ✅ ESLint enforces workspace boundaries (template ≠ sudoku imports)
- ✅ All existing tests pass (1987+ tests)
- ✅ All workspaces build successfully for all platforms (web, iOS via Capacitor, Android via Capacitor, Electron)
- ✅ Platform-specific builds (iOS, Android, Electron) work with monorepo structure
- ✅ Capacitor and Electron configurations correctly reference new workspace paths
- ✅ CI/CD workflows updated to use Turborepo filters for platform builds

### Feature 001 (Template Extraction) Success

- ✅ Template package contains 0 Sudoku-specific code or references
- ✅ Template is standalone and can be used by other apps
- ✅ Sudoku imports generic code from template, not duplicated locally
- ✅ Sudoku-specific code isolated in `src/sudoku/` directory
- ✅ All existing tests pass (no regressions)
- ✅ All platform builds work identically to pre-refactor
- ✅ Bundle size unchanged or smaller
- ✅ Documentation updated with template usage examples

---

## Task Summary

- **Total Tasks**: 181
- **Setup & Foundational**: T001-T015 (15 tasks)
- **Turborepo Configuration**: T016-T025 (10 tasks)
- **Platform Build Configuration**: T026-T046 (21 tasks) **[NEW: Capacitor & Electron]** **[Parallelizable where possible]**
- **Code Audit**: T047-T053 (7 tasks)
- **Template Structure**: T054-T064 (11 tasks)
- **Code Extraction**: T065-T108 (44 tasks) **[Highly parallelizable - ~30 tasks can run in parallel]**
- **Import Refactoring**: T109-T115 (7 tasks)
- **Sudoku Refactoring**: T116-T138 (23 tasks)
- **Testing & Validation**: T139-T160 (22 tasks)
- **Documentation & Cleanup**: T161-T175 (15 tasks)
- **Polish**: T176-T181 (6 tasks)

**Estimated Time**: 28-38 hours (single developer, sequential execution)
**Parallelization Potential**: 45% time savings with team of 2-3 developers
**Platform Build Time**: +3-4 hours added for Capacitor and Electron validation

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific feature/story (F002-US1, F001-US1, etc.)
- Each feature story should be independently completable and testable
- Verify each checkpoint before proceeding to next phase
- Commit after each phase completion for easy rollback if needed
- Run `npm test && npm run lint` after each phase to catch issues early
- Document any deviations from this plan for future reference
