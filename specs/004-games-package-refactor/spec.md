# Feature Specification: Games Package Refactoring

**Feature Branch**: `004-games-package-refactor`
**Created**: 2025-11-16
**Status**: Draft
**Input**: User description: "Move all apps/sudoku/src/components into the most relevant package. For example, Sudoku specific can go into the sudoku package, wheras Party specific can go in the template as that hosts the Parties provider. Ideally we'd keep leaderboard, activity widget generic rather than sudoku specific - however some parts of the sudoku package like TimerDisplay, TrafficLight, RaceTrack, NumberPad are also generic. It might be beneficial to create a games package and move all non-sudoku specific components, helpers, hooks out of the sudoku package and app into this new games package and keep sudoku package the host of sudoku specific parts. This is so we can add another app like wordsearch later."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Package Reorganization Foundation (Priority: P1)

As a developer building the next game (e.g., wordsearch), I need generic game components separated from sudoku-specific components so that I can reuse common functionality without importing sudoku-specific code.

**Why this priority**: This is the foundation that enables all future game development. Without proper package separation, new games would need to duplicate code or create tight coupling with sudoku-specific logic.

**Independent Test**: Can be fully tested by verifying all components are in their correct packages, imports resolve correctly, all tests pass, and the sudoku app still functions identically to before the refactor.

**Acceptance Scenarios**:

1. **Given** sudoku app components are scattered across app and packages, **When** refactoring is complete, **Then** all components are in their appropriate packages based on specificity (games, sudoku, template, or app)
2. **Given** the refactoring is complete, **When** running the sudoku app, **Then** all functionality works exactly as before with no regressions
3. **Given** the new games package exists, **When** creating a new game app, **Then** I can import generic components like TimerDisplay, RaceTrack, NumberPad without importing sudoku-specific code

---

### User Story 2 - Generic Game Components Available for Reuse (Priority: P2)

As a developer building a new competitive game application, I need access to generic game components (timers, race tracks, number pads, leaderboards) so that I can build consistent gaming experiences without reimplementing common functionality.

**Why this priority**: Enables code reuse for future games and ensures consistent UX patterns across all game applications.

**Independent Test**: Can be tested by creating a minimal test app that imports only from the games package and verifies all generic components render and function correctly.

**Acceptance Scenarios**:

1. **Given** I'm building a wordsearch app, **When** I need a timer display, **Then** I can import TimerDisplay from the games package without any sudoku dependencies
2. **Given** I'm building a competitive puzzle game, **When** I need racing/competition UI, **Then** I can import RaceTrack and TrafficLight from the games package
3. **Given** I'm building a game with numeric input, **When** I need number input, **Then** I can import NumberPad from the games package

---

### User Story 3 - Clean Package Boundaries (Priority: P3)

As a developer maintaining the codebase, I need clear package boundaries with no circular dependencies so that the build system remains fast and packages can be tested in isolation.

**Why this priority**: Maintains long-term codebase health and enables independent package versioning and testing.

**Independent Test**: Can be tested by verifying dependency graph shows no cycles, each package builds independently, and Turborepo cache remains valid.

**Acceptance Scenarios**:

1. **Given** the refactoring is complete, **When** analyzing package dependencies, **Then** no circular dependencies exist
2. **Given** a package is modified, **When** running the build, **Then** only dependent packages rebuild (Turborepo cache works correctly)
3. **Given** I want to test the games package, **When** running package tests, **Then** tests run without requiring sudoku or app dependencies

---

### Edge Cases

- What happens when a component is currently used in both sudoku-specific and generic contexts? (Requires analysis to determine which version to keep or if both are needed)
- How does the system handle components with mixed responsibilities (part generic, part sudoku-specific)? (May require splitting into separate components)
- What happens if imports break during the migration? (Comprehensive test suite will catch regressions)
- How do we ensure test files move with their components? (Test files must be migrated alongside component files)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create a new games package to host generic game components
- **FR-002**: System MUST move sudoku-specific components from apps/sudoku to packages/sudoku
- **FR-003**: System MUST move party-related components to packages/template (hosts Parties provider)
- **FR-004**: System MUST move generic game components (TimerDisplay, TrafficLight, RaceTrack, NumberPad, HintBox) to the new games package
- **FR-005**: System MUST move generic leaderboard and activity widget components to the games package
- **FR-006**: System MUST update all imports to reference new package locations using correct import conventions
- **FR-007**: System MUST move test files alongside their corresponding components
- **FR-008**: System MUST preserve all existing functionality with no user-facing changes
- **FR-009**: System MUST ensure no barrel exports (index.ts) are created
- **FR-010**: System MUST use relative imports within packages and package names across packages
- **FR-011**: System MUST configure package.json exports using Just-in-Time pattern for new/modified packages

### Package Scope *(if monorepo)*

- **Affected Packages**:
  - `@sudoku-web/sudoku` (will receive sudoku-specific components from app)
  - `@sudoku-web/template` (will receive party-related components)
  - `apps/sudoku` (will have components moved out to packages)

- **New Packages**:
  - `@sudoku-web/games` - Generic game components reusable across all competitive game applications (timers, race tracks, leaderboards, number pads, activity widgets, hint boxes)

- **Dependency Compliance**:
  - No apps → packages dependencies will be created
  - Games package will have no dependencies on sudoku package (only generic code)
  - Template package will not depend on games or sudoku packages
  - All package dependencies follow the constitutional hierarchy: apps → feature packages → core packages

- **Import Strategy**:
  - Relative imports within each package (e.g., `import { foo } from '../utils/foo'`)
  - Package name imports across packages (e.g., `import { TimerDisplay } from '@sudoku-web/games'`)
  - No barrel exports created (direct imports from source files)
  - Package.json exports field configured for each affected package

### Key Entities *(include if feature involves data)*

- **Component**: A React component file with its corresponding test file(s) and type definitions
- **Package**: A reusable module with defined boundaries and exported public API
- **Component Category**: Classification determining destination package (sudoku-specific, party-related, generic game, app-only)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All existing tests pass with 99%+ pass rate after refactoring
- **SC-002**: Build completes successfully with zero TypeScript errors
- **SC-003**: Sudoku application functionality is identical to pre-refactor state (no regressions)
- **SC-004**: New games package can be imported independently without sudoku dependencies
- **SC-005**: Package dependency graph contains zero circular dependencies
- **SC-006**: Turborepo build cache remains valid (no unnecessary cache invalidation)
- **SC-007**: All moved components maintain 80%+ test coverage in their new locations
- **SC-008**: Future wordsearch app (or similar) can be created using generic components from games package

## Assumptions

- Component categorization follows these rules:
  - **Sudoku-specific**: Components that reference sudoku game logic, grid manipulation, or puzzle-specific state
  - **Party-related**: Components that directly use Parties provider or party-specific state
  - **Generic game**: Components usable across multiple competitive games (timers, race tracks, leaderboards, number pads, hint boxes that accept children)
  - **App-only**: Components with app-specific routing, page layouts, or app-level concerns

- All components currently function correctly and have test coverage
- No breaking changes to public APIs (internal refactoring only)
- Package.json export configurations follow project standards
- Migration can be completed while maintaining a working application at each commit

## Component Categorization

Based on the current component inventory:

**To packages/sudoku (sudoku-specific):**
- Sudoku.tsx (main game component)
- SudokuControls.tsx (sudoku-specific controls)
- SudokuBox.tsx (already in sudoku package)
- SimpleSudoku.tsx (already in sudoku package)
- SudokuInput.tsx (from app - sudoku grid input)
- SudokuInputNotes.tsx (from app - sudoku notes)
- SudokuSidebar.tsx (sudoku-specific sidebar)
- BookCover.tsx (sudoku book specific)
- ScoringLegend.tsx (sudoku scoring)
- ScoreBreakdown.tsx (sudoku score)
- scoringUtils.ts (sudoku scoring logic)

**To packages/template (party-related):**
- PartyRow.tsx
- PartyInviteButton.tsx
- PartyConfirmationDialog.tsx
- FriendsTab.tsx
- MyPuzzlesTab.tsx
- IntegratedSessionRow.tsx

**To packages/games (generic game components):**
- TimerDisplay.tsx (from sudoku package - generic timer)
- TrafficLight.tsx (from sudoku package - generic race indicator)
- RaceTrack.tsx (from sudoku package - generic race visualization)
- NumberPad.tsx (from sudoku package - generic number input)
- Leaderboard.tsx (generic leaderboard)
- ActivityWidget.tsx (generic activity display)
- FriendLeaderboardEntry.tsx (generic leaderboard entry)
- SidebarButton.tsx (generic UI component)
- HintBox.tsx (generic hint container - accepts children)

**Remains in apps/sudoku (app-specific):**
- HeaderWrapper.tsx (app-level header composition)
- RacingPromptModal.tsx (app-level modal)
- SudokuPlusModal.tsx (app-level premium features)
