# Tasks: Games Package Refactoring

**Input**: Design documents from `/specs/004-games-package-refactor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests already exist for all components. This is a refactoring task, so test files will be moved alongside components.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Turborepo monorepo**: `packages/[package-name]/src/`, `apps/[app-name]/src/`

## Monorepo-Specific Considerations
For turborepo projects, ensure:
- Tasks respect package boundaries (no apps imported by packages)
- Import conventions followed (relative within package, package names across packages)
- No barrel exports (index.ts files) created
- Package.json exports configured with Just-in-Time pattern
- Prefer dependency injection over tight package coupling

## Phase 1: Setup (Package Infrastructure)

**Purpose**: Create the games package structure and configuration

- [ ] T001 Create games package directory structure at packages/games/
- [ ] T002 [P] Create package.json for @bubblyclouds-app/games with Just-in-Time exports pattern
- [ ] T003 [P] Create tsconfig.json for games package (extend root config)
- [ ] T004 [P] Create jest.config.js for games package
- [ ] T005 [P] Create packages/games/src/components/ directory
- [ ] T006 [P] Create packages/games/src/types/ directory
- [ ] T007 Create packages/games/README.md with package documentation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update Turborepo configuration to recognize new package

**⚠️ CRITICAL**: This phase must be complete before any component migrations

- [ ] T008 Update root package.json workspaces to include packages/games
- [ ] T009 Update turbo.json to include games package in build pipeline
- [ ] T010 Run npm install to link new games package

**Checkpoint**: Foundation ready - component migration can now begin

---

## Phase 3: User Story 1 - Package Reorganization Foundation (Priority: P1) 🎯 MVP

**Goal**: Create clean package boundaries by moving all components to their appropriate packages

**Independent Test**: All components in correct packages, all imports resolve, all tests pass, sudoku app functions identically

### Implementation for User Story 1

#### Step 1: Move Generic Game Components to @bubblyclouds-app/games

- [ ] T011 [P] [US1] Move packages/sudoku/src/components/TimerDisplay.tsx to packages/games/src/components/TimerDisplay.tsx
- [ ] T012 [P] [US1] Move packages/sudoku/src/components/TimerDisplay.test.tsx to packages/games/src/components/TimerDisplay.test.tsx
- [ ] T013 [P] [US1] Move packages/sudoku/src/components/RaceTrack.tsx to packages/games/src/components/RaceTrack.tsx
- [ ] T014 [P] [US1] Move packages/sudoku/src/components/RaceTrack.test.tsx to packages/games/src/components/RaceTrack.test.tsx
- [ ] T015 [P] [US1] Move packages/sudoku/src/components/TrafficLight.tsx to packages/games/src/components/TrafficLight.tsx
- [ ] T016 [P] [US1] Move packages/sudoku/src/components/TrafficLight.test.tsx to packages/games/src/components/TrafficLight.test.tsx
- [ ] T017 [P] [US1] Move packages/sudoku/src/components/NumberPad.tsx to packages/games/src/components/NumberPad.tsx
- [ ] T018 [P] [US1] Move packages/sudoku/src/components/NumberPad.test.tsx to packages/games/src/components/NumberPad.test.tsx
- [ ] T019 [P] [US1] Move apps/sudoku/src/components/Leaderboard.tsx to packages/games/src/components/Leaderboard.tsx
- [ ] T020 [P] [US1] Move apps/sudoku/src/components/Leaderboard.test.tsx to packages/games/src/components/Leaderboard.test.tsx
- [ ] T021 [P] [US1] Move apps/sudoku/src/components/ActivityWidget.tsx to packages/games/src/components/ActivityWidget.tsx
- [ ] T022 [P] [US1] Move apps/sudoku/src/components/ActivityWidget.test.tsx to packages/games/src/components/ActivityWidget.test.tsx
- [ ] T023 [P] [US1] Move apps/sudoku/src/components/FriendLeaderboardEntry.tsx to packages/games/src/components/FriendLeaderboardEntry.tsx
- [ ] T024 [P] [US1] Move apps/sudoku/src/components/FriendLeaderboardEntry.test.tsx to packages/games/src/components/FriendLeaderboardEntry.test.tsx
- [ ] T025 [P] [US1] Move apps/sudoku/src/components/SidebarButton.tsx to packages/games/src/components/SidebarButton.tsx
- [ ] T026 [P] [US1] Move apps/sudoku/src/components/SidebarButton.test.tsx to packages/games/src/components/SidebarButton.test.tsx
- [ ] T027 [P] [US1] Move apps/sudoku/src/components/HintBox.tsx to packages/games/src/components/HintBox.tsx
- [ ] T028 [P] [US1] Move apps/sudoku/src/components/HintBox.test.tsx to packages/games/src/components/HintBox.test.tsx

#### Step 2: Update package.json exports for @bubblyclouds-app/games

- [ ] T029 [US1] Update packages/games/package.json exports field with all 9 component paths using Just-in-Time pattern

#### Step 3: Update all imports for games package components

- [ ] T030 [US1] Find all imports of TimerDisplay and update to @bubblyclouds-app/games/components/TimerDisplay
- [ ] T031 [US1] Find all imports of RaceTrack and update to @bubblyclouds-app/games/components/RaceTrack
- [ ] T032 [US1] Find all imports of TrafficLight and update to @bubblyclouds-app/games/components/TrafficLight
- [ ] T033 [US1] Find all imports of NumberPad and update to @bubblyclouds-app/games/components/NumberPad
- [ ] T034 [US1] Find all imports of Leaderboard and update to @bubblyclouds-app/games/components/Leaderboard
- [ ] T035 [US1] Find all imports of ActivityWidget and update to @bubblyclouds-app/games/components/ActivityWidget
- [ ] T036 [US1] Find all imports of FriendLeaderboardEntry and update to @bubblyclouds-app/games/components/FriendLeaderboardEntry
- [ ] T037 [US1] Find all imports of SidebarButton and update to @bubblyclouds-app/games/components/SidebarButton
- [ ] T038 [US1] Find all imports of HintBox and update to @bubblyclouds-app/games/components/HintBox

#### Step 4: Move Sudoku-Specific Components to @bubblyclouds-app/sudoku

- [ ] T039 [P] [US1] Move apps/sudoku/src/components/Sudoku.tsx to packages/sudoku/src/components/Sudoku.tsx
- [ ] T040 [P] [US1] Move apps/sudoku/src/components/Sudoku.test.tsx to packages/sudoku/src/components/Sudoku.test.tsx
- [ ] T041 [P] [US1] Move apps/sudoku/src/components/SudokuControls.tsx to packages/sudoku/src/components/SudokuControls.tsx
- [ ] T042 [P] [US1] Move apps/sudoku/src/components/SudokuControls.test.tsx to packages/sudoku/src/components/SudokuControls.test.tsx
- [ ] T043 [P] [US1] Move apps/sudoku/src/components/SudokuInput.tsx to packages/sudoku/src/components/SudokuInput.tsx
- [ ] T044 [P] [US1] Move apps/sudoku/src/components/SudokuInput.test.tsx to packages/sudoku/src/components/SudokuInput.test.tsx
- [ ] T045 [P] [US1] Move apps/sudoku/src/components/SudokuInputNotes.tsx to packages/sudoku/src/components/SudokuInputNotes.tsx
- [ ] T046 [P] [US1] Move apps/sudoku/src/components/SudokuInputNotes.test.tsx to packages/sudoku/src/components/SudokuInputNotes.test.tsx
- [ ] T047 [P] [US1] Move apps/sudoku/src/components/SudokuSidebar.tsx to packages/sudoku/src/components/SudokuSidebar.tsx
- [ ] T048 [P] [US1] Move apps/sudoku/src/components/SudokuSidebar.test.tsx to packages/sudoku/src/components/SudokuSidebar.test.tsx
- [ ] T049 [P] [US1] Move apps/sudoku/src/components/BookCover.tsx to packages/sudoku/src/components/BookCover.tsx
- [ ] T050 [P] [US1] Move apps/sudoku/src/components/BookCover.test.tsx to packages/sudoku/src/components/BookCover.test.tsx
- [ ] T051 [P] [US1] Move apps/sudoku/src/components/ScoringLegend.tsx to packages/sudoku/src/components/ScoringLegend.tsx
- [ ] T052 [P] [US1] Move apps/sudoku/src/components/ScoringLegend.test.tsx to packages/sudoku/src/components/ScoringLegend.test.tsx
- [ ] T053 [P] [US1] Move apps/sudoku/src/components/ScoreBreakdown.tsx to packages/sudoku/src/components/ScoreBreakdown.tsx
- [ ] T054 [P] [US1] Move apps/sudoku/src/components/ScoreBreakdown.test.tsx to packages/sudoku/src/components/ScoreBreakdown.test.tsx
- [ ] T055 [P] [US1] Move apps/sudoku/src/components/scoringUtils.ts to packages/sudoku/src/helpers/scoringUtils.ts
- [ ] T056 [P] [US1] Move apps/sudoku/src/components/scoringUtils.test.ts to packages/sudoku/src/helpers/scoringUtils.test.ts (if exists)

#### Step 5: Update package.json exports for @bubblyclouds-app/sudoku

- [ ] T057 [US1] Update packages/sudoku/package.json exports field to include all newly moved components

#### Step 6: Update all imports for sudoku package components

- [ ] T058 [US1] Find all imports of Sudoku component and update to @bubblyclouds-app/sudoku/components/Sudoku
- [ ] T059 [US1] Find all imports of SudokuControls and update to @bubblyclouds-app/sudoku/components/SudokuControls
- [ ] T060 [US1] Find all imports of SudokuInput and update to @bubblyclouds-app/sudoku/components/SudokuInput
- [ ] T061 [US1] Find all imports of SudokuInputNotes and update to @bubblyclouds-app/sudoku/components/SudokuInputNotes
- [ ] T062 [US1] Find all imports of SudokuSidebar and update to @bubblyclouds-app/sudoku/components/SudokuSidebar
- [ ] T063 [US1] Find all imports of BookCover and update to @bubblyclouds-app/sudoku/components/BookCover
- [ ] T064 [US1] Find all imports of ScoringLegend and update to @bubblyclouds-app/sudoku/components/ScoringLegend
- [ ] T065 [US1] Find all imports of ScoreBreakdown and update to @bubblyclouds-app/sudoku/components/ScoreBreakdown
- [ ] T066 [US1] Find all imports of scoringUtils and update to @bubblyclouds-app/sudoku/helpers/scoringUtils

#### Step 7: Move Party Components to @bubblyclouds-app/template

- [ ] T067 [P] [US1] Move apps/sudoku/src/components/PartyRow.tsx to packages/template/src/components/PartyRow.tsx
- [ ] T068 [P] [US1] Move apps/sudoku/src/components/PartyRow.test.tsx to packages/template/src/components/PartyRow.test.tsx
- [ ] T069 [P] [US1] Move apps/sudoku/src/components/PartyInviteButton.tsx to packages/template/src/components/PartyInviteButton.tsx
- [ ] T070 [P] [US1] Move apps/sudoku/src/components/PartyInviteButton.test.tsx to packages/template/src/components/PartyInviteButton.test.tsx
- [ ] T071 [P] [US1] Move apps/sudoku/src/components/PartyConfirmationDialog.tsx to packages/template/src/components/PartyConfirmationDialog.tsx
- [ ] T072 [P] [US1] Move apps/sudoku/src/components/PartyConfirmationDialog.test.tsx to packages/template/src/components/PartyConfirmationDialog.test.tsx
- [ ] T073 [P] [US1] Move apps/sudoku/src/components/FriendsTab.tsx to packages/template/src/components/FriendsTab.tsx
- [ ] T074 [P] [US1] Move apps/sudoku/src/components/FriendsTab.test.tsx to packages/template/src/components/FriendsTab.test.tsx
- [ ] T075 [P] [US1] Move apps/sudoku/src/components/MyPuzzlesTab.tsx to packages/template/src/components/MyPuzzlesTab.tsx
- [ ] T076 [P] [US1] Move apps/sudoku/src/components/MyPuzzlesTab.test.tsx to packages/template/src/components/MyPuzzlesTab.test.tsx
- [ ] T077 [P] [US1] Move apps/sudoku/src/components/IntegratedSessionRow.tsx to packages/template/src/components/IntegratedSessionRow.tsx
- [ ] T078 [P] [US1] Move apps/sudoku/src/components/IntegratedSessionRow.test.tsx to packages/template/src/components/IntegratedSessionRow.test.tsx

#### Step 8: Update package.json exports for @bubblyclouds-app/template

- [ ] T079 [US1] Update packages/template/package.json exports field to include all newly moved components

#### Step 9: Update all imports for template package components

- [ ] T080 [US1] Find all imports of PartyRow and update to @bubblyclouds-app/template/components/PartyRow
- [ ] T081 [US1] Find all imports of PartyInviteButton and update to @bubblyclouds-app/template/components/PartyInviteButton
- [ ] T082 [US1] Find all imports of PartyConfirmationDialog and update to @bubblyclouds-app/template/components/PartyConfirmationDialog
- [ ] T083 [US1] Find all imports of FriendsTab and update to @bubblyclouds-app/template/components/FriendsTab
- [ ] T084 [US1] Find all imports of MyPuzzlesTab and update to @bubblyclouds-app/template/components/MyPuzzlesTab
- [ ] T085 [US1] Find all imports of IntegratedSessionRow and update to @bubblyclouds-app/template/components/IntegratedSessionRow

#### Step 10: Fix relative imports within each package

- [ ] T086 [US1] Update relative imports within packages/games to use relative paths (not package names)
- [ ] T087 [US1] Update relative imports within packages/sudoku to use relative paths (not package names)
- [ ] T088 [US1] Update relative imports within packages/template to use relative paths (not package names)

#### Step 11: Verify and test

- [ ] T089 [US1] Run npx tsc --noEmit to verify TypeScript compilation succeeds with zero errors
- [ ] T090 [US1] Run npm test to verify all tests pass with 99%+ pass rate
- [ ] T091 [US1] Run npm run build to verify build completes successfully
- [ ] T092 [US1] Verify no circular dependencies with npx madge --circular packages/ apps/
- [ ] T093 [US1] Run sudoku app in development mode and verify identical functionality

**Checkpoint**: At this point, User Story 1 should be fully functional - all components in correct packages, all tests passing, sudoku app working

---

## Phase 4: User Story 2 - Generic Game Components Available for Reuse (Priority: P2)

**Goal**: Ensure generic components are properly documented and can be imported by future game apps

**Independent Test**: Create minimal test showing games package can be imported independently without sudoku dependencies

### Implementation for User Story 2

- [ ] T094 [P] [US2] Document all 9 generic game components in packages/games/README.md with usage examples
- [ ] T095 [P] [US2] Add TypeScript interface documentation for all component props in README
- [ ] T096 [US2] Create example usage snippets for each component in packages/games/README.md
- [ ] T097 [US2] Verify games package has zero dependencies on sudoku package (check package.json)
- [ ] T098 [US2] Verify all games components use dependency injection (props) not hard imports

**Checkpoint**: All generic components documented and independently usable

---

## Phase 5: User Story 3 - Clean Package Boundaries (Priority: P3)

**Goal**: Validate clean package architecture with no circular dependencies

**Independent Test**: Dependency graph shows no cycles, packages build independently, Turborepo cache valid

### Implementation for User Story 3

- [ ] T099 [P] [US3] Run npx madge --circular packages/ apps/ and verify zero circular dependencies
- [ ] T100 [P] [US3] Verify Turborepo cache validity by running build twice and checking cache hits
- [ ] T101 [P] [US3] Test games package independently by building only packages/games
- [ ] T102 [US3] Update project documentation (root README.md) to reflect new packages/games package
- [ ] T103 [US3] Verify package dependency graph follows constitutional hierarchy

**Checkpoint**: All package boundaries clean, no circular dependencies, independent builds work

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [ ] T104 [P] Run npm run lint:fix to fix any linting issues
- [ ] T105 [P] Update any markdown files that reference old component locations
- [ ] T106 [P] Verify test coverage remains at 80%+ with npm test:coverage
- [ ] T107 Commit changes with descriptive commit message following constitutional guidelines
- [ ] T108 Final verification: Run full test suite, build, and manual smoke test of sudoku app

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed sequentially (P1 → P2 → P3) or P2/P3 can start in parallel after P1
- **Polish (Final Phase)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 completion (needs components moved first)
- **User Story 3 (P3)**: Depends on User Story 1 completion (needs final structure to validate)

### Within User Story 1 (Critical Path)

Migration must follow this order:
1. Move components (T011-T078) - Many can run in parallel within each category
2. Update package.json exports (T029, T057, T079) - Sequential after their category's moves
3. Update imports (T030-T085) - Sequential after exports updated
4. Fix relative imports (T086-T088) - After all imports updated
5. Verify (T089-T093) - After all changes complete

### Parallel Opportunities

- **Setup phase (Phase 1)**: All tasks T002-T006 can run in parallel
- **Component moves**: Within each category (games/sudoku/template), all component+test file moves can run in parallel
  - Games: T011-T028 (18 tasks in parallel)
  - Sudoku: T039-T056 (18 tasks in parallel)
  - Template: T067-T078 (12 tasks in parallel)
- **Documentation (US2)**: T094-T095 can run in parallel
- **Validation (US3)**: T099-T101 can run in parallel
- **Polish**: T104-T106 can run in parallel

---

## Parallel Example: User Story 1, Step 1 (Move Games Components)

```bash
# Launch all games component moves together:
Task: "Move TimerDisplay.tsx + test to packages/games/src/components/"
Task: "Move RaceTrack.tsx + test to packages/games/src/components/"
Task: "Move TrafficLight.tsx + test to packages/games/src/components/"
Task: "Move NumberPad.tsx + test to packages/games/src/components/"
Task: "Move Leaderboard.tsx + test to packages/games/src/components/"
Task: "Move ActivityWidget.tsx + test to packages/games/src/components/"
Task: "Move FriendLeaderboardEntry.tsx + test to packages/games/src/components/"
Task: "Move SidebarButton.tsx + test to packages/games/src/components/"
Task: "Move HintBox.tsx + test to packages/games/src/components/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (all component migrations)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. All tests pass, build succeeds, app works identically

### Incremental Delivery

1. Complete Setup + Foundational → Package structure ready
2. Complete User Story 1 → All components reorganized (MVP!)
3. Complete User Story 2 → Documentation and examples available
4. Complete User Story 3 → Architecture validated
5. Polish → Production ready

### Parallel Team Strategy

With multiple team members:

1. Team completes Setup + Foundational together
2. Once Foundational done:
   - Developer A: Games components migration (T011-T038)
   - Developer B: Sudoku components migration (T039-T066)
   - Developer C: Template components migration (T067-T085)
3. Synchronize for verification (T089-T093)
4. Proceed to documentation and validation in parallel

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Component files and test files should be moved together
- Commit after each major step (component category completion)
- Stop at checkpoints to validate before proceeding
- Constitutional requirement: No barrel exports (index.ts files)
- Constitutional requirement: Relative imports within package, package names across packages
- Constitutional requirement: Test files must move with components
