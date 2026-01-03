# Feature Specification: Turborepo Monorepo Setup for Template-Based Architecture

**Feature Branch**: `002-turborepo-monorepo-setup`
**Created**: 2025-11-01
**Status**: Draft
**Input**: User description: "we likely want to introduce turborepo to import the generic template from a sub directory?"
**Prerequisite For**: `001-template-extraction` depends on this feature. Turborepo monorepo structure must be established before extracting and organizing the template in `/apps/template/`.

## User Scenarios & Testing

### User Story 1 - Configure Turborepo Monorepo Structure (Priority: P1)

As a project maintainer, I need to restructure the repository using Turborepo so that I can manage both the generic template and the Sudoku app in a unified monorepo with shared dependencies and build scripts.

**Why this priority**: This is foundational infrastructure that enables the template extraction to be efficient and maintainable. Without a monorepo structure, managing two separate repositories becomes cumbersome (duplicate dependencies, inconsistent versions, manual synchronization). Turborepo provides efficient caching, parallel builds, and clear workspace boundaries.

**Independent Test**: Can be fully tested by verifying that a developer can run Turborepo build/lint/test commands from the repository root and see both template and Sudoku apps build successfully in parallel, with clear dependency management and cached build artifacts.

**Acceptance Scenarios**:

1. **Given** Turborepo is configured, **When** a developer clones the repository and runs `npm run build`, **Then** Turborepo builds both the template and Sudoku app concurrently, using cached artifacts for unchanged packages, completing in <2 minutes
2. **Given** a developer modifies a shared type in the template, **When** they run `npm run build`, **Then** Turborepo detects the change, invalidates dependent caches, and rebuilds only affected packages without rebuilding the entire repository
3. **Given** both apps are in the monorepo, **When** a developer runs `npm run lint` from root, **Then** linting runs in parallel across all workspaces and reports any violations
4. **Given** Turborepo is configured, **When** a developer examines the repository structure, **Then** they can clearly understand the workspace boundaries: `/apps/template/`, `/apps/sudoku/`, and `/packages/` for shared code

---

### User Story 2 - Establish Workspace Boundaries and Dependencies (Priority: P2)

As a developer, I need clear, enforced boundaries between template and Sudoku workspaces so that Sudoku only imports from template (not vice versa), and all shared types/utilities are properly isolated.

**Why this priority**: Clear dependency directions prevent accidental coupling and make refactoring safer. This enables future apps to use the template without being tied to Sudoku-specific code. Turborepo's configuration makes these boundaries explicit and tooling can validate them.

**Independent Test**: Can be fully tested by verifying that Turborepo configuration enforces workspace isolation, Sudoku can import from template but template has zero imports from Sudoku code, and linting rules catch any violations at build time.

**Acceptance Scenarios**:

1. **Given** workspace boundaries are defined, **When** a Sudoku component tries to import from Sudoku-specific code, **Then** the import succeeds
2. **Given** workspace boundaries are defined, **When** a template component tries to import from Sudoku-specific code, **Then** the build fails with a clear error message about boundary violation
3. **Given** both apps share types, **When** a developer needs a shared type (e.g., User, Party), **Then** they import from `/packages/types` and the dependency graph is clear
4. **Given** Turborepo is configured, **When** linting runs, **Then** it validates that imports follow the dependency direction (Sudoku → Template, not vice versa)

---

### User Story 3 - Create Efficient Build and Development Workflows (Priority: P3)

As a developer, I need optimized dev, build, and test workflows with Turborepo caching so that local development is fast and CI/CD pipelines leverage build artifacts efficiently.

**Why this priority**: This optimizes the developer experience and CI/CD performance. Turborepo caching can reduce build times significantly, but this is an optimization that's valuable after the basic monorepo structure is working. It includes managing node_modules, setting up task dependencies, and configuring remote caching for CI.

**Independent Test**: Can be fully tested by verifying that `npm run dev` runs both apps with hot reload, `npm run build` completes in <2 minutes with caching enabled, and test runs are parallelized across workspaces.

**Acceptance Scenarios**:

1. **Given** a developer runs `npm run dev`, **When** they modify a template file, **Then** the template dev server hot-reloads and dependent apps like Sudoku also trigger a rebuild if needed
2. **Given** a developer runs `npm run build` the second time without changes, **When** Turborepo checks its cache, **Then** build completes in <30 seconds instead of minutes
3. **Given** tests are configured, **When** a developer runs `npm run test`, **Then** tests run in parallel across all workspaces with proper coverage reporting
4. **Given** the CI pipeline runs, **When** build artifacts are cached between runs, **Then** CI build time is reduced by 60% or more on unchanged code

---

### Edge Cases

- What happens when a workspace has external dependencies that conflict between template and Sudoku?
- How should the monorepo handle versioning when template and Sudoku have different version numbers?
- What happens to iOS/Android/Electron builds when they're in a monorepo vs separate repos?
- How should workspace dependency resolution work when both apps depend on different versions of the same library?

## Requirements

### Functional Requirements

**Turborepo Configuration Requirements**

- **FR-001**: Turborepo MUST be configured at repository root with a `turbo.json` file defining all workspaces and task pipelines
- **FR-002**: Turborepo MUST define workspace boundaries at `/apps/template/`, `/apps/sudoku/`, and `/packages/shared/` (or similar shared packages)
- **FR-003**: Turborepo MUST configure task pipelines (build, dev, lint, test) with clear dependency ordering
- **FR-004**: Turborepo MUST implement incremental builds where only modified packages and their dependents are rebuilt
- **FR-005**: Turborepo MUST cache build artifacts locally and invalidate cache when source files or dependencies change
- **FR-006**: Turborepo MUST support parallel execution of independent tasks across multiple workspaces

**Workspace Organization Requirements**

- **FR-007**: Template workspace MUST be located at `/apps/template/` and include all generic app code with no Sudoku references
- **FR-008**: Sudoku workspace MUST be located at `/apps/sudoku/` and extend the template with Sudoku-specific features
- **FR-009**: Shared types/utilities MUST be extracted to `/packages/shared/` (or dedicated packages) and imported by both apps
- **FR-010**: Each workspace MUST have its own `package.json`, `tsconfig.json`, and build configuration
- **FR-011**: Root `package.json` MUST list workspaces for npm and Turborepo to discover them
- **FR-012**: Each workspace MUST be buildable independently while also building within the monorepo

**Build and Development Requirements**

- **FR-013**: Build command MUST build all workspaces or specific workspaces via filter (e.g., `--filter=@bubblyclouds-app/sudoku`)
- **FR-014**: Dev command MUST run development servers for specified workspaces with hot reload enabled
- **FR-015**: Lint and test commands MUST run across all workspaces with results aggregated
- **FR-016**: Build time for unchanged code MUST be <30 seconds with Turborepo caching enabled
- **FR-017**: First build (cache miss) MUST complete in <5 minutes for all workspaces combined

**Dependency Management Requirements**

- **FR-018**: Template workspace MUST have zero dependencies on Sudoku-specific code
- **FR-019**: Sudoku workspace MUST be able to import from template via package imports (e.g., `import { useSession } from '@bubblyclouds-app/template'`)
- **FR-020**: Shared packages MUST be importable by both template and Sudoku without circular dependencies
- **FR-021**: Root `node_modules` MUST be deduplicated across all workspaces to avoid dependency conflicts
- **FR-022**: Package versions MUST be synchronized where workspaces depend on the same library

### Key Entities

**Workspace Configuration Entities**

- **Workspace**: A self-contained npm package within the monorepo. Contains `package.json`, source code, and build configuration. Examples: `/apps/template/`, `/apps/sudoku/`, `/packages/types/`.
- **Task Pipeline**: Turborepo configuration defining how tasks (build, lint, test) run across workspaces, including dependency ordering and caching rules. Defined in `turbo.json`.
- **Task Cache**: Local or remote storage of build artifacts and outputs. Turborepo uses content-based hashing to determine cache validity.
- **Workspace Dependency**: A reference from one workspace to another (e.g., Sudoku importing `@bubblyclouds-app/template`). Defined in workspace `package.json`.
- **Shared Package**: A workspace in `/packages/` that multiple apps depend on, such as `/packages/types/` or `/packages/ui/`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Turborepo configuration is complete and root `turbo.json` defines all workspaces and task pipelines
- **SC-002**: Repository has `/apps/template/` and `/apps/sudoku/` workspaces, each with independent `package.json` and build configuration
- **SC-003**: First build (cache miss) completes in <5 minutes for all workspaces combined
- **SC-004**: Subsequent builds with cache hits complete in <30 seconds for unchanged code
- **SC-005**: Build time reduction from caching is measurable: at least 60% faster on CI runs with cache hits vs cold builds
- **SC-006**: Parallel execution verified: 3+ independent tasks run simultaneously (e.g., linting all workspaces in parallel)
- **SC-007**: Workspace dependency enforcement is tested: Sudoku can import from template, but template cannot import from Sudoku, with build-time validation
- **SC-008**: Both template and Sudoku build successfully for all platforms (web, iOS, Android, Electron) from monorepo
- **SC-009**: A new developer can clone the repo, run `npm install` once, and have a working dev environment for both apps
- **SC-010**: CI pipeline leverages Turborepo caching, with build time reduction documented and baseline established

## Assumptions

1. **Turborepo is Suitable**: Turborepo is the right choice for this monorepo. Alternative solutions (Nx, Lerna, pnpm workspaces) are not under consideration. Turborepo provides the required build caching and task orchestration.

2. **Shared Types Are Extractable**: The codebase has sufficient generic types (Session<T>, Party, User, etc.) that can be extracted to `/packages/types/` without major refactoring.

3. **Platform Builds Are Compatible**: iOS, Android, and Electron build scripts can be adapted to work within a monorepo structure. Build paths and relative imports are adjustable.

4. **No Breaking Changes Required**: Existing build scripts, test runners, and CI/CD pipelines can be adapted to Turborepo without major rewrites. npm scripts are portable.

5. **Node.js and npm Versions Are Sufficient**: The project uses Node.js 18+ and npm 8+, which support workspaces natively.

6. **Dependency Conflicts Are Minimal**: Template and Sudoku have compatible versions of shared dependencies (React, Next.js, Tailwind, etc.) with no major version conflicts requiring separate node_modules.

## Out of Scope

- Migrating to pnpm or Yarn (using npm workspaces as default)
- Setting up remote caching for Turborepo (local caching only in initial phase)
- Extracting component libraries or UI packages (only shared types/utilities in this phase)
- Optimizing bundle sizes for iOS/Android builds (focus is on build process, not output optimization)
- Creating a package registry for private packages (packages stay in-repo)
- Implementing workspace-level versioning strategies (use monorepo versioning approach)
