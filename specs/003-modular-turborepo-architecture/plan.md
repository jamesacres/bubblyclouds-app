# Implementation Plan: Modular Turborepo Architecture

**Branch**: `003-modular-turborepo-architecture` | **Date**: 2025-11-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-modular-turborepo-architecture/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Reorganize the existing Turborepo monorepo into a modular, reusable architecture where shared functionality (authentication, UI components, utilities) lives in dedicated packages, allowing both the template app and sudoku app to build on a common foundation. This enables the template to run as a standalone application and allows new applications to be created using the same architecture without game-specific logic. The approach involves extracting auth logic into an `@bubblyclouds-app/auth` package, creating a `@bubblyclouds-app/ui` package for common components, moving sudoku-specific logic into a `@bubblyclouds-app/sudoku` package, and ensuring the `@bubblyclouds-app/template` package contains only generic, reusable functionality.

## Technical Context

**Language/Version**: TypeScript 5.x (already in use)
**Primary Dependencies**:
- Turborepo (monorepo management)
- Next.js 14+ (web framework)
- React 18+ (UI framework)
- TypeScript (type safety)
- Jest (testing)
- Tailwind CSS (styling)

**Storage**: N/A (refactoring existing architecture, storage patterns unchanged)
**Testing**: Jest with React Testing Library (established patterns)
**Target Platform**: Web (Next.js), iOS/Android (Capacitor), Electron (desktop)
**Project Type**: Monorepo with multiple applications and packages
**Performance Goals**: Build time <60s, bundle size unchanged, test suite <5s
**Constraints**: Zero breaking changes to public APIs, 100% test pass rate maintained, no sudoku references in shared packages
**Scale/Scope**: Refactor ~50 components, ~15 hooks, ~30 utilities, establish 4-5 new packages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Based on Sudoku Web Constitution v1.0.0:

✅ **I. Test-First Development**: All refactoring must maintain >99% test pass rate. Existing 1,711 passing tests must remain passing through the reorganization. Package boundaries must be testable. Each package will have its own test suite verifying its exported API.

✅ **II. Full TypeScript Type Safety**: All packages and applications must have strict TypeScript configuration. Type definitions must be explicit for all exports. Package public APIs will be typed interfaces.

✅ **III. Component-Driven Architecture**: Refactoring preserves functional React components and hooks. Components maintain single responsibility. Shared components move to dedicated package (`@bubblyclouds-app/ui`). All components remain PascalCase named.

✅ **IV. Multi-Platform Compatibility**: Refactoring maintains compatibility across web, iOS (Capacitor), Android (Capacitor), and Electron. Platform-specific code remains mockable. Package organization does not introduce platform-specific dependencies in shared packages.

✅ **V. User-Centric Design & Accessibility**: Refactoring preserves WCAG 2.1 compliance. No changes to accessibility features, dark mode support, or performance characteristics.

✅ **Version Management**: This refactoring is a MAJOR version bump (changes to package structure, public APIs moved across packages). Documented in CHANGELOG and commit messages.

**Gate Status**: ✅ PASS - All constitutional principles are satisfied or actively enforced by this refactoring.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
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
├── auth/                           # NEW: Authentication logic package
│   ├── src/
│   │   ├── components/            # Auth UI: LoginForm, RegisterForm, OAuth providers
│   │   ├── hooks/                 # useAuth, useSession, useUser
│   │   ├── providers/             # AuthProvider, UserContext
│   │   ├── services/              # token management, session logic
│   │   ├── types/                 # Auth types (User, Session, AuthToken)
│   │   └── index.ts               # Public API
│   ├── package.json
│   └── tsconfig.json
│
├── ui/                             # NEW: Shared UI components package
│   ├── src/
│   │   ├── components/            # Header, Footer, Navigation, Buttons, Modals
│   │   ├── providers/             # ThemeProvider
│   │   ├── hooks/                 # useTheme, useDarkMode
│   │   ├── styles/                # Tailwind configuration, shared utilities
│   │   ├── types/                 # UI-related types
│   │   └── index.ts               # Public API
│   ├── package.json
│   └── tsconfig.json
│
├── sudoku/                         # NEW: Sudoku-specific logic package
│   ├── src/
│   │   ├── components/            # Sudoku UI: SudokuGrid, NumberPad, Timer, RaceTrack
│   │   ├── helpers/               # Sudoku algorithms: solve, validate, etc.
│   │   ├── types/                 # Cell, Grid, Puzzle, RaceSession types
│   │   ├── utils/                 # Sudoku utilities
│   │   ├── hooks/                 # useTimer, useSudokuState, etc.
│   │   └── index.ts               # Public API
│   ├── package.json
│   └── tsconfig.json
│
├── template/                       # Renamed from: template package (existing)
│   ├── src/
│   │   ├── components/            # Generic components (not in UI package)
│   │   ├── hooks/                 # Generic hooks (useLocalStorage, useOnline, etc.)
│   │   ├── providers/             # Shared providers (not auth/theme specific)
│   │   ├── types/                 # Generic types
│   │   ├── utils/                 # Generic utilities
│   │   ├── index.ts               # Public API (exports from auth, ui, shared)
│   │   └── README.md              # Package documentation
│   ├── package.json
│   └── tsconfig.json
│
├── types/                          # (existing) Shared types
│   ├── src/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
└── shared/                         # (existing, enhanced) Shared utilities
    ├── src/
    │   ├── helpers/               # Generic helpers (calculateSeconds, etc.)
    │   ├── utils/                 # No sudoku-specific utils here!
    │   └── index.ts
    ├── package.json
    └── tsconfig.json

apps/
├── template/                       # Template application (standalone)
│   ├── src/
│   │   ├── app/                   # Next.js pages
│   │   ├── components/            # App-specific components
│   │   └── layout.tsx             # Root layout with providers
│   ├── package.json               # Imports: @bubblyclouds-app/auth, @bubblyclouds-app/ui, @bubblyclouds-app/template
│   └── next.config.mjs
│
└── sudoku/                        # Sudoku application
    ├── src/
    │   ├── app/                   # Next.js pages
    │   ├── components/            # App-specific components (extends Sudoku package)
    │   └── layout.tsx             # Root layout with providers
    ├── package.json               # Imports: @bubblyclouds-app/auth, @bubblyclouds-app/ui, @bubblyclouds-app/sudoku
    └── next.config.mjs
```

**Structure Decision**:

This monorepo follows a modular, horizontal package architecture where:

1. **Packages are organized by responsibility**, not by application:
   - `@bubblyclouds-app/auth` - All authentication logic and user management
   - `@bubblyclouds-app/ui` - Reusable UI components (header, footer, buttons, modals, theme)
   - `@bubblyclouds-app/sudoku` - Sudoku-specific game logic and components
   - `@bubblyclouds-app/template` - Core collaborative features (parties, sessions) that multiple apps can use
   - `@bubblyclouds-app/shared` and `@bubblyclouds-app/types` - Generic utilities and types

2. **Applications are lightweight consumers**:
   - `apps/template` - Standalone app using auth, ui, and template packages
   - `apps/sudoku` - Game app using auth, ui, sudoku, and template packages

3. **No game-specific logic in shared packages** - Sudoku terminology and algorithms are isolated in the sudoku package only

## Complexity Tracking

✅ No Constitution violations. All architectural decisions support the constitutional principles:

- **5 packages (auth, ui, sudoku, template, shared)** - This is the minimal set needed to separate concerns:
  - `auth` is separate because it's complex, reusable, and security-critical
  - `ui` is separate because it's shared across apps with consistent styling
  - `sudoku` is separate because it's game-specific and should not exist in the template
  - `template` is separate because it's the reusable foundation other apps build on
  - `shared` contains only generic utilities with no application-specific logic

- **Monorepo approach with Turborepo** - Maintains single version control for all packages while enabling independent testing, building, and eventually publishing of packages

- **API boundaries are explicit** - Each package has a clear `index.ts` public API, preventing internal implementation details from leaking

This structure enables the template to be a complete, standalone application while also serving as a foundation for game apps or other collaborative applications.

