<!--
SYNC IMPACT REPORT
=================
Version Change: v1.0.0 → v1.1.0 (MINOR - New principle added + expanded guidance)

Modified Principles:
  - Principle III: Component-Driven Architecture → renamed to "Modular Package Architecture"
    (Expanded to cover turborepo package structure, dependency rules, and import conventions)

Added Sections:
  - New package dependency rules (apps vs packages, dependency injection over coupling)
  - Import conventions (relative imports within packages, no barrel exports)
  - Package.json export patterns (Just-in-Time pattern)

Updated Sections:
  - Quality Standards: Added monorepo-specific linting rules
  - Development Workflow: Added package development guidelines
  - Code Style & Formatting: Integrated CLAUDE.md rules

Templates Requiring Updates:
  ✅ .specify/templates/spec-template.md (updated to reference package boundaries)
  ✅ .specify/templates/plan-template.md (updated Constitution Check section)
  ✅ .specify/templates/tasks-template.md (updated to reflect package structure)

Follow-up Items:
  - None - all placeholders filled with concrete values
  - CLAUDE.md rules now integrated into constitution

Ratified: 2025-11-01 | Last Amended: 2025-11-16 | Version: 1.1.0
-->

# Sudoku Web Constitution

## Core Principles

### I. Test-First Development

Every feature must be testable and tested. The codebase maintains >99% test pass rate with comprehensive coverage across unit, integration, and component tests.

**Non-negotiable rules:**
- All new features require accompanying tests written before or concurrent with implementation
- Jest testing framework must be used for all tests
- Test setup must include proper mocks for third-party libraries (Capacitor, RevenueCat, Fetch API)
- All component tests use React Testing Library patterns
- Hook tests must verify state changes and side effects
- Skipped tests are permitted ONLY for manual/exploratory test suites that cannot be automated reliably
- When moving or changing files, test files MUST be updated to reflect the changes

**Rationale:** With 1987 passing tests across 88 test suites, this project has proven that comprehensive testing prevents regressions, documents expected behavior, and enables confident refactoring. Test coverage protects the multi-platform experience.

### II. Full TypeScript Type Safety

Every source file must be valid TypeScript with strict type checking enabled. No `any` types without explicit justification.

**Non-negotiable rules:**
- All components, hooks, helpers, and pages must export proper TypeScript types
- React component props must be typed with interfaces or type aliases
- Function parameters and return types must be explicit
- Third-party library definitions must be included (@types packages)
- Build verification: TypeScript compilation must pass with zero errors
- Breaking changes to types require MAJOR version bumps

**Rationale:** This multi-platform project (web, iOS, Android, Electron) requires robust type safety to prevent platform-specific bugs. Strong typing makes component props and API contracts explicit and maintainable across different deployment targets.

### III. Modular Package Architecture

The codebase follows a turborepo monorepo structure with strict package boundaries. Packages contain reusable functionality; apps consume packages to build applications.

**Non-negotiable rules:**

**Package Dependency Rules:**
- Apps MUST NOT be imported by packages (unidirectional dependency: packages ← apps)
- Packages MUST NOT import from other packages if dependency injection can be used instead
- Core packages (shared, types) MUST have no dependencies on feature packages (auth, template, sudoku, ui)
- Template package MUST remain game-agnostic (no sudoku-specific code)
- Sudoku package contains all game-specific logic
- Package dependency violations MUST be resolved by refactoring or extracting shared code to a lower-level package

**Import Conventions:**
- Imports from within the same package MUST use relative imports (e.g., `import { foo } from '../utils/foo'`)
- Imports from other packages MUST use package names (e.g., `import { Header } from '@bubblyclouds-app/ui'`)
- Barrel exports (index.ts files) MUST NOT be created - import directly from source files instead
- All package exports MUST be declared in package.json using the Just-in-Time package export pattern

**Component Structure:**
- React components must be functional components with hooks (no class components)
- Component files must use PascalCase naming (e.g., `SudokuInput.tsx`)
- Each component should have a single responsibility and clear prop interface
- Shared components live in packages, app-specific components in app directories
- Styling must use Tailwind CSS utility classes; no inline styles except dynamic values
- Custom hooks live in package or app `/hooks` directories and are testable in isolation
- Type definitions live in package or app `/types` directories

**Rationale:** Clear package boundaries enable code reuse across multiple applications while preventing circular dependencies. The modular architecture allows the template app to remain game-agnostic while the sudoku app extends it with game-specific features. Dependency injection over tight coupling makes packages more testable and maintainable.

### IV. Multi-Platform Compatibility

Code must be written to support web (Next.js), iOS (Capacitor), Android (Capacitor), and desktop (Electron) platforms.

**Non-negotiable rules:**
- Platform-specific code must be isolated and mockable in tests
- Browser APIs must have graceful fallbacks or platform detection
- Capacitor plugins (camera, storage, app lifecycle) must be properly mocked in test setup
- No direct DOM manipulation; use React APIs and Next.js patterns
- Features like in-app purchases (RevenueCat), notifications, and native APIs must be abstracted behind provider wrappers
- Code reviews must verify platform compatibility considerations

**Rationale:** This project serves users on four different platforms. Shared code patterns reduce duplication and maintenance burden while ensuring consistent behavior across all platforms.

### V. User-Centric Design & Accessibility

The application must be accessible and intuitive for all users, including those with disabilities.

**Non-negotiable rules:**
- Components must follow WCAG 2.1 Level AA accessibility standards
- Interactive elements must have proper ARIA labels and semantic HTML
- Keyboard navigation must work for all interactive features
- Dark mode support is required (via next-themes)
- Performance is a user experience metric: pages must load quickly and respond to input with <100ms latency
- User feedback (errors, success messages, loading states) must be clear and non-blocking

**Rationale:** Sudoku players come from diverse backgrounds and use various devices. Accessible, performant design expands the user base and improves overall product quality.

## Quality Standards

### Testing Gates

- All PRs require passing test suite (99%+ pass rate)
- New components require ≥80% line coverage in test files
- Breaking changes require test updates and documentation
- Integration tests required for: multi-platform features, state management changes, API contract changes
- After running build, all tests must pass and any issues must be fixed

### Code Style & Formatting

- ESLint and Prettier enforce consistent formatting
- TypeScript strict mode enabled in tsconfig.json
- No console.log or console.error in production code; use structured logging if needed
- Dead code must be removed; unused imports flagged by linter
- At the end of each task: run `npm run lint:fix` to fix linting issues
- Do not add unnecessary comments - code should be self-documenting with clear naming
- Markdown files must be updated if they reference something which is no longer true

### Performance Expectations

- Next.js build must complete without errors or warnings
- Page load time targets: <3s initial, <500ms navigation
- Component render should not trigger excessive re-renders
- Bundle size monitoring recommended for third-party dependencies

### Monorepo-Specific Standards

- Turborepo cache must remain valid (no cache-busting changes without justification)
- Package builds must be deterministic and cacheable
- Shared dependencies managed at workspace root; package-specific deps in package package.json
- Build order determined by Turborepo based on dependency graph

## Development Workflow

### Code Review Requirements

- All changes require PR review before merge
- Reviewers must verify: test coverage, TypeScript compliance, accessibility, multi-platform compatibility, package dependency rules
- Approval from code owner or designated reviewer required
- Automated checks (linting, tests, build) must pass

### Version Management

- Semantic Versioning: MAJOR.MINOR.PATCH
- MAJOR: Breaking changes (breaking API, removed features, type changes affecting public interfaces)
- MINOR: New features or enhancements (new components, new hooks, new pages, new packages)
- PATCH: Bug fixes, test improvements, documentation updates, refactoring without behavior change
- Version bumps documented in commit messages and CHANGELOG

### Package Development

When creating or modifying packages:

1. **Define clear responsibilities**: Each package should have a single, well-defined purpose
2. **Document public API**: Maintain README.md with exported types, components, hooks, and utilities
3. **Export configuration**: Use package.json exports field with Just-in-Time pattern
4. **Minimize dependencies**: Prefer dependency injection over hard dependencies between packages
5. **Test in isolation**: Package tests should not require importing from apps
6. **Version independently**: Packages can have different version numbers if using independent versioning

### Feature Development

1. Specification phase: Define requirements, acceptance criteria, platform considerations, package boundaries
2. Test phase: Write tests covering the specification
3. Implementation phase: Build components and integrate into appropriate package or app
4. Review phase: Code review for compliance with Constitution principles (especially package dependency rules)
5. Validation phase: Verify on all platforms (web, iOS, Android, desktop)

## Governance

### Constitution Precedence

This Constitution supersedes all other guidelines, coding standards, and project practices. In case of conflict between Constitution principles and other documentation (including CLAUDE.md), Constitution principles take priority.

### Amendment Procedure

1. **Proposal**: New principles or changes are proposed with clear rationale and impact analysis
2. **Discussion**: Team discusses implications for existing code and processes
3. **Approval**: Changes require consensus from code owners
4. **Version Bump**: Constitution version is incremented (MAJOR/MINOR/PATCH as appropriate)
5. **Implementation**: Dependent templates (spec, plan, tasks) are updated to reflect constitutional changes
6. **Documentation**: Commit message notes constitutional amendment and version change

### Compliance Review

- Constitution review occurs at quarterly intervals or after MAJOR version bumps
- All PRs must be evaluated for constitutional compliance by reviewers
- Deviations from Constitution principles must be explicitly justified in PR comments
- Systematic deviations indicate need for Constitution amendment

### Runtime Guidance

For day-to-day development decisions, refer to:
- **Code Style**: Integrated into this Constitution (Quality Standards section)
- **Project Structure**: See `project_structure` memory for directory organization
- **Tech Stack**: See `tech_stack` memory for approved libraries and tools
- **Package Dependencies**: See `dependency_structure` memory for current dependency graph
- **Testing**: Refer to test suite patterns in existing components for examples

Ambiguities not covered by Constitution should be resolved by code owners in consultation with reviewers.

---

**Version**: 1.1.0 | **Ratified**: 2025-11-01 | **Last Amended**: 2025-11-16
