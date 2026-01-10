# Feature Specification: Modular Turborepo Architecture

**Feature Branch**: `003-modular-turborepo-architecture`
**Created**: 2025-11-02
**Status**: Draft
**Input**: User description: "it seems to me that we can do better, turbo repo might be better organised using packages, e.g. put all the auth stuff in an auth package, put all the sudoku components in a sudoku package? then the apps should be sudoku and template, the template itself should compile and include the auth page, header and footer and be able to open in browser and view user and their template sessions and invite someone to a party. the sudoku app should extend this template with the same header, footer, theme, user etc and import the packages for auth and other generic components along with the sudoku specific ones. ultimately we want to clearly separate concerns so this repo can be used to create another app without the sudoku logic. currently there are still mentions of sudoku and things like the split cell id are sudoku specific but are in the template currently"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Template App Standalone Usage (Priority: P1)

A developer wants to use the template application as a complete, self-contained web application that manages user authentication, accounts, and collaborative sessions without any game-specific logic. They should be able to clone the repository, build the template app, and have a fully functional multi-user platform where they can view their profile, manage sessions with other users, and invite people to join collaborative sessions/parties.

**Why this priority**: This is the foundation of the entire architecture restructuring. It demonstrates that the codebase can support multiple applications and establishes the separation of concerns that enables reusability.

**Independent Test**: Template app compiles standalone, users can log in, view their profile and sessions, create and manage parties, and invite collaborators without any sudoku-specific code being present or required.

**Acceptance Scenarios**:

1. **Given** a developer has the repository cloned, **When** they navigate to apps/template and run the build, **Then** the template application compiles successfully without errors or sudoku references
2. **Given** a user is logged into the template app, **When** they navigate to their profile, **Then** they see their user information and account settings
3. **Given** a user is logged into the template app, **When** they view their sessions, **Then** they see a list of all their collaborative sessions and parties
4. **Given** a user is on the parties view, **When** they create a new party, **Then** a new party is created and they are the owner
5. **Given** a user owns a party, **When** they invite another user via email or link, **Then** the other user receives an invitation and can join the party

---

### User Story 2 - Sudoku App Extends Template (Priority: P1)

A developer wants the sudoku application to reuse all the authentication, header, footer, theme, and user management functionality from the template package, while adding sudoku-specific components and logic. The sudoku app should have the same look and feel as the template with the same user authentication flow, but with additional sudoku game components layered on top.

**Why this priority**: This demonstrates that the architecture properly supports app composition and package reuse, allowing the sudoku app to build on top of the template foundation without code duplication.

**Independent Test**: Sudoku app builds successfully, includes all template functionality (auth, user management, parties), and adds sudoku-specific components while maintaining consistent theming and user experience.

**Acceptance Scenarios**:

1. **Given** the sudoku app is built, **When** a user navigates to it, **Then** they see the same header, footer, and theme styling as the template app
2. **Given** a user in the sudoku app, **When** they access their account, **Then** they see the same profile and session management as the template app
3. **Given** a user in the sudoku app, **When** they create a racing party, **Then** they can invite friends to solve puzzles together
4. **Given** a user in the sudoku app, **When** they navigate to the sudoku game, **Then** sudoku-specific components render correctly
5. **Given** both apps are running, **When** a user logs in on one, **Then** their session is consistent across both (same user context)

---

### User Story 3 - Clear Package Organization (Priority: P1)

A developer needs to understand the architecture at a glance by looking at the packages directory. Each package should have a single, clear responsibility (authentication, UI components, shared utilities, etc.). There should be no cross-package circular dependencies, and sudoku-specific logic should not exist in shared or core packages.

**Why this priority**: Clear organization enables faster onboarding, reduces bugs, and makes it possible to extract this architecture for use in other applications in the future.

**Independent Test**: Architecture documentation and code structure make it immediately clear what each package is responsible for, sudoku references are isolated to sudoku-specific packages, and dependency analysis shows no circular dependencies.

**Acceptance Scenarios**:

1. **Given** a developer reviews the packages directory, **When** they read the package.json and README of each package, **Then** they understand its specific purpose and what it contains
2. **Given** the sudoku app is examined, **When** searching the codebase for game-specific code, **Then** all sudoku logic is either in the sudoku app itself or in a dedicated sudoku package
3. **Given** the template is examined, **When** searching for game-specific references, **Then** no sudoku-specific logic or terminology (e.g., "cell", "puzzle") exists in core/shared packages
4. **Given** a developer maps the package dependencies, **When** they analyze the graph, **Then** they find no circular dependencies and a clear hierarchical structure

---

### User Story 4 - Extract Sudoku Logic from Shared Packages (Priority: P2)

Currently, game-specific logic and terminology (like "split cell ID") exists in shared packages where it shouldn't. All sudoku-specific utilities, helpers, and types should be moved to sudoku-specific packages, making shared packages truly generic.

**Why this priority**: This enables the shared packages and template to be truly reusable for other applications beyond sudoku games.

**Independent Test**: All game-specific terminology and logic has been removed from core/shared packages and relocated to appropriate sudoku-specific packages. Shared packages contain only generic, application-agnostic functionality.

**Acceptance Scenarios**:

1. **Given** the shared utilities package, **When** searching for "sudoku", "cell", "puzzle", or "grid" references, **Then** no results are found
2. **Given** a helper function that is sudoku-specific (e.g., cell validation), **When** examining its location, **Then** it resides in a sudoku package, not shared
3. **Given** type definitions in the template, **When** reviewing them, **Then** they are generic enough to apply to any application

---

### User Story 5 - Theme and UI Components Reusability (Priority: P2)

All theme-related code, header, footer, and generic UI components should be extracted into a reusable UI package that both the template and sudoku apps import. This ensures visual consistency and reduces duplication.

**Why this priority**: This enables multiple apps to share the same design system and reduces maintenance burden.

**Independent Test**: Header, footer, and theme components are available in a shared UI package, both template and sudoku apps import from this package, and both render with consistent styling.

**Acceptance Scenarios**:

1. **Given** a UI component package exists, **When** both template and sudoku apps import from it, **Then** the components render consistently in both
2. **Given** a user switches between template and sudoku apps, **When** they observe the header and footer, **Then** they appear identical in styling and structure

---

### User Story 6 - Authentication Package Reusability (Priority: P2)

All authentication logic should be extracted into a dedicated auth package. Both the template and sudoku apps should import and use this package, ensuring consistent authentication flows across applications.

**Why this priority**: This prevents authentication logic duplication and ensures security patterns are consistent across all applications built with this architecture.

**Independent Test**: Auth package contains all authentication logic, both apps successfully import and use it, and authentication flows are identical across both applications.

**Acceptance Scenarios**:

1. **Given** an auth package exists, **When** both template and sudoku apps initialize, **Then** they both use the same authentication flows
2. **Given** a user logs in on one app, **When** they switch to another, **Then** they remain logged in with the same user context

---

### Edge Cases

- What happens when a new app wants to use the template architecture without needing authentication (e.g., a demo/preview mode)?
- How should packages handle shared configuration (API endpoints, environment variables) when multiple apps exist?
- What happens if a sudoku-specific package is accidentally imported into the template app?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST organize code into distinct packages within a `packages/` directory, with each package having a single clear responsibility
- **FR-002**: System MUST provide an `auth` package containing all authentication logic (login, logout, session management, token handling)
- **FR-003**: System MUST provide a `ui` package containing reusable UI components (header, footer, theme, shared buttons, modals)
- **FR-004**: System MUST provide a `sudoku` package containing all game-specific logic and components
- **FR-005**: System MUST provide a `shared` or `utils` package containing generic utilities and types that apply to any application
- **FR-006**: System MUST ensure the `template` app is fully functional as a standalone application with user authentication, profile management, session viewing, party creation, and invitations
- **FR-007**: System MUST ensure the `sudoku` app extends the template by importing auth, ui, and shared packages while adding sudoku-specific functionality
- **FR-008**: System MUST prevent circular dependencies between packages
- **FR-009**: System MUST remove all sudoku-specific terminology and logic from shared/core packages
- **FR-010**: System MUST ensure all packages export their public APIs through well-defined entry points (index.ts)
- **FR-011**: System MUST configure TypeScript path aliases for easy imports across packages
- **FR-012**: System MUST ensure that removing sudoku-specific code does not break the template app
- **FR-013**: System MUST maintain consistent user context and theming across all applications

### Key Entities *(include if feature involves data)*

- **Package**: A self-contained unit of code with a single responsibility, defined by package.json
- **Auth Package**: Contains authentication flows, session management, and user context providers
- **UI Package**: Contains reusable visual components (header, footer, theme, buttons, dialogs)
- **Sudoku Package**: Contains all game-specific logic, components, and utilities
- **Shared Package**: Contains generic utilities, types, and helpers applicable to any application
- **Template App**: A standalone web application demonstrating user management and collaborative features without game logic
- **Sudoku App**: A web application that extends the template with sudoku game functionality

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Template app builds and runs independently without any sudoku references in the codebase
- **SC-002**: Sudoku app builds successfully and inherits all template functionality (authentication, UI, user management)
- **SC-003**: All game-specific logic is isolated to sudoku-specific packages or the sudoku app itself
- **SC-004**: Shared packages contain zero references to sudoku terminology (cell, puzzle, grid, gameboard, etc.)
- **SC-005**: Dependency graph shows no circular dependencies between packages
- **SC-006**: Both template and sudoku apps render with identical header, footer, and theme styling
- **SC-007**: A developer can understand the entire architecture by reading package READMEs (takes under 15 minutes)
- **SC-008**: Template app supports user authentication, profile viewing, session management, party creation, and invitations - all independently testable
- **SC-009**: 100% of test suites pass with the new package structure
- **SC-010**: Documentation clearly explains how to create a new application using this architecture

## Assumptions

1. **Monorepo Tool**: Turborepo is the preferred monorepo tool (already in use)
2. **Package Manager**: npm is the package manager (already in use)
3. **Build System**: Next.js is used for web applications (already in use)
4. **TypeScript**: TypeScript is the primary language (already in use)
5. **Authentication**: OAuth2/session-based authentication is acceptable (current approach)
6. **Shared State**: Context API or similar is acceptable for shared state management
7. **Styling**: Tailwind CSS or similar utility-first approach is acceptable (already in use)
8. **Testing**: Jest is the test framework (already established)
9. **Party/Collaboration**: "Party" and "session" are generic collaborative session concepts applicable to any game or application
10. **Backwards Compatibility**: Public APIs of packages will be versioned appropriately for backwards compatibility

## Future Considerations

- Package versioning strategy for independent package releases
- Documentation site explaining the architecture
- Template for creating new applications using this architecture
- CI/CD pipeline for building and testing all packages and apps independently
