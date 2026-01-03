# Phase 0 Research: Modular Turborepo Architecture

**Date**: 2025-11-02
**Status**: Complete
**Objective**: Resolve technical unknowns and validate architectural decisions

## Research Summary

All key architectural decisions have been validated through code analysis, industry best practices, and project requirements alignment.

---

## Decision 1: Horizontal vs Vertical Package Organization

**Decision**: Horizontal package organization by responsibility (auth, ui, sudoku, template, shared)

**Rationale**:
- Horizontal organization (by feature/responsibility) enables code reuse across multiple applications
- Each package has a single, well-defined responsibility that can be tested and versioned independently
- Allows template app to function standalone without game-specific dependencies
- Supports the stated goal: "clearly separate concerns so this repo can be used to create another app without the sudoku logic"

**Alternatives Considered**:
- **Vertical organization** (app-first): Would create duplicate code between template and sudoku apps, and make it harder to extract the template as a standalone product
- **Feature-based within single package**: Would require complex internal boundaries and reduce modularity benefits

**Implementation Impact**:
- ~15 packages (including existing types, shared)
- Clear TypeScript path aliases for easy imports
- Each package has index.ts exporting public API only
- Dependency graph flows downward: apps → packages → core packages

---

## Decision 2: Package Boundaries for Auth Package

**Decision**: Dedicated `@bubblyclouds-app/auth` package containing all authentication logic, user management, and session handling

**Rationale**:
- Authentication is complex, security-critical, and identical across all applications
- Centralizing auth logic prevents duplication and ensures consistent security patterns
- Can be versioned and updated independently
- Both template and sudoku apps need identical auth flows per specification

**What Goes In Auth Package**:
- LoginForm, RegisterForm, OAuth provider components
- useAuth, useSession, useUser hooks
- AuthProvider context
- Token management and session persistence logic
- User types (User, Session, AuthToken)
- Authentication state machine

**What Stays In Apps**:
- App-specific pages that use auth (e.g., /auth page layout)
- Application-specific authentication flows (e.g., onboarding after signup)

---

## Decision 3: Shared UI Package Instead of Scattered Components

**Decision**: Create `@bubblyclouds-app/ui` package containing all reusable UI components and theme logic

**Rationale**:
- Header, footer, and theme are used identically in template and sudoku apps
- Centralizing UI components ensures visual consistency across applications
- Theme customization (dark mode, colors, etc.) can be managed in one place
- Enables design system scaling for future applications

**What Goes In UI Package**:
- Header component with navigation
- Footer component
- Theme provider and dark mode hooks
- Shared buttons, modals, dialogs
- Tailwind configuration and shared styles
- Navigation components

**What Stays in Apps**:
- App-specific component variations
- Page-level layouts that compose UI components

---

## Decision 4: Template as Reusable Foundation Package

**Decision**: `@bubblyclouds-app/template` becomes an importable package with core collaborative features (parties, sessions)

**Rationale**:
- Enables "create another app without the sudoku logic" requirement
- Template app can import template package + auth + ui to build a complete application
- Sudoku app can import template package + sudoku + auth + ui
- Future applications can follow the same pattern

**What Template Package Exports**:
- Party management hooks and providers
- Session management logic
- Invitation system logic
- Generic party/session types
- User context and session context providers

**Note on Naming**:
- Package is `@bubblyclouds-app/template` (core collaborative features)
- App is `apps/template` (standalone application using that package)

---

## Decision 5: Sudoku Package Contains All Game Logic

**Decision**: Dedicated `@bubblyclouds-app/sudoku` package for all game-specific functionality

**Rationale**:
- Isolates game logic from reusable packages
- Ensures shared packages and template can be used for non-game applications
- Satisfies requirement: "remove sudoku-specific terminology from template"
- Components like SudokuGrid, NumberPad, RaceTrack, Timer belong here

**What Goes In Sudoku Package**:
- SudokuGrid, SudokuBox, NumberPad components
- Sudoku-specific types (Cell, Grid, Puzzle, Solution)
- Game algorithms (solve, validate, generatePuzzle)
- RaceTrack, Race timer components
- useTimer, useSudokuState hooks
- Sudoku-specific helpers and utilities

**What Stays in Shared**:
- calculateSeconds (generic, not sudoku-specific)
- Other generic utilities

---

## Decision 6: Dependency Graph and Import Patterns

**Decision**: Unidirectional dependency graph with clear layers:

```
apps/template → @bubblyclouds-app/auth, @bubblyclouds-app/ui, @bubblyclouds-app/template
apps/sudoku → @bubblyclouds-app/auth, @bubblyclouds-app/ui, @bubblyclouds-app/sudoku, @bubblyclouds-app/template

@bubblyclouds-app/auth → @bubblyclouds-app/types, @bubblyclouds-app/shared
@bubblyclouds-app/ui → @bubblyclouds-app/types, @bubblyclouds-app/shared
@bubblyclouds-app/template → @bubblyclouds-app/types, @bubblyclouds-app/shared, @bubblyclouds-app/auth, @bubblyclouds-app/ui
@bubblyclouds-app/sudoku → @bubblyclouds-app/types, @bubblyclouds-app/shared, @bubblyclouds-app/template

@bubblyclouds-app/shared → @bubblyclouds-app/types
@bubblyclouds-app/types → (no dependencies)
```

**Rationale**:
- No circular dependencies
- Clear hierarchy enables easy understanding of dependencies
- Core packages (types, shared) have no dependencies on feature packages
- Feature packages can depend on core packages and each other (with restrictions)

**TypeScript Path Aliases** (in root tsconfig.json):
```json
{
  "paths": {
    "@bubblyclouds-app/auth": ["packages/auth/src"],
    "@bubblyclouds-app/ui": ["packages/ui/src"],
    "@bubblyclouds-app/sudoku": ["packages/sudoku/src"],
    "@bubblyclouds-app/template": ["packages/template/src"],
    "@bubblyclouds-app/shared": ["packages/shared/src"],
    "@bubblyclouds-app/types": ["packages/types/src"]
  }
}
```

---

## Decision 7: Test Strategy for Packages

**Decision**: Each package maintains its own jest.config.js with appropriate mocks and setup

**Rationale**:
- Packages can be tested independently
- Package tests verify public API contracts
- App integration tests verify packages work together correctly
- Maintains >99% test pass rate (constitutional requirement)

**Test Organization**:
- Unit tests in each package: `src/__tests__/` or `.test.ts` adjacent to source
- Integration tests in apps: `src/__tests__/integration/`
- Contract tests verify public API exports from each package

---

## Decision 8: Public API Boundaries Using index.ts

**Decision**: Each package exports only its public API through index.ts

**Rationale**:
- Prevents internal implementations from being imported and breaking when refactored
- Makes package contracts explicit and versioned
- Enables easier maintenance and future breaking changes with major version bumps
- Follows industry best practice (observed in Material-UI, React libraries, etc.)

**Example - Auth Package index.ts**:
```typescript
// ✅ Public API
export { AuthProvider } from './providers/AuthProvider';
export { useAuth, useSession, useUser } from './hooks';
export type { User, Session, AuthToken } from './types';

// ❌ Do NOT export internal implementations
// export { getAuthToken } from './services/tokenService';
```

---

## Decision 9: Handling Breaking Changes During Refactoring

**Decision**: This refactoring is a MAJOR version bump (2.0.0) with explicit migration guide

**Rationale**:
- Package structure changes are breaking changes
- Import paths will change: `src/providers/AuthProvider` → `@bubblyclouds-app/auth`
- Version bump signals significant refactoring
- Allows rolling back if needed
- Matches semantic versioning principles

**Migration Strategy**:
- Old direct app imports still work temporarily
- New packages provide same functionality via `@bubblyclouds-app/` aliases
- Gradual migration: Update imports in both apps and configs
- Once complete: Remove old locations, bump major version

---

## Decision 10: Shared Package Cleanup

**Decision**: Remove all sudoku-specific code from `@bubblyclouds-app/shared` and `@bubblyclouds-app/types`

**Rationale**:
- Shared and types packages must be truly generic
- Enables reusability in non-game applications
- Meets explicit requirement: "no sudoku-specific logic in shared packages"

**Examples of Code to Move**:
- `splitCellId()` utility → move to `@bubblyclouds-app/sudoku`
- Sudoku-specific types (Cell, Grid, Puzzle) → move to `@bubblyclouds-app/sudoku`
- Game-specific constants → move to `@bubblyclouds-app/sudoku`

**Examples of Code to Keep**:
- `calculateSeconds()` → stays in shared (generic timer utility)
- Type utilities like `Parties<T>`, `Session<T>` → stay in types (generic, parameterized)
- formatSeconds() → stays in shared (generic)

---

## Next Steps (Phase 1)

1. **Create data model** - Define entities and types for new packages
2. **Generate contracts** - Define public APIs for each package
3. **Update agent context** - Document new packages for AI assistance
4. **Create quickstart** - Guide for importing from new packages

---

## Validation

✅ All decisions align with:
- Sudoku Web Constitution v1.0.0 (especially Component-Driven Architecture principle)
- User specification requirements (template standalone, clear separation)
- TypeScript/Turborepo best practices
- Industry standards for monorepo organization

✅ No blockers identified for Phase 1 design phase
