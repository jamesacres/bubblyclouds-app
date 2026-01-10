# Feature Specification: Template Extraction for Multi-App Platform

**Feature Branch**: `001-template-extraction`
**Created**: 2025-11-01
**Status**: Draft
**Input**: User description: "read TEMPLATE_REFACTOR_SPEC.md and use this to build the spec"
**Dependencies**: Requires `002-turborepo-monorepo-setup` to be completed first. Template extraction should occur within a monorepo structure to manage both template and Sudoku apps efficiently.

## User Scenarios & Testing

### User Story 1 - Create Reusable Template Repository (Priority: P1)

As a developer building new apps on the Sudoku platform, I need a generic template repository with core infrastructure so that I can bootstrap new applications without duplicating auth, user management, and payment systems.

**Why this priority**: This is the foundational work. Without a reusable template, future apps will require significant code duplication and inconsistent architectures. This creates the core infrastructure that all other stories depend on.

**Independent Test**: Can be fully tested by creating a new Next.js app using the template, verifying that auth, user profile, theme switching, and basic navigation work without any Sudoku-specific code, and that the app builds successfully on all platforms (web, iOS, Android, Electron).

**Acceptance Scenarios**:

1. **Given** a developer wants to start a new app, **When** they clone the template repository and run setup, **Then** they have a working app with 3-tab navigation, authentication, user profile, and theme switching with zero Sudoku code present
2. **Given** a template app is running, **When** a user logs in, **Then** the session is created, persisted, and user profile is displayed
3. **Given** a template app is running, **When** a user toggles dark/light theme, **Then** the preference is saved and restored on app restart
4. **Given** the template is built, **When** it compiles for web/iOS/Android/Electron targets, **Then** all platforms build successfully without errors

---

### User Story 2 - Generic Session & Party System (Priority: P2)

As an app developer extending the template, I need generic session and party management systems with extensible data types so that I can add game-specific or domain-specific session logic without modifying the base template.

**Why this priority**: Session management is core functionality for multiplayer experiences. A reusable, generic system enables different apps (Sudoku racing, trivia competitions, collaboration tools) to all use the same infrastructure while adding their own data.

**Independent Test**: Can be fully tested by verifying that a user can create a solo session, join a party via invite code, and synchronize state with other party members, without requiring any Sudoku-specific game logic. The template's session type system should use TypeScript generics so Sudoku (or any other app) can extend it with custom state shapes.

**Acceptance Scenarios**:

1. **Given** a template app is running, **When** a user creates a new session, **Then** a session is created with a unique ID and the user is marked as the session owner
2. **Given** a session exists, **When** the user creates a party and invites another user via invite code, **Then** an invite link is generated, the second user can join, and party state synchronizes in real-time
3. **Given** a user is a party member, **When** they create a session within the party, **Then** that session is linked to the party and all members can see each other's session state
4. **Given** session and party types are defined, **When** Sudoku extends them (e.g., `SudokuSession extends Session<ServerState>`), **Then** the custom state type is properly typed and accessible in hooks like `useSession<ServerState>()`

---

### User Story 3 - Refactor Sudoku to Use Template (Priority: P3)

As a Sudoku app maintainer, I need to refactor the Sudoku codebase to depend on the template repository so that Sudoku benefits from shared infrastructure updates and the codebase focuses only on Sudoku-specific features.

**Why this priority**: This is an optimization of the existing Sudoku app to leverage the new template. It's valuable but only after the template is production-ready, because it requires significant refactoring and comprehensive testing to ensure no regressions.

**Independent Test**: Can be fully tested by verifying that all existing Sudoku features (daily puzzles, racing, leaderboards, book system, invites) continue to work without regression, and that Sudoku code is cleanly isolated in `src/sudoku/` directory while using generic components/hooks from the template.

**Acceptance Scenarios**:

1. **Given** Sudoku app is refactored, **When** a user plays a daily puzzle, **Then** all game mechanics, scoring, timer, and state persistence work identically to the pre-refactor version
2. **Given** Sudoku is using the template, **When** a user invites a friend to race, **Then** the generic party system is used and the race extends party state with Sudoku puzzle data
3. **Given** Sudoku imports generic hooks, **When** a component calls `useSudokuSession()`, **Then** it returns a session extended with `ServerState` type (Sudoku-specific game state)
4. **Given** Sudoku code is organized, **When** a developer navigates the codebase, **Then** all Sudoku-specific logic is found in `src/sudoku/`, all template features come from the template package, and imports are clean and explicit

---

### Edge Cases

- What happens when a session/party type extension is incompatible with the template version (e.g., app uses `ServerState` type that no longer exists)?
- How does the system handle users who joined a party but the party data structure changed between versions?
- What happens when a developer misconfigures the template extension points (e.g., provides invalid tab configurations)?
- How does the invitation system work if the inviting user is offline or their app crashes before sending the invite?

## Requirements

### Functional Requirements

**Template Repository Requirements**

- **FR-001**: Template MUST provide a working 3-tab navigation structure (Home, Sessions, Friends) that is visually consistent and extensible
- **FR-002**: Template MUST provide a complete authentication system with session management and token refresh (authentication method provided by backend)
- **FR-003**: Template MUST provide user profile management including display name, avatar, and user preferences
- **FR-004**: Template MUST implement a theme system supporting light/dark mode with persistence and system preference detection
- **FR-005**: Template MUST provide a generic Session<T> type with TypeScript generics to enable app-specific state extensions
- **FR-006**: Template MUST provide a generic Party system with member management, invite codes, and party state synchronization
- **FR-007**: Template MUST include Capacitor integration for iOS and Android with graceful web fallbacks
- **FR-008**: Template MUST include Electron integration for desktop app deployment
- **FR-009**: Template MUST provide RevenueCat integration for in-app purchases and subscription management
- **FR-010**: Template MUST include error boundaries and global error handling with user-friendly messages
- **FR-011**: Template MUST provide hook-based APIs for accessing auth, user, session, and party features
- **FR-012**: Template MUST support configuration via AppConfig interface allowing theme, feature flags, and custom tabs
- **FR-013**: Template MUST provide helper functions for session creation/joining, party state sync, and invite handling

**Sudoku Refactor Requirements**

- **FR-014**: Sudoku app MUST import and use template for all authentication and user management features
- **FR-015**: Sudoku app MUST extend generic Session<T> type with ServerState to add puzzle, timer, and scoring data
- **FR-016**: Sudoku app MUST extend generic Party system with Sudoku-specific racing and competition features
- **FR-017**: Sudoku app MUST organize all Sudoku-specific components, hooks, and types in `src/sudoku/` directory
- **FR-018**: Sudoku app MUST maintain 100% feature parity with pre-refactor version (no regressions)
- **FR-019**: Sudoku app MUST continue to support all platforms (web, iOS, Android, Electron) with identical behavior
- **FR-020**: Sudoku app MUST use template components as base classes for SessionRow and PartyRow (SudokuSessionRow, SudokuPartyRow)

### Key Entities

**Generic Template Entities**

- **Session<T>**: A generic container for user's activity session with extensible state of type T. Contains sessionId, state, and updatedAt timestamp. Enables apps to define `Session<GameState>` or `Session<DocumentEdits>`.
- **Party**: A group of users collaborating in one or more sessions. Contains partyId, members list, owner, party name, creation timestamp, and optional metadata for app-specific features.
- **Member**: A user within a party. Contains userId, displayName, isOwner, isUser flags, and timestamps. Enables permission management and role definition.
- **Invite**: A shareable link for inviting users to parties. Contains invite code, inviter ID, party reference, and optional expiration. Supports deep linking.
- **User**: A user account with authentication and profile data. Contains userId, email, displayName, avatar, preferences, and authentication tokens.

**Sudoku-Specific Entities (Extending Template)**

- **ServerState extends GameState**: Sudoku's session state extending the generic type. Adds timer, puzzle difficulty, completion metadata, notes, and scoring information to the base GameState.
- **SudokuSession extends Session<ServerState>**: A sudoku game session. Uses the generic Session type with Sudoku's ServerState as the state extension.
- **SudokuParty extends Party**: A Sudoku racing/competition party. Uses the generic Party type and adds Sudoku-specific features like race start time, puzzle difficulty, difficulty selection, and leaderboard data.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Template repository runs standalone as a complete functional app with zero Sudoku-specific code or dependencies
- **SC-002**: A new developer can set up the template, build it for all platforms (web, iOS, Android, Electron), and have a working app in under 30 minutes
- **SC-003**: Template provides TypeScript generic types enabling any app to extend Session and Party types without modifying template code
- **SC-004**: All existing Sudoku features (daily puzzles, racing, leaderboards, invites, book system, timer) continue to function identically after refactoring with zero regressions
- **SC-005**: Sudoku code is organized cleanly with all Sudoku-specific logic isolated in `src/sudoku/` directory (target: 80%+ of game logic in `src/sudoku/`)
- **SC-006**: Template provides documentation with examples showing how to extend it for new features (minimum: README, configuration guide, at least 2 extension examples)
- **SC-007**: All platforms (web, iOS, Android, Electron) build successfully for both template and refactored Sudoku app with zero warnings
- **SC-008**: Test suite passes with >99% coverage for template auth, user, session, and party features
- **SC-009**: Template and Sudoku builds result in no increase to app bundle size (compare before/after refactor)
- **SC-010**: Development team can confidently extend the template to build a 3rd app (proof of concept) demonstrating generic nature of template

## Assumptions

1. **Existing Generic Types Are Reusable**: The codebase already has Session<T> and Party types defined in `src/types/serverTypes.ts`. These are generic enough to serve as the template's base types without major refactoring.

2. **Capacitor and Electron Are Stable**: iOS/Android and Electron deployment configurations are mature and don't require major platform-specific changes during template extraction.

3. **No Backend Service Changes**: The backend API contracts for auth, user, session, and party endpoints remain stable during template extraction. Template assumes existing Sudoku backend is used.

4. **RevenueCat Integration Is Non-App-Specific**: The RevenueCat setup can be parameterized via configuration (app IDs, entitlements) making it reusable across template and Sudoku without core logic changes.

5. **Tab Structure Is Adequate**: The 3-tab structure (Home, Sessions, Friends) is sufficient for template and doesn't require dynamic tab registration beyond configuration.

6. **Build Scripts Are Portable**: Existing npm scripts and build configurations can be adapted to work in both template and Sudoku without major restructuring.

## Out of Scope

- Creating a package registry or npm package distribution system (template can be distributed as git submodule or private npm package)
- Migrating existing Sudoku tests before refactor (tests will be updated during Phase 5)
- Creating a visual design system or component library (uses existing Tailwind/next-themes)
- Building a CLI tool to scaffold new apps from template (manual setup documented in README)
- Optimizing or refactoring existing Sudoku-specific game logic (focused on extraction and organization only)
