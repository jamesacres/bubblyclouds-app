# Research: Games Package Refactoring

**Date**: 2025-11-16
**Status**: Complete

## Overview

This document captures research and decisions for reorganizing sudoku app components into appropriate packages. Since this is a refactoring task using existing, well-established technologies and patterns within the project, minimal research was required. The focus is on applying existing project patterns consistently.

## Research Areas

### 1. Turborepo Package Creation Patterns

**Decision**: Follow existing package structure pattern from `@sudoku-web/sudoku`, `@sudoku-web/template`, etc.

**Rationale**:
- Project already has established package creation patterns
- Consistency with existing packages reduces cognitive load
- Turborepo configuration already handles multi-package builds

**Pattern to Follow**:
```
packages/games/
├── src/
│   ├── components/
│   └── types/
├── package.json (with exports field)
├── tsconfig.json
├── jest.config.js
└── README.md
```

**Alternatives Considered**:
- Creating sub-packages (packages/games/timer, packages/games/leaderboard) - Rejected: Over-engineering for current scope
- Monolithic approach (keep everything in one location) - Rejected: Violates package boundary principles

### 2. Package.json Exports Configuration (Just-in-Time Pattern)

**Decision**: Use the Just-in-Time package export pattern already established in the project

**Rationale**:
- Constitutional requirement (Principle III)
- Already used successfully in existing packages
- Provides precise control over public API
- Enables tree-shaking and optimal bundling

**Pattern Example** (from existing packages):
```json
{
  "name": "@sudoku-web/games",
  "exports": {
    "./components/TimerDisplay": "./src/components/TimerDisplay.tsx",
    "./components/RaceTrack": "./src/components/RaceTrack.tsx",
    "./components/TrafficLight": "./src/components/TrafficLight.tsx",
    "./components/NumberPad": "./src/components/NumberPad.tsx",
    "./components/Leaderboard": "./src/components/Leaderboard.tsx",
    "./components/ActivityWidget": "./src/components/ActivityWidget.tsx",
    "./components/FriendLeaderboardEntry": "./src/components/FriendLeaderboardEntry.tsx",
    "./components/SidebarButton": "./src/components/SidebarButton.tsx",
    "./components/HintBox": "./src/components/HintBox.tsx"
  }
}
```

**Alternatives Considered**:
- Barrel exports (index.ts) - Rejected: Explicitly forbidden by constitution
- Wildcard exports - Rejected: Less precise, harder to track public API

### 3. Component Migration Strategy

**Decision**: Atomic git commits per component category with immediate import updates

**Rationale**:
- Maintains working state at each commit
- Enables easy rollback if issues discovered
- TypeScript compiler catches broken imports immediately
- Test suite validates functionality at each step

**Migration Order**:
1. Create games package structure (package.json, tsconfig, jest.config, README)
2. Move generic components to games package + update imports + run tests
3. Move sudoku-specific components to sudoku package + update imports + run tests
4. Move party components to template package + update imports + run tests
5. Verify final state (all tests pass, build succeeds, no circular deps)

**Alternatives Considered**:
- Big bang migration (all at once) - Rejected: High risk, difficult to debug
- Feature branch per component - Rejected: Too granular, merge conflicts likely

### 4. Import Statement Update Strategy

**Decision**: Use TypeScript compiler + grep to find and update all imports systematically

**Rationale**:
- TypeScript compiler will immediately flag broken imports
- Grep provides comprehensive search across codebase
- Manual verification prevents automated mistakes
- Small scope (~50-100 imports) makes manual review feasible

**Process**:
1. Move component files
2. Run `npx tsc --noEmit` to find broken imports
3. Use grep to find additional usage: `grep -r "ComponentName" apps/ packages/`
4. Update imports to new package paths
5. Verify with tests

**Alternatives Considered**:
- Automated codemod tool - Rejected: Overkill for this scope, risk of incorrect transforms
- IDE refactoring - Rejected: May not catch all cross-package references

### 5. Test File Organization

**Decision**: Co-locate test files with components (same directory)

**Rationale**:
- Already established pattern in the project
- Constitutional requirement to move tests alongside components
- Easier to maintain (test next to implementation)
- Jest configuration already handles this pattern

**Pattern**:
```
packages/games/src/components/
├── TimerDisplay.tsx
├── TimerDisplay.test.tsx
├── RaceTrack.tsx
└── RaceTrack.test.tsx
```

**Alternatives Considered**:
- Separate `__tests__` directory - Rejected: Not current project pattern
- Tests in root-level `tests/` - Rejected: Separates tests from implementation

### 6. Dependency Injection vs. Hard Dependencies

**Decision**: Games package will have zero dependencies on sudoku package; will accept data/callbacks via props

**Rationale**:
- Constitutional requirement (Principle III: prefer dependency injection)
- Enables true reusability across different game types
- Generic components receive game-specific data through props
- Sudoku app will provide data, games package provides UI

**Example**:
```typescript
// Generic in games package
interface LeaderboardProps {
  entries: Array<{ id: string; score: number; player: string }>;
  onEntryClick?: (id: string) => void;
}

// Sudoku-specific in sudoku app
<Leaderboard
  entries={sudokuScores}
  onEntryClick={handleSudokuEntryClick}
/>
```

**Alternatives Considered**:
- Import sudoku scoring logic into games package - Rejected: Creates tight coupling
- Create abstract interfaces - Rejected: Over-engineering, props provide sufficient abstraction

## Technical Decisions Summary

| Decision Area | Choice | Rationale |
|--------------|--------|-----------|
| Package Structure | Follow existing pattern | Consistency with project |
| Exports Pattern | Just-in-Time (package.json exports) | Constitutional requirement |
| Migration Strategy | Atomic commits by category | Maintains working state |
| Import Updates | TypeScript compiler + grep + manual | Accuracy and completeness |
| Test Organization | Co-located with components | Project standard |
| Dependencies | Zero hard deps, use props | Enables reusability |

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missed import updates | Build failures | Use TypeScript compiler + comprehensive grep |
| Broken tests after move | Failed CI | Run tests after each component category migration |
| Circular dependencies | Build failures | Validate dependency graph before/after |
| Turborepo cache invalidation | Slower builds | Accept one-time cost, future builds will be fast |

## Open Questions

**None** - All technical approaches are well-established within the project. This refactoring applies existing patterns consistently.

## Next Steps

Proceed to Phase 1: Data Model & Contracts generation.
