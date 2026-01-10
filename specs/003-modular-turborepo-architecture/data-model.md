# Phase 1 Design: Data Model

**Date**: 2025-11-02
**Status**: Complete
**Objective**: Define entities, types, and data relationships for the modular architecture

---

## Core Entities

### 1. User Entity (Auth Package)

**Location**: `@bubblyclouds-app/auth` → `types/User.ts`

```typescript
interface User {
  sub: string;                    // Unique identifier (from OAuth provider)
  email: string;                  // User email
  name?: string;                  // User display name
  profileImage?: string;          // Avatar/profile picture URL
  preferences?: UserPreferences;  // User settings
  createdAt: Date;               // Account creation time
  updatedAt: Date;               // Last profile update
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  language?: string;
}
```

**Validation Rules**:
- `sub` must be non-empty string
- `email` must be valid email format
- `name` optional but max 100 characters if provided
- `createdAt` and `updatedAt` must be valid dates with `createdAt` ≤ `updatedAt`

**Relationships**:
- Owns many Sessions
- Owns many Parties
- Member of many Parties (via membership)

---

### 2. Session Entity (Template Package)

**Location**: `@bubblyclouds-app/template` → `types/Session.ts`

Generic session that can store any data (game session, collaboration session, etc.)

```typescript
interface Session<T = any> {
  sessionId: string;              // Unique session identifier
  userId: string;                 // Creator/owner user ID
  state: T;                        // Generic session state (game data, collaboration data, etc.)
  createdAt: Date;               // Session creation time
  updatedAt: Date;               // Last modification time
  expiresAt?: Date;              // Optional expiration time
}

// Specialized type for sudoku game sessions
interface SudokuSession extends Session<SudokuState> {
  state: SudokuState;
}

// Generic collaborative session tracking
interface CollaborativeSession<T> extends Session<T> {
  partyId: string;               // Associated party ID
  participantIds: string[];      // Active participant user IDs
}
```

**Validation Rules**:
- `sessionId` must be unique and non-empty
- `userId` must reference a valid User
- `createdAt` ≤ `updatedAt` ≤ `expiresAt` (if provided)
- `state` structure depends on session type

**Relationships**:
- Belongs to a User
- May belong to a Party (if collaborative)
- Contains game-specific state (sudoku, etc.)

---

### 3. Party Entity (Template Package)

**Location**: `@bubblyclouds-app/template` → `types/Party.ts`

Generic collaborative group for organizing sessions and inviting members

```typescript
interface Party {
  partyId: string;                // Unique party identifier
  name: string;                   // Party/group name
  description?: string;           // Optional description
  createdBy: string;             // Creator user ID (owner)
  createdAt: Date;               // Party creation time
  updatedAt: Date;               // Last modification time
  settings?: PartySettings;       // Party configuration
}

interface PartySettings {
  maxMembers?: number;            // Maximum allowed members
  isPublic: boolean;              // Public vs private party
  invitationRequired: boolean;    // Whether invitations are required to join
}

// Generic parties container indexed by party ID
type Parties<T> = Record<string, Party & { memberSessions: Record<string, T> }>;
```

**Validation Rules**:
- `partyId` must be unique and non-empty
- `name` must be 1-100 characters
- `createdBy` must reference a valid User
- `createdAt` ≤ `updatedAt`
- `maxMembers` if provided must be ≥ 2

**Relationships**:
- Created by a User (owner)
- Contains many Members (via membership association)
- Contains many Sessions (game sessions within the party)

---

### 4. Party Membership Entity (Template Package)

**Location**: `@bubblyclouds-app/template` → `types/PartyMember.ts`

Represents a user's membership in a party with their participation status

```typescript
interface PartyMember {
  userId: string;                // Member user ID
  partyId: string;               // Party ID
  memberNickname?: string;       // Display name in party context
  role: 'owner' | 'moderator' | 'member';  // User's role
  joinedAt: Date;                // When user joined the party
  status: 'active' | 'invited' | 'declined' | 'left';  // Membership status
}

interface PartyInvitation {
  invitationId: string;
  partyId: string;
  invitedBy: string;             // User ID of inviter
  invitedUser: string;           // User ID being invited
  status: 'pending' | 'accepted' | 'declined';
  expiresAt: Date;
  createdAt: Date;
}
```

**Validation Rules**:
- `userId` and `partyId` must reference valid entities
- `memberNickname` max 50 characters if provided
- `role` must be one of: owner, moderator, member
- `status` must be one of: active, invited, declined, left
- `joinedAt` must be valid date
- Party owner cannot be removed (role restrictions)
- Only one owner per party

**Relationships**:
- References a User
- References a Party
- Many-to-many relationship between Users and Parties

---

### 5. Auth Token Entity (Auth Package)

**Location**: `@bubblyclouds-app/auth` → `types/AuthToken.ts`

Represents authentication credentials and session tokens

```typescript
interface AuthToken {
  accessToken: string;            // Current access token
  accessExpiry: Date;             // When access token expires
  refreshToken?: string;          // Refresh token for getting new access token
  refreshExpiry?: Date;           // When refresh token expires
}

interface SessionState {
  user: User | null;              // Current authenticated user
  token: AuthToken | null;        // Current tokens
  isAuthenticated: boolean;       // Whether user is logged in
  isLoading: boolean;             // Loading state during auth flow
  error?: string;                 // Auth error message if any
}
```

**Validation Rules**:
- `accessToken` must be non-empty string
- `accessExpiry` must be in the future or null
- `refreshToken` optional but if provided, `refreshExpiry` should also be provided
- `accessExpiry` < `refreshExpiry` (if both present)
- Token must be refreshed before expiry

---

## Package-Specific Types

### Auth Package (`@bubblyclouds-app/auth`)

```typescript
// Login request/response
interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user: User;
  token: AuthToken;
}

// OAuth provider interface
interface OAuthProvider {
  name: 'google' | 'github' | 'apple';
  clientId: string;
  redirectUrl: string;
}

// Auth context value
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loginWithProvider: (provider: OAuthProvider) => Promise<void>;
}
```

---

### UI Package (`@bubblyclouds-app/ui`)

```typescript
// Theme configuration
interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  secondaryColor?: string;
  customFonts?: string[];
}

// UI Context value
interface UIContextValue {
  theme: ThemeConfig;
  setTheme: (config: ThemeConfig) => void;
}
```

---

### Sudoku Package (`@bubblyclouds-app/sudoku`)

```typescript
// Cell representation
interface Cell {
  id: string;                    // Unique cell ID in grid
  row: number;                   // 0-8
  column: number;                // 0-8
  boxIndex: number;              // 0-8
  value?: number;                // 1-9 or empty
  isGiven: boolean;              // Whether this was part of puzzle
  candidates: Set<number>;       // Possible values
}

// Sudoku grid (9x9)
interface SudokuGrid {
  cells: Cell[];                 // 81 cells
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

// Sudoku puzzle state
interface SudokuState {
  puzzleId: string;
  grid: SudokuGrid;
  solution: SudokuGrid;
  isComplete: boolean;
  completedAt?: Date;
}

// Race-specific types
interface RaceSession extends CollaborativeSession<SudokuState> {
  partyId: string;
  participantIds: string[];      // Players in the race
  startTime: Date;
  endTime?: Date;
  rankings: RaceRanking[];
}

interface RaceRanking {
  userId: string;
  position: number;              // 1st, 2nd, etc.
  completionTime: number;        // Seconds
  completedAt: Date;
}
```

---

## Template Package Export

**Location**: `@bubblyclouds-app/template` → `src/index.ts`

The template package re-exports core types so apps can import from one place:

```typescript
// Auth exports
export { AuthProvider } from '@bubblyclouds-app/auth';
export { useAuth, useSession, useUser } from '@bubblyclouds-app/auth';
export type { User, AuthToken, SessionState } from '@bubblyclouds-app/auth';

// UI exports
export { ThemeProvider, Header, Footer } from '@bubblyclouds-app/ui';
export { useTheme } from '@bubblyclouds-app/ui';

// Template exports (parties, sessions)
export { PartyProvider } from './providers/PartyProvider';
export { useParty, useSession, useMembership } from './hooks';
export type { Party, PartyMember, Session, PartyInvitation } from './types';

// Shared exports
export { useLocalStorage, useOnline } from '@bubblyclouds-app/shared';
export { calculateSeconds, formatSeconds } from '@bubblyclouds-app/shared';
export type { Parties } from '@bubblyclouds-app/shared';
```

---

## Data Flow Diagrams

### Authentication Flow

```
App (template/sudoku)
  ↓
AuthProvider (@bubblyclouds-app/auth)
  ↓
useAuth hook
  ↓
UserContext (provides User + SessionState)
  ↓
UI Components access user via useAuth()
```

### Party/Session Flow

```
App (template/sudoku)
  ↓
PartyProvider (@bubblyclouds-app/template)
  ↓
useParty hook
  ↓
PartyContext (provides parties, members, sessions)
  ↓
UI Components access parties via useParty()
```

### Theme Flow

```
App (template/sudoku)
  ↓
ThemeProvider (@bubblyclouds-app/ui)
  ↓
useTheme hook
  ↓
UI Components apply theme styles
```

---

## Constraints and Rules

### Type Safety (Constitutional Requirement II)

- All exported types must be explicitly defined (no `any`)
- React component props must use TypeScript interfaces
- Strict mode enabled in all tsconfig.json files
- No type assertions without explicit justification

### Testability (Constitutional Requirement I)

- All types must be testable
- Mock data generators should exist for all entities
- Types should not depend on runtime values (data validation via separate validation functions)

### Separation of Concerns

- Types in `@bubblyclouds-app/types` are generic and app-agnostic
- Types in each package are only about that package's responsibility
- Sudoku-specific types never appear in shared, auth, or ui packages
- Generic types use generics (`T`) to accommodate different applications

---

## Summary

This data model establishes:
- ✅ Clear entity definitions for core concepts (User, Session, Party, AuthToken)
- ✅ Type safety through explicit TypeScript interfaces
- ✅ Reusability through generic types and package organization
- ✅ Validation rules for data integrity
- ✅ Separation of sudoku-specific types from shared code
- ✅ A foundation for both template and sudoku applications to build upon
