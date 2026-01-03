# Implementation Plan: Games Package Refactoring

**Branch**: `004-games-package-refactor` | **Date**: 2025-11-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-games-package-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Reorganize sudoku app components into appropriate packages to enable code reuse for future game applications. Create a new `@bubblyclouds-app/games` package for generic game components (timers, race tracks, leaderboards, number pads), move sudoku-specific components to `@bubblyclouds-app/sudoku` package, move party-related components to `@bubblyclouds-app/template` package, and ensure clean package boundaries with no circular dependencies. This refactoring maintains 100% functionality while establishing the foundation for future games like wordsearch.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode enabled
**Primary Dependencies**: React 18, Next.js 14, Tailwind CSS 4, Turborepo, Jest, React Testing Library
**Storage**: N/A (component reorganization only, no data storage changes)
**Testing**: Jest with React Testing Library for component tests
**Target Platform**: Web (Next.js), iOS (Capacitor), Android (Capacitor), Electron (desktop)
**Project Type**: monorepo (Turborepo multi-package architecture)
**Package Boundaries**:
- New package: `@bubblyclouds-app/games` (generic game components)
- Modified: `@bubblyclouds-app/sudoku` (sudoku-specific components)
- Modified: `@bubblyclouds-app/template` (party-related components)
- Modified: `apps/sudoku` (app-level components only)
**Performance Goals**: Maintain current performance (no degradation), Turborepo cache validity preserved
**Constraints**:
- Zero regressions (all existing functionality must work identically)
- All tests must pass (99%+ pass rate)
- TypeScript compilation must succeed with zero errors
- No circular dependencies introduced
**Scale/Scope**:
- ~28 component files to relocate
- ~28 test files to move alongside components
- 4 packages affected (3 modified, 1 new)
- ~50-100 import statements to update across codebase

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Test-First Development
✅ **COMPLIANT**
- All moved components already have test coverage
- Test files will move alongside component files (FR-007)
- Success criteria SC-001 requires 99%+ test pass rate
- Success criteria SC-007 requires 80%+ coverage maintained

### Principle II: Full TypeScript Type Safety
✅ **COMPLIANT**
- No type changes planned (internal refactoring only)
- TypeScript compilation must succeed (SC-002)
- All moved components already have proper TypeScript types
- Package.json exports will declare types correctly

### Principle III: Modular Package Architecture
✅ **COMPLIANT** - This refactoring *implements* constitutional principles
- Creates clean package boundaries (FR-001 through FR-005)
- Enforces no apps → packages dependencies (spec confirms compliance)
- Games package will have no sudoku dependencies (FR-004)
- Template package remains game-agnostic (FR-003)
- Relative imports within packages enforced (FR-010)
- Package name imports across packages enforced (FR-010)
- No barrel exports (FR-009)
- Just-in-Time package exports pattern (FR-011)

**Special Note**: This feature is *specifically designed* to bring the codebase into alignment with Constitutional Principle III by establishing proper package boundaries.

### Principle IV: Multi-Platform Compatibility
✅ **COMPLIANT**
- No platform-specific changes
- Component functionality preserved across all platforms (FR-008)
- Existing platform abstractions remain intact

### Principle V: User-Centric Design & Accessibility
✅ **COMPLIANT**
- No UI/UX changes (internal refactoring only)
- All accessibility features preserved (FR-008)
- User-facing functionality identical (SC-003)

### Quality Standards
✅ **COMPLIANT**
- Test coverage maintained (SC-007: 80%+)
- Build must succeed (SC-002: zero TypeScript errors)
- Linting enforced (will run `npm run lint:fix`)
- Turborepo cache preserved (SC-006)
- Test files updated alongside moves (constitutional requirement)

### Development Workflow
✅ **COMPLIANT**
- Package development guidelines followed (6-step process)
- Clear package responsibilities defined
- Public API documented in package README files
- Package.json exports configured (Just-in-Time pattern)
- Package dependency rules enforced

**GATE STATUS**: ✅ **PASS** - All constitutional principles compliant. Proceed to Phase 0.

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design (research, data-model, contracts, quickstart)*

### Principle I: Test-First Development
✅ **COMPLIANT** - Confirmed in design
- Data model confirms test files co-located with components
- Quickstart includes test verification steps
- Research confirms Jest/React Testing Library usage

### Principle II: Full TypeScript Type Safety
✅ **COMPLIANT** - Confirmed in design
- Data model documents TypeScript prop interfaces
- Quickstart shows typed component examples
- Research confirms strict mode TypeScript compilation

### Principle III: Modular Package Architecture
✅ **COMPLIANT** - Confirmed in design
- Data model shows clean dependency graph (no cycles)
- Package.json Just-in-Time exports pattern defined in research
- Quickstart enforces import conventions (relative within, package names across)
- Games package confirmed zero dependencies on feature packages

### Principle IV: Multi-Platform Compatibility
✅ **COMPLIANT** - Confirmed in design
- All components remain platform-agnostic
- No platform-specific changes in migration

### Principle V: User-Centric Design & Accessibility
✅ **COMPLIANT** - Confirmed in design
- No UI/UX changes (functionality preserved)
- Component interfaces unchanged

### Quality Standards
✅ **COMPLIANT** - Confirmed in design
- Quickstart defines verification steps (TypeScript, tests, build, circular deps)
- Research defines migration strategy maintaining test coverage

### Development Workflow
✅ **COMPLIANT** - Confirmed in design
- Package development guidelines applied in data model
- Quickstart documents proper usage patterns

**POST-DESIGN GATE STATUS**: ✅ **PASS** - All constitutional principles remain compliant after detailed design.

## Project Structure

### Documentation (this feature)

```
specs/004-games-package-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
packages/
├── games/               # NEW PACKAGE - Generic game components
│   ├── src/
│   │   ├── components/  # TimerDisplay, RaceTrack, TrafficLight, NumberPad,
│   │   │                # Leaderboard, ActivityWidget, FriendLeaderboardEntry,
│   │   │                # SidebarButton, HintBox
│   │   └── types/       # Shared types for games package
│   ├── package.json     # With exports field (Just-in-Time pattern)
│   ├── tsconfig.json    # TypeScript configuration
│   ├── jest.config.js   # Jest configuration
│   └── README.md        # Package documentation and API reference
│
├── sudoku/              # MODIFIED - Sudoku-specific components
│   ├── src/
│   │   ├── components/  # Existing: SudokuBox, SimpleSudoku
│   │   │                # Moving from app: Sudoku, SudokuControls, SudokuInput,
│   │   │                # SudokuInputNotes, SudokuSidebar, BookCover,
│   │   │                # ScoringLegend, ScoreBreakdown
│   │   ├── helpers/     # Existing: puzzle logic
│   │   │                # Moving from app: scoringUtils
│   │   └── types/       # Sudoku-specific types
│   ├── package.json     # Updated exports
│   └── README.md        # Updated API reference
│
├── template/            # MODIFIED - Party/collaboration features
│   ├── src/
│   │   ├── components/  # Existing: party infrastructure components
│   │   │                # Moving from app: PartyRow, PartyInviteButton,
│   │   │                # PartyConfirmationDialog, FriendsTab, MyPuzzlesTab,
│   │   │                # IntegratedSessionRow
│   │   └── [...]
│   ├── package.json     # Updated exports
│   └── README.md        # Updated API reference
│
├── ui/                  # UNCHANGED - UI components
│   └── [...]
│
├── auth/                # UNCHANGED - Authentication
│   └── [...]
│
├── shared/              # UNCHANGED - Shared utilities
│   └── [...]
│
└── types/               # UNCHANGED - Shared types
    └── [...]

apps/
└── sudoku/              # MODIFIED - App-level only
    ├── src/
    │   ├── app/         # Next.js pages (unchanged)
    │   ├── components/  # REDUCED - Only app-specific:
    │   │                # HeaderWrapper, RacingPromptModal, SudokuPlusModal
    │   └── [...]
    └── package.json     # Updated dependencies
```

**Structure Decision**: Using Option 4 (Turborepo monorepo). The new `@bubblyclouds-app/games` package will be created at the packages level alongside existing packages. Component migrations follow the categorization defined in the spec: sudoku-specific → packages/sudoku, party-related → packages/template, generic game → packages/games, app-specific remains in apps/sudoku.

## Complexity Tracking

*No constitutional violations - this section intentionally left empty*

This refactoring has **zero** constitutional violations. In fact, it implements Constitutional Principle III (Modular Package Architecture) by establishing proper package boundaries that were previously missing.
