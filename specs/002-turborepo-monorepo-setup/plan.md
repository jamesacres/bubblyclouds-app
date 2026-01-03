# Implementation Plan: Turborepo Monorepo Setup for Template-Based Architecture

**Branch**: `002-turborepo-monorepo-setup` | **Date**: 2025-11-01 | **Spec**:
[Feature Specification](spec.md)

**Input**: Feature specification from
`/specs/002-turborepo-monorepo-setup/spec.md`

⚠️ **Combined Features**: This feature (002) and Feature 001 (Template
Extraction) are executed together for maximum efficiency.
**[See `tasks.md` in this directory for the complete combined task list (181 tasks across 11 phases)](./tasks.md).**

## Summary

Restructure the current bubblyclouds-app repository into a Turborepo monorepo
with two application workspaces (`/apps/template/` and `/apps/sudoku/`) and
shared packages (`/packages/`). This enables efficient build caching, parallel
task execution, and clear separation of concerns. The monorepo structure will
support the subsequent template extraction (feature 001) and future multi-app
platforms.

**Key deliverables:**

- Root `turbo.json` with task pipelines and caching rules
- Workspace structure: `/apps/template/`, `/apps/sudoku/`, `/packages/shared/`
- Migrated build scripts with Turborepo integration
- <30 second cached builds, <5 minute cold builds
- Workspace dependency isolation (Sudoku → Template, never reverse)

## Technical Context

**Language/Version**: TypeScript, Node.js 20.10.0+, npm 8+

**Primary Dependencies**:

- Turborepo (latest stable)
- Next.js 14 (existing)
- React 18 (existing)
- Tailwind CSS v4 (existing)
- ESLint, Prettier (existing)

**Testing**: Jest (existing test infrastructure with 1987 passing tests)

**Target Platform**: Web (Next.js), iOS (Capacitor), Android (Capacitor),
Electron (desktop)

**Project Type**: Monorepo with multiple applications (template + sudoku) and
shared packages

**Performance Goals**:

- First build (cache miss): <5 minutes
- Cached builds: <30 seconds
- CI build time reduction: 60%+ with caching
- Parallel task execution: 3+ independent tasks simultaneously

**Constraints**:

- Node.js 18+ and npm 8+ support required
- Existing build scripts must remain compatible
- No breaking changes to platform builds (iOS, Android, Electron)
- Existing test suite (1987 tests) must continue passing

**Scale/Scope**:

- Current codebase: ~5,000+ LOC across components, hooks, providers
- Workspace count: 2 apps + 1-3 shared packages
- Build artifacts: Web bundle, iOS/Android native builds, Electron app
- Dependency versions: Must align between workspaces (React, Next.js, Tailwind)

## Constitution Check

**Sudoku Web Constitution v1.0.0** requirements alignment:

✅ **I. Test-First Development**

- All monorepo configuration and workspace setup must be testable
- Existing test suite (1987 tests) must pass in monorepo structure
- Task pipelines include test execution across all workspaces

✅ **II. Full TypeScript Type Safety**

- All workspace `tsconfig.json` files configured with strict mode
- Monorepo supports TypeScript path aliases for clean imports
- Package exports properly typed

✅ **III. Component-Driven Architecture**

- Monorepo structure reinforces component isolation
- Workspace boundaries prevent accidental cross-app imports
- Shared components organized in `/packages/components/` (future)

✅ **IV. Multi-Platform Compatibility**

- iOS/Android/Electron build scripts adapted to monorepo
- Platform-specific builds work within workspace structure
- Build outputs organized per platform

✅ **V. User-Centric Design & Accessibility**

- Monorepo setup doesn't affect user-facing features
- Build performance improvements enhance developer experience
- Faster builds = faster iteration = better UX

**Gate Status**: ✅ PASS - Monorepo structure aligns with all constitutional
principles

## Project Structure

### Documentation (this feature)

```
specs/002-turborepo-monorepo-setup/
├── spec.md                 # Feature specification
├── plan.md                 # This file (Phase 0-1 planning)
├── research.md             # Phase 0 output (pending)
├── data-model.md           # Phase 1 output (pending)
├── quickstart.md           # Phase 1 output (pending)
├── contracts/              # Phase 1 output (pending)
└── checklists/
    └── requirements.md     # Quality validation
```

### Repository Structure (Implementation)

**Post-Turborepo:**

```
bubblyclouds-app/                    # Monorepo root
├── turbo.json                 # Turborepo configuration
├── package.json               # Root package with workspaces
├── pnpm-lock.yaml or package-lock.json
├── tsconfig.json              # Root TypeScript config
├── next.config.js             # Shared Next.js config (if applicable)
├── eslint.config.js           # Root ESLint config
├── prettier.config.js         # Root Prettier config
│
├── apps/
│   ├── template/              # Generic template app (post-001)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── providers/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   └── helpers/
│   │   └── public/
│   │
│   └── sudoku/                # Sudoku-specific app
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       ├── src/
│       │   ├── app/
│       │   ├── components/    # Sudoku game components
│       │   ├── sudoku/        # Sudoku-specific code
│       │   ├── types/
│       │   └── augmentedReality/
│       └── public/
│
├── packages/
│   ├── types/                 # Shared type definitions
│   │   ├── package.json
│   │   └── src/
│   │       ├── auth/
│   │       ├── session/
│   │       ├── party/
│   │       └── user/
│   │
│   ├── shared/                # Shared utilities
│   │   ├── package.json
│   │   └── src/
│   │       ├── helpers/
│   │       ├── utils/
│   │       └── constants/
│   │
│   └── config/                # Shared configuration
│       ├── package.json
│       └── src/
│           ├── eslint/
│           ├── prettier/
│           └── tailwind/
│
├── ios/                        # iOS app (unchanged structure)
├── android/                    # Android app (unchanged structure)
├── electron/                   # Electron app (unchanged structure)
│
├── scripts/
│   └── (existing build/utility scripts)
│
└── (other root files: README, LICENSE, etc.)
```

**Structure Decision**: Multi-workspace monorepo using npm workspaces with
Turborepo orchestration. This structure enables:

- Clear separation between template (`/apps/template/`) and Sudoku
  (`/apps/sudoku/`)
- Shared code organized in `/packages/` for types, utilities, and configuration
- Efficient dependency management with single node_modules resolution at root
- Turborepo caching and parallel task execution
- Future support for additional apps (e.g., `/apps/trivia/`,
  `/apps/collaboration/`)

## Complexity Tracking

No constitutional violations. Monorepo setup is an infrastructure improvement
with no negative architectural impact. All complexity is justified by:

- Build time reduction: 60%+ faster CI with caching
- Developer experience: Single `npm install`, unified build commands
- Code organization: Clear workspace boundaries prevent accidental coupling
- Maintainability: Future apps can reuse template without Sudoku dependencies

---

## Phase 0: Research & Requirements

**Objectives**:

1. Resolve all unknowns in Technical Context
2. Document Turborepo best practices for monorepos
3. Plan migration of existing build scripts
4. Define workspace dependency graph

### Research Tasks

**T001: Turborepo Best Practices for Multi-Platform Monorepos**

- How to configure `turbo.json` for Next.js + Capacitor + Electron
- Caching strategies for multi-platform builds
- Workspace filtering and task dependencies
- CI/CD integration with Turborepo Remote Caching

**T002: npm Workspaces vs Alternative Solutions**

- Evaluate: npm workspaces vs pnpm workspaces vs yarn workspaces
- Dependency resolution and hoisting strategies
- Compatibility with existing tooling (Next.js, Capacitor, Electron)
- Migration effort and rollback plan

**T003: Multi-Platform Build Adaptation**

- How to integrate iOS/Android builds with monorepo
- Capacitor build scripts in workspace context
- Electron app build within monorepo
- Shared assets and public/ directories per workspace

**T004: TypeScript Path Aliases and Module Resolution**

- Configure tsconfig.json for monorepo with path aliases
- How to import from `/packages/types/` in both apps
- Build-time resolution of workspace imports
- IDE support for cross-workspace navigation

**T005: Dependency Version Management**

- Strategy for aligning React, Next.js, Tailwind versions
- Handling version conflicts between apps
- Peer dependencies vs direct dependencies in shared packages
- Lock file management (package-lock.json strategy)

### Expected Outputs

**research.md** will document:

- Turborepo configuration approach (decisions + rationale)
- Best practices for multi-platform builds
- Migration strategy for existing build scripts
- Workspace import patterns and module resolution
- CI/CD configuration for caching and artifact reuse

---

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete (Phase 0)

### 1. Data Model (data-model.md)

**Workspace Configuration Entities**:

| Entity                  | Fields                                                      | Notes                                                  |
| ----------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| **Workspace**           | name, path, type (app\|package), dependencies               | `/apps/template/`, `/apps/sudoku/`, `/packages/types/` |
| **TaskPipeline**        | name (build\|test\|lint), inputs, outputs, cache, dependsOn | Defined in turbo.json                                  |
| **TaskCache**           | inputFiles, outputFiles, cacheKey                           | Content-based hashing                                  |
| **WorkspaceDependency** | from, to, type (internal\|external)                         | Sudoku→Template, Template→Packages                     |
| **BuildOutput**         | workspace, target (web\|ios\|android\|electron), artifact   | .next/, build/, dist/                                  |

**State Transitions**:

- `monorepo: uninitialized` → `configured` → `tested` → `production`
- Cache states: `miss` → `hit` → `invalidated` (on source change)
- Workspace state: `extracted` (template) → `refactored` (sudoku)

### 2. API Contracts (contracts/)

**No external APIs** - this is infrastructure. Contracts define workspace
boundaries via TypeScript imports.

**Module Contract Examples**:

**`@bubblyclouds-app/template` exports**:

```typescript
// Authentication
export { AuthProvider, useAuth, useSession, useUser };
// Parties
export { PartyProvider, useParty };
// Types
export type { Invite, Party, Session, User };
// Hooks
export { usePurchase, useStorage, useTheme };
```

**`@bubblyclouds-app/sudoku` imports** (allowed):

```typescript
import { Session, useSession } from "@bubblyclouds-app/template";
import { Party } from "@bubblyclouds-app/template";
// Custom extension:
type SudokuSession = Session<ServerState>;
```

**`@bubblyclouds-app/template` imports from `@bubblyclouds-app/sudoku`** (NOT
ALLOWED):

```typescript
// ❌ This would fail at build time
// import { SudokuSession } from '@bubblyclouds-app/sudoku'
```

### 3. Quick Start Guide (quickstart.md)

**Setup Steps**:

1. Clone repo: `git clone <repo> bubblyclouds-app`
2. Install: `npm install`
3. Build all: `npm run build` (uses Turborepo caching)
4. Build specific app: `npm run build --filter=@bubblyclouds-app/template`
5. Dev mode: `npm run dev --filter=@bubblyclouds-app/sudoku`
6. Run tests: `npm test` (all workspaces in parallel)

**Turborepo Commands Reference**:

- `turbo run build`: Build all workspaces
- `turbo run build --filter=@bubblyclouds-app/*`: Build only app workspaces (not
  packages/)
- `turbo run build --filter=...template`: Build template and dependents
- `turbo run dev --parallel`: Run dev servers in parallel

### 4. Agent Context Update

Run: `./.specify/scripts/bash/update-agent-context.sh claude`

This will add Turborepo configuration knowledge to the Claude agent context for
future feature development.

---

## Next Steps

**Phase 0 (Research)**: Generate `research.md` documenting all unknowns resolved
**Phase 1 (Design)**: Generate `data-model.md`, `/contracts/`, `quickstart.md`
**Phase 2 (Tasks)**: Run `/speckit.tasks` to generate implementation tasks

**Dependency**: After this plan is approved, feature 001 (Template Extraction)
can proceed with the monorepo structure in place.

---

## Constitutional Compliance Summary

| Principle                           | Status | Notes                                                  |
| ----------------------------------- | ------ | ------------------------------------------------------ |
| Test-First Development              | ✅     | Test suite migrates to monorepo with Turborepo caching |
| TypeScript Type Safety              | ✅     | Path aliases enable typed imports across workspaces    |
| Component-Driven Architecture       | ✅     | Workspace boundaries enforce component isolation       |
| Multi-Platform Compatibility        | ✅     | Platform-specific builds adapted to workspaces         |
| User-Centric Design & Accessibility | ✅     | Build performance improvement enhances DX              |

**Gate Result**: ✅ PASS - Ready for Phase 0 research
