# Architecture Documentation

This document describes the package architecture, dependency flow, and design
patterns used in the Bubbly Clouds App monorepo.

## Table of Contents

- [Package Hierarchy](#package-hierarchy)
- [Dependency Flow](#dependency-flow)
- [When to Add Code to Each Package](#when-to-add-code-to-each-package)
- [Just-in-Time Package Pattern](#just-in-time-package-pattern)
- [Import Guidelines](#import-guidelines)
- [Architectural Principles](#architectural-principles)

## Package Hierarchy

The monorepo is organized into two main categories: **packages** (reusable
libraries) and **apps** (executable applications).

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Application Layer (L6)                            │
│                                                                        │
│ ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐ ┌────────┐│
│ │  @app-sudoku     │  │@app-bubblyclouds │  │@app-        │ │@app-   ││
│ │  (Next.js App)   │  │(Next.js Website) │  │jamesacres   │ │stephen ││
│ └──────────────────┘  └──────────────────┘  │(Blog)       │ │esch    ││
│                                              └─────────────┘ │(Blog)  ││
│                                                              └────────┘│
└────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Game-Specific Layer (L5)                       │
│                                                                 │
│  ┌────────────────────────────────────────────┐                │
│  │              @sudoku                       │                │
│  │         (Sudoku game logic)                │                │
│  └────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Game Features Layer (L4)                     │
│                                                                 │
│  ┌────────────────────────────────────────────┐                │
│  │              @games                        │                │
│  │    (Game-agnostic game features)           │                │
│  └────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Collaboration Layer (L3)                       │
│                                                                 │
│  ┌────────────────────────────────────────────┐                │
│  │            @template                       │                │
│  │    (Collaborative app features)            │                │
│  └────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer (L2)                     │
│                                                                 │
│  ┌────────────────────────────────────────────┐                │
│  │              @auth                         │                │
│  │       (Authentication & users)             │                │
│  └────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Foundation Layer (L0-L1)                    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────┐  ┌────────────────┐   │
│  │     @ui      │  │     @types       │  │    @blog       │   │
│  │ UI components│  │ Type definitions │  │ Blog utilities │   │
│  └──────────────┘  └──────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Package Descriptions

#### Application Layer (L6)

- **`@bubblyclouds-app/app-sudoku`** - Production Sudoku application (Next.js)
  - Consumes all packages
  - Contains app-specific pages and routing
  - Platform builds: Web, iOS, Android, Electron
  - Depends on: All packages

- **`@bubblyclouds-app/app-bubblyclouds`** - Bubblyclouds website (Next.js)
  - Company website and landing page
  - Contains marketing and informational content
  - Platform builds: Web
  - Depends on: `@auth`, `@ui`, `@types` (and other packages as needed)

- **`@bubblyclouds-app/app-jamesacres`** - Personal blog and portfolio website (Next.js)
  - Blog content and articles using MDX
  - Personal portfolio and projects showcase
  - Platform builds: Web
  - Depends on: `@blog`, `@ui`, `@types`

- **`@bubblyclouds-app/app-stephenesch`** - Personal blog and portfolio website (Next.js)
  - Blog content and articles using MDX
  - Personal portfolio and projects showcase
  - Platform builds: Web
  - Depends on: `@blog`, `@ui`, `@types`

#### Game-Specific Layer (L5)

- **`@bubblyclouds-app/sudoku`** - Sudoku-specific game logic
  - Puzzle validation and solving algorithms
  - Grid state management
  - Timer functionality
  - Sudoku-specific UI components
  - Depends on: `@games`, `@template`, `@auth`, `@ui`, `@types`

#### Game Features Layer (L4)

- **`@bubblyclouds-app/games`** - Game-agnostic components and utilities
  - Scoring systems and leaderboards
  - Race tracking components
  - Traffic light status indicators
  - Generic game helpers
  - Depends on: `@template`, `@ui`, `@types`

#### Collaboration Layer (L3)

- **`@bubblyclouds-app/template`** - Collaborative application features
  (game-agnostic)
  - Party/group management
  - Session tracking and syncing
  - Premium features integration (RevenueCat)
  - Application infrastructure (providers, layouts)
  - Depends on: `@auth`, `@ui`, `@types`

#### Infrastructure Layer (L2)

- **`@bubblyclouds-app/auth`** - Authentication & user management
  - OAuth 2.0 with PKCE flow
  - User profile management
  - Session persistence across platforms
  - Depends on: `@ui`, `@types` (no higher-level dependencies)

#### Foundation Layer (L0-L1)

- **`@bubblyclouds-app/types`** - Shared TypeScript type definitions
  - Type definitions for shared data structures
  - Enums and constants
  - **Zero dependencies** - foundation layer

- **`@bubblyclouds-app/ui`** - Shared UI components and theming
  - Dark/light mode support
  - Layout components (Header, Footer)
  - Generic interactive components
  - Platform-specific adaptations
  - Depends on: `@types` only

- **`@bubblyclouds-app/blog`** - Blog and content management utilities
  - Blog post parsing and processing
  - MDX and markdown helpers
  - Reading time and metadata utilities
  - Blog-specific UI components
  - Depends on: `@ui`, `@types` only

**Foundation Layer Internal Dependencies:**

The Foundation Layer (L0-L1) permits same-layer dependencies for feature-specific packages:
- `@blog` depends on `@ui` because it provides blog-specific UI components and layouts
- This is distinct from higher-layer dependencies, which follow strict top-down rules
- Foundation packages are decoupled from business logic and remain reusable across applications
- New content-type packages (e.g., `@docs`, `@wiki`) would follow the same pattern

## Dependency Flow

### Foundation Layer Internal Structure

The Foundation Layer (L0-L1) has a special structure allowing internal dependencies:

```
┌─────────────────────────────────────────────────────┐
│           Foundation Layer (L0-L1)                  │
│                                                     │
│  @types                                             │
│  (no dependencies)                                  │
│    ▲                                                │
│    │                                                │
│    ├─────────────────┬──────────────────┐           │
│    │                 │                  │           │
│  @ui               @blog                │           │
│  (UI components)   (Content utils)       │           │
│                                          │           │
│  ↑ Internal dependency permitted        │           │
│  └──────────────────────────────────────┘           │
│                                                     │
│  Higher layers must NOT depend on @blog             │
│  (use @ui instead for UI components)                │
└─────────────────────────────────────────────────────┘
```

This structure enables:
- **Feature-specific foundation packages** that extend @ui for specialized use cases
- **Reusable content packages** that combine content logic with UI
- **Future content types** (@docs, @wiki, etc.) following the same pattern
- **Clean separation** from higher-layer business logic

Higher layers depend only on @ui, not on @blog or other content packages. Content-specific code is imported directly by applications (e.g., @app-jamesacres imports @blog).

### Dependency Rules

1. **Top-Down Dependencies Only**: Applications depend on packages, packages
   depend on other packages, but never the reverse
2. **Acyclic Graph**: No circular dependencies between packages
3. **Layer Respect**: Packages can only depend on packages in the same or lower
   layers
4. **Minimal Dependencies**: Each package should depend on the minimum set of
   packages needed

### Detailed Dependency Graph

```
@app-sudoku
├── @auth
├── @games
│   ├── @template
│   │   ├── @auth
│   │   ├── @ui
│   │   └── @types
│   ├── @ui
│   └── @types
├── @sudoku
│   ├── @auth
│   ├── @games
│   │   ├── @template
│   │   ├── @ui
│   │   └── @types
│   ├── @template
│   │   ├── @auth
│   │   ├── @ui
│   │   └── @types
│   ├── @ui
│   └── @types
├── @template
│   ├── @auth
│   ├── @ui
│   └── @types
├── @ui
└── @types

@app-bubblyclouds
├── @auth
│   ├── @ui
│   └── @types
├── @ui
└── @types

@app-jamesacres
├── @blog
│   ├── @ui
│   └── @types
├── @ui
└── @types

@app-stephenesch
├── @blog
│   ├── @ui
│   └── @types
├── @ui
└── @types
```

### Package.json Dependencies

Each package declares its dependencies explicitly in its `package.json`:

```json
{
  "name": "@bubblyclouds-app/sudoku",
  "dependencies": {
    "@bubblyclouds-app/auth": "workspace:*",
    "@bubblyclouds-app/games": "workspace:*",
    "@bubblyclouds-app/template": "workspace:*",
    "@bubblyclouds-app/types": "workspace:*",
    "@bubblyclouds-app/ui": "workspace:*"
  }
}
```

**Important**: If a package imports from another package, that dependency
**must** be listed in `package.json`. This ensures:

- Clear dependency tracking
- Proper build ordering
- Prevention of circular dependencies
- Type checking correctness

## When to Add Code to Each Package

### Decision Tree

```
            ┌─────────────────────┐
            │  Need to add code?  │
            └──────────┬──────────┘
                       │
      ┌────────────────┼────────────────┐
      │                                 │
 App-specific?                    Reusable?
      │                                 │
      ▼                                 ▼
┌──────────┐                  ┌──────────────┐
│ apps/    │                  │  packages/   │
│ sudoku/  │                  └──────┬───────┘
│ or       │                         │
│ bubbly   │                         │
│ clouds/  │                         │
└──────────┘                         │
                           ┌─────────┴─────────┐
                           │                   │
                     Game-specific?     Game-agnostic?
                           │                   │
             ┌─────────────┼────────┐          │
             │             │        │          │
         Sudoku-        Shared   Generic       │
         specific?      game     game          │
             │          logic?   helpers?      │
             ▼             ▼        ▼          │
      ┌──────────┐  ┌──────────┐ ┌─────────┐  │
      │ @sudoku  │  │  @games  │ │ @games  │  │
      └──────────┘  └──────────┘ └─────────┘  │
                                               │
                      ┌────────────────────────┘
                      │
            ┌─────────┴────────────┐
            │                      │
      Collaboration?            Other?
            │                      │
            ▼                      ▼
      ┌──────────┐      ┌───────────────────┐
      │@template │      │ @ui, @auth,       │
      └──────────┘      │ @types            │
                        └───────────────────┘
```

### Package-Specific Guidelines

#### `@bubblyclouds-app/types`

**Add here when:**

- Defining shared type definitions used across multiple packages
- Creating enums or constants referenced by multiple packages
- Defining interfaces for data structures used by multiple packages

**Examples:**

```typescript
// packages/types/src/serverTypes.ts
export interface Party {
  partyId: string;
  createdBy: string;
  members: PartyMember[];
}

export enum PlatformType {
  WEB = "web",
  IOS = "ios",
  ANDROID = "android",
  ELECTRON = "electron",
}
```

**Do NOT add:**

- Implementation code (only types/interfaces)
- Package-specific types (keep those local)

#### `@bubblyclouds-app/ui`

**Add here when:**

- Creating generic, reusable UI components
- Building layout components (headers, footers, navigation)
- Implementing theme/styling utilities
- Creating platform-agnostic UI helpers

**Examples:**

- `Header`, `Footer` - Layout components
- `ThemeSwitch` - Theme controls
- `CopyButton` - Generic interactive component

**Do NOT add:**

- Business logic
- Game-specific components
- Authentication flows (use `@auth`)
- Collaboration features (use `@template`)

#### `@bubblyclouds-app/auth`

**Add here when:**

- Implementing authentication flows (OAuth, email)
- Managing user sessions and profiles
- Creating auth-related UI components (login, user menu)
- Building auth-related hooks and utilities

**Examples:**

- `UserProvider` - Authentication context
- `UserButton`, `UserPanel` - Auth UI components
- `useAuth` - Authentication hook

**Do NOT add:**

- Non-auth related features
- Application-specific logic
- Generic UI components (use `@ui`)

#### `@bubblyclouds-app/template`

**Add here when:**

- Building collaborative features (parties, sessions)
- Creating game-agnostic application infrastructure
- Implementing premium/subscription features
- Building providers for shared app state

**Examples:**

- `SessionsProvider` - Session management
- `PartyProvider` - Party/group management
- `RevenueCatProvider` - Premium features
- Global state management

**Do NOT add:**

- Game-specific logic (use `@sudoku` or `@games`)
- Generic UI components (use `@ui`)
- Auth flows (use `@auth`)

#### `@bubblyclouds-app/games`

**Add here when:**

- Creating game-agnostic scoring systems
- Building leaderboard components
- Implementing competitive features (racing, rankings)
- Creating generic game utilities

**Examples:**

- `Leaderboard` - Generic leaderboard component
- `ScoreBreakdown` - Score display component
- `scoringUtils` - Scoring calculations
- `RaceTrack` - Racing visualization

**Do NOT add:**

- Sudoku-specific logic (use `@sudoku`)
- Non-game features (use `@template`)
- Generic UI (use `@ui`)

#### `@bubblyclouds-app/sudoku`

**Add here when:**

- Implementing Sudoku game rules and validation
- Creating Sudoku-specific UI components
- Building puzzle generation/solving algorithms
- Managing Sudoku game state

**Examples:**

- `SudokuGrid` - Grid component
- `SudokuInput` - Number input component
- Grid validation logic
- Puzzle solver algorithms

**Do NOT add:**

- Generic game features (use `@games`)
- Non-sudoku game logic
- Generic components (use `@ui`)

#### `apps/sudoku`

**Add here when:**

- Creating Next.js pages and routes for the Sudoku app
- Implementing Sudoku app-specific page layouts
- Configuring Sudoku app settings (Next.js config, Capacitor, etc.)
- Creating one-off features specific to this app deployment

**Examples:**

- `/app/page.tsx` - Home page
- `/app/puzzle/page.tsx` - Puzzle page
- `next.config.js` - App configuration

**Do NOT add:**

- Reusable components (extract to packages)
- Business logic (belongs in packages)

#### `@bubblyclouds-app/blog`

**Add here when:**

- Creating blog post metadata parsing and processing utilities
- Building blog-specific UI components (post cards, blog layout, etc.)
- Implementing blog helpers (reading time, excerpt generation, date formatting)
- Creating content type management utilities
- Defining blog-specific types and interfaces

**Examples:**

- `BlogPostCard` - Blog post display component
- `readingTime` helper - Calculate reading time utility
- `parsePostMetadata` - Extract frontmatter from MDX

**Do NOT add:**

- Content files (store in apps/jamesacres)
- Non-blog-specific UI (use `@ui`)
- Business logic from higher layers (this is a foundation package)
- Application-specific routes or pages (use app-jamesacres)

**Special Considerations:**

- @blog is a Foundation Layer (L0-L1) package and can depend on @ui
- Higher-layer packages must NOT depend on @blog
- Applications import @blog directly as needed
- Keep @blog reusable for any blog-focused application

#### `apps/bubblyclouds`

**Add here when:**

- Creating Next.js pages and routes for the Bubblyclouds website
- Implementing website-specific page layouts
- Configuring website settings (Next.js config, etc.)
- Creating marketing and informational content

**Examples:**

- `/app/page.tsx` - Landing page
- `/app/about/page.tsx` - About page
- `next.config.js` - App configuration

**Do NOT add:**

- Reusable components (extract to packages)
- Business logic (belongs in packages)

## Just-in-Time Package Pattern

The Just-in-Time (JIT) pattern is a key architectural pattern in this monorepo
that enables fast development without compilation overhead.

### What is the Just-in-Time Pattern?

Instead of compiling packages to JavaScript before consumption, packages export
their **TypeScript source files directly** through granular `exports` paths in
`package.json`. TypeScript resolution and compilation happen just-in-time by the
consuming application's build process.

### How It Works

#### Traditional Compiled Pattern

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Package    │      │  Compiled    │      │  Consuming   │
│  TypeScript  │─────>│  JavaScript  │─────>│     App      │
│              │      │   (dist/)    │      │              │
└──────────────┘      └──────────────┘      └──────────────┘
     Source              Build Step          Import & Use
```

#### Just-in-Time Pattern

```
┌──────────────┐                            ┌──────────────┐
│   Package    │                            │  Consuming   │
│  TypeScript  │───────────────────────────>│     App      │
│   (src/)     │    Direct Source Import    │              │
└──────────────┘                            └──────────────┘
     Source                                  JIT Compilation
```

### Package.json Exports Configuration

Each package defines granular exports pointing to source files:

```json
{
  "name": "@bubblyclouds-app/games",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx",
    "./helpers/*": "./src/helpers/*.ts",
    "./types/*": "./src/types/*.ts"
  }
}
```

This configuration enables:

1. **Root exports**: `import { something } from '@bubblyclouds-app/games'`
2. **Direct component imports**:
   `import { Leaderboard } from '@bubblyclouds-app/games/components/Leaderboard'`
3. **Direct helper imports**:
   `import { calculateScore } from '@bubblyclouds-app/games/helpers/scoringUtils'`
4. **Direct type imports**:
   `import type { ScoringResult } from '@bubblyclouds-app/games/types/scoringTypes'`

### Benefits

1. **No Build Step Required**
   - Packages don't need to be compiled
   - Changes are immediately available to consuming apps
   - Faster development iteration

2. **Single Compilation Pass**
   - TypeScript is compiled once by the consuming app
   - Optimized bundling happens at the app level
   - Better tree-shaking and dead code elimination

3. **True Type Safety**
   - Apps consume actual TypeScript source
   - Full IDE autocomplete and type checking
   - No type definition synchronization issues

4. **Simpler Debugging**
   - Source maps point directly to package source
   - No dist/ folder confusion
   - Clear stack traces

5. **Faster Turborepo Caching**
   - No intermediate build artifacts
   - Simpler cache invalidation
   - Faster cache hits

### Implementation Requirements

For the JIT pattern to work correctly:

#### 1. Package Configuration

```json
{
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./components/*": "./src/components/*.tsx",
    "./helpers/*": "./src/helpers/*.ts",
    "./types/*": "./src/types/*.ts"
  }
}
```

#### 2. TypeScript Configuration

Root `tsconfig.json` must include all package paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@bubblyclouds-app/games": ["./packages/games/src/index.ts"],
      "@bubblyclouds-app/games/*": ["./packages/games/src/*"]
    }
  }
}
```

#### 3. Source Structure

Each package must have a consistent structure:

```
packages/games/
├── src/
│   ├── index.ts              # Main entry point
│   ├── components/
│   │   ├── Leaderboard.tsx
│   │   └── ScoreBreakdown.tsx
│   ├── helpers/
│   │   └── scoringUtils.ts
│   └── types/
│       └── scoringTypes.ts
└── package.json
```

#### 4. No Index Files

**Do NOT** create `index.ts` files in subdirectories:

```typescript
// ❌ BAD - Do not create packages/games/src/components/index.ts
export { Leaderboard } from "./Leaderboard";
export { ScoreBreakdown } from "./ScoreBreakdown";

// ✅ GOOD - Import directly from source file
import { Leaderboard } from "@bubblyclouds-app/games/components/Leaderboard";
```

Index files defeat the purpose of JIT by creating unnecessary re-exports.

### Export Patterns

Different file types require different export patterns:

```json
{
  "exports": {
    "./components/*": "./src/components/*.tsx",
    "./helpers/*": "./src/helpers/*.ts",
    "./config/*": [
      "./src/config/*.ts",
      "./src/config/*.tsx"
    ]
  }
}
```

Use arrays when a directory might contain multiple file extensions.

## Import Guidelines

### Internal Package Imports (Within Same Package)

Always use **relative imports**:

```typescript
// ✅ GOOD - In packages/games/src/components/Leaderboard.tsx
import { calculateScore } from "../helpers/scoringUtils";
import type { ScoringResult } from "../types/scoringTypes";

// ❌ BAD - Do not use package name for internal imports
import { calculateScore } from "@bubblyclouds-app/games/helpers/scoringUtils";
```

### Cross-Package Imports

Always use **absolute package imports**:

```typescript
// ✅ GOOD - In packages/sudoku/src/components/Sudoku.tsx
import { Leaderboard } from "@bubblyclouds-app/games/components/Leaderboard";
import { useAuth } from "@bubblyclouds-app/auth/hooks/useAuth";
import type { Party } from "@bubblyclouds-app/types/serverTypes";

// ❌ BAD - Do not use relative imports across packages
import { Leaderboard } from "../../../games/src/components/Leaderboard";
```

### Import from Source Files

Always import **directly from the source file**:

```typescript
// ✅ GOOD - Direct file imports
import { Leaderboard } from "@bubblyclouds-app/games/components/Leaderboard";
import { calculateScore } from "@bubblyclouds-app/games/helpers/scoringUtils";

// ❌ BAD - Do not import from package root (unless explicitly exported)
import { Leaderboard } from "@bubblyclouds-app/games";
```

### No Re-exports for Convenience

Do not create re-export files for convenience:

```typescript
// ❌ BAD - Do not create packages/games/src/index.ts with:
export { Leaderboard } from "./components/Leaderboard";
export { ScoreBreakdown } from "./components/ScoreBreakdown";
export { calculateScore } from "./helpers/scoringUtils";

// ✅ GOOD - Import directly from source
import { Leaderboard } from "@bubblyclouds-app/games/components/Leaderboard";
import { ScoreBreakdown } from "@bubblyclouds-app/games/components/ScoreBreakdown";
import { calculateScore } from "@bubblyclouds-app/games/helpers/scoringUtils";
```

### Type-Only Imports

Use `type` keyword for type-only imports when possible:

```typescript
// ✅ GOOD - Explicit type imports
import type { Party } from "@bubblyclouds-app/types/serverTypes";
import type { ScoringResult } from "@bubblyclouds-app/games/types/scoringTypes";

// ⚠️ ACCEPTABLE - But less explicit
import { Party } from "@bubblyclouds-app/types/serverTypes";
```

## Architectural Principles

### 1. Separation of Concerns

Each package has a single, well-defined responsibility:

- `@types` - Type definitions only
- `@ui` - Visual components only
- `@auth` - Authentication only
- `@template` - Collaboration infrastructure
- `@games` - Game-agnostic game features
- `@sudoku` - Sudoku-specific logic

### 2. Dependency Inversion

High-level packages should not depend on low-level packages. Both should depend
on abstractions (types):

```typescript
// ✅ GOOD - Both depend on @types
import type { Party } from "@bubblyclouds-app/types/serverTypes";

function createParty(): Party {
  // Implementation
}
```

### 3. Game-Agnostic Core

The `@template` package must remain game-agnostic to enable building other types
of applications:

```typescript
// ❌ BAD - In @template package
import { SudokuGrid } from "@bubblyclouds-app/sudoku/components/SudokuGrid";

// ✅ GOOD - Generic, reusable
import { SessionsProvider } from "@bubblyclouds-app/template/providers/SessionsProvider";
```

### 4. Explicit Dependencies

All dependencies must be explicitly declared in `package.json`:

```json
{
  "dependencies": {
    "@bubblyclouds-app/auth": "workspace:*",
    "@bubblyclouds-app/types": "workspace:*"
  }
}
```

**Never** import from a package not listed in your dependencies.

### 5. No Circular Dependencies

Packages form a directed acyclic graph (DAG):

```
Layer 6:  @app-sudoku, @app-bubblyclouds
              ↓
Layer 5:  @sudoku
              ↓
Layer 4:  @games
              ↓
Layer 3:  @template
              ↓
Layer 2:  @auth
              ↓
Layer 0-1: @ui, @types
```

The full dependency tree:

```
@types (no dependencies)
  ↑
@ui (depends on @types)
  ↑
@blog (depends on @ui, @types)
  ↑
@auth (depends on @ui, @types)
  ↑
@template (depends on @auth, @ui, @types)
  ↑
@games (depends on @template, @ui, @types)
  ↑
@sudoku (depends on @games, @template, @auth, @ui, @types)
  ↑
@app-sudoku (depends on all packages)
@app-bubblyclouds (depends on @auth, @ui, @types)
@app-jamesacres (depends on @blog, @ui, @types)
```

Circular dependencies are prevented by:

- Clear layering (L0-L1 Foundation → L2 Infrastructure → L3 Collaboration → L4 Game Features → L5 Game-Specific → L6 Applications)
- Each package only depends on packages in lower layers
- Dependency checking (`pnpm run circular`)
- Code review

### 6. Type Safety Without Casting

Prefer proper typing over type casting:

```typescript
// ❌ BAD - Using 'any' or casting
const result = someFunction() as SomeType;

// ✅ GOOD - Proper typing with generics
function someFunction<T>(): T {
  // Implementation
}
```

### 7. No Comments for Obvious Code

Code should be self-documenting. Only add comments for complex logic:

```typescript
// ❌ BAD - Unnecessary comment
// Get the user ID
const userId = user.id;

// ✅ GOOD - Comment explains why, not what
// Use exponential backoff to avoid rate limiting
await retryWithBackoff(() => api.call());
```

## Verification Commands

Run these commands to verify architectural integrity:

```bash
# Check for circular dependencies in all packages
pnpm run circular

# Type check everything
pnpm run type-check

# Build to verify imports resolve correctly
pnpm run build

# Run tests to verify package integration
pnpm test
```

## Summary

- **8 packages** organized in **7 layers** (L0-L6):
  - L0-L1: Foundation (`@types`, `@ui`, `@blog`)
    - `@types`: Zero dependencies, foundational types
    - `@ui`: Generic UI components, depends on `@types`
    - `@blog`: Content utilities, depends on `@ui` and `@types`
    - **Note:** Foundation Layer permits same-layer dependencies for feature packages
  - L2: Infrastructure (`@auth`)
  - L3: Collaboration (`@template`)
  - L4: Game Features (`@games`)
  - L5: Game-Specific (`@sudoku`)
  - L6: Applications (`@app-sudoku`, `@app-bubblyclouds`, `@app-jamesacres`, `@app-stephenesch`)
- **4 apps** consuming packages as needed
- **Just-in-Time pattern** for fast development without build steps
- **Clear dependency flow** enforced by package.json and tooling
- **Explicit guidelines** for where to add each type of code
- **Direct source imports** from packages, no re-exports
- **Content-specific packages** (like @blog) are extensible pattern for future use

This architecture enables:

- Fast development iteration
- Clear code organization
- Reusable components across apps
- Type-safe imports
- Easy debugging and maintenance
- Scalable addition of new games, content types, or apps
