# Contract: @bubblyclouds-app/template Package

**Package**: `@bubblyclouds-app/template`
**Version**: 2.0.0 (initial after refactoring)
**Type**: React component library + hooks + core functionality
**Platform**: Browser-based (Next.js, React)

---

## Purpose

Provides core collaborative features (parties, sessions, user management) that can be used by any application. The template package is application-agnostic and contains no game-specific logic.

---

## Public API

### Components

#### PartyList

Displays list of parties the user belongs to.

**Props**:
```typescript
interface PartyListProps {
  onSelectParty: (partyId: string) => void;
  onCreateParty?: () => void;
  showCreateButton?: boolean;
  filter?: 'owned' | 'member' | 'all';
}
```

---

#### PartyDetails

Shows details of a specific party with member list.

**Props**:
```typescript
interface PartyDetailsProps {
  partyId: string;
  onInviteMember?: (email: string) => void;
  onRemoveMember?: (userId: string) => void;
  onLeaveParty?: () => void;
  readonly?: boolean;
}
```

---

#### InvitationForm

Form for inviting users to a party.

**Props**:
```typescript
interface InvitationFormProps {
  partyId: string;
  onInviteSent: (email: string) => void;
  onCancel: () => void;
}
```

---

#### SessionList

Displays sessions within a party or for current user.

**Props**:
```typescript
interface SessionListProps {
  partyId?: string;
  userId?: string;
  onSelectSession: (sessionId: string) => void;
  filter?: 'active' | 'completed' | 'all';
}
```

---

### Hooks

#### useParty

Access party management functions.

**Returns**:
```typescript
interface UsePartyReturn {
  parties: Party[];
  currentParty: Party | null;
  selectParty: (partyId: string) => void;
  createParty: (name: string, settings?: PartySettings) => Promise<string>;
  updateParty: (partyId: string, updates: Partial<Party>) => Promise<void>;
  deleteParty: (partyId: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}
```

---

#### useMembership

Access party membership and member management.

**Returns**:
```typescript
interface UseMembershipReturn {
  members: PartyMember[];
  addMember: (partyId: string, userId: string) => Promise<void>;
  removeMember: (partyId: string, userId: string) => Promise<void>;
  updateMemberRole: (partyId: string, userId: string, role: Role) => Promise<void>;
  inviteMember: (partyId: string, email: string) => Promise<void>;
  isLoading: boolean;
}
```

---

#### useSession

Access session management for collaborative work.

**Returns**:
```typescript
interface UseSessionReturn {
  sessions: Session[];
  createSession: (partyId: string, data: any) => Promise<string>;
  updateSession: (sessionId: string, data: any) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  getSession: (sessionId: string) => Session | null;
  isLoading: boolean;
}
```

---

#### useInvitations

Manage sent and received invitations.

**Returns**:
```typescript
interface UseInvitationsReturn {
  sentInvitations: PartyInvitation[];
  receivedInvitations: PartyInvitation[];
  sendInvitation: (partyId: string, email: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  isLoading: boolean;
}
```

---

### Providers

#### PartyProvider

Wraps application with party context and state management.

**Props**:
```typescript
interface PartyProviderProps {
  children: React.ReactNode;
}
```

**Provides Context**: `PartyContext` with value combining results of useParty, useMembership, useSession hooks.

---

### Types (Public Exports)

```typescript
export type { Party, PartySettings } from './types/Party';
export type { PartyMember, PartyInvitation } from './types/PartyMember';
export type { Session, CollaborativeSession } from './types/Session';
export type { Parties } from '@bubblyclouds-app/types';
```

---

## Re-exports

Template package re-exports common types and functions from other packages for convenience:

```typescript
// Auth package exports
export { AuthProvider } from '@bubblyclouds-app/auth';
export { useAuth, useSession as useAuthSession, useUser } from '@bubblyclouds-app/auth';
export type { User, AuthToken, SessionState } from '@bubblyclouds-app/auth';

// UI package exports
export { Header, Footer, Button, Modal, ThemeProvider } from '@bubblyclouds-app/ui';
export { useTheme, useDarkMode } from '@bubblyclouds-app/ui';

// Shared exports
export { useLocalStorage, useOnline } from '@bubblyclouds-app/shared';
export { calculateSeconds, formatSeconds } from '@bubblyclouds-app/shared';
```

---

## Integration Points

### Dependencies

- `@bubblyclouds-app/auth`: User authentication and context
- `@bubblyclouds-app/ui`: UI components
- `@bubblyclouds-app/shared`: Utilities
- `@bubblyclouds-app/types`: Type definitions
- React 18+
- Next.js 14+

### No Dependencies On

- ❌ `@bubblyclouds-app/sudoku` (must remain game-agnostic)
- ❌ App-specific code

---

## Contract Guarantees

### Stability

1. **Public API is stable**: Components and hooks will not change in minor versions
2. **Data model is stable**: Party, Session, Member types are reliable
3. **Breaking changes only in MAJOR versions**

### Behavior Guarantees

1. **Real-time updates**: Party membership and session changes reflected across connected clients
2. **Persistence**: All party and session data persists server-side
3. **Permissions**: Only party owner can delete party; only owner/moderator can invite/remove members
4. **Soft deletes for sessions**: Sessions are archived, not deleted (preserves history)
5. **Invitation system works**: Invited users receive invitations and can accept/decline

### Testing Guarantees

1. **100% of public API is testable**
2. **Mock providers available** for testing components that use useParty, useMembership
3. **Fixtures available** for test data (parties, members, sessions)

---

## Consumer Contract

### Apps Using This Package Must:

1. Wrap application root with `<PartyProvider>`
2. Wrap application root with `<AuthProvider>` (from auth package)
3. Implement required backend endpoints:
   - `GET /api/parties` - List user's parties
   - `POST /api/parties` - Create new party
   - `GET /api/parties/:id` - Get party details
   - `PATCH /api/parties/:id` - Update party
   - `DELETE /api/parties/:id` - Delete party
   - `GET /api/parties/:id/members` - List party members
   - `POST /api/parties/:id/members` - Add member
   - `DELETE /api/parties/:id/members/:userId` - Remove member
   - `GET /api/sessions` - List sessions
   - `POST /api/sessions` - Create session
   - `GET /api/sessions/:id` - Get session
   - `PATCH /api/sessions/:id` - Update session
   - `POST /api/invitations` - Send invitation
   - `GET /api/invitations` - List invitations
   - `POST /api/invitations/:id/accept` - Accept invitation
   - `POST /api/invitations/:id/decline` - Decline invitation

4. Handle real-time updates (WebSocket or polling)

### Apps Must NOT:

1. ❌ Modify party or session data without using hooks (bypasses permissions)
2. ❌ Call hooks outside of PartyProvider tree
3. ❌ Implement their own party management (use this package)
4. ❌ Store party data locally if it can change (always fetch fresh)

---

## Becoming Game-Agnostic

This package became game-agnostic by:

1. **Generic Session type**: `Session<T>` allows any data structure, not just `SudokuState`
2. **Moved sudoku types**: `SudokuSession`, `RaceSession` types moved to `@bubblyclouds-app/sudoku` package
3. **No game references**: Removed all mentions of "puzzle", "game", "race" from type names
4. **Renamed concepts**: "Race party" → "Party", "Puzzle session" → "Session"
5. **Flexible data model**: Party and session are generic containers for any collaborative work

---

## Versioning Strategy

**Current Version**: 2.0.0

**Next Versions**:
- `2.1.0`: Add party roles/permissions system
- `2.2.0`: Add real-time WebSocket support
- `3.0.0`: Move to GraphQL subscriptions (breaking: changes hook signatures)

---

## Migration Path (from v1.x to v2.0.0)

Old (v1.x):
```typescript
// Party logic was in sudoku app
import { useParty } from 'src/hooks/useParty';
import { Party, RaceSession } from 'src/types/Race';
```

New (v2.0.0):
```typescript
// Party logic is in template package
import { useParty, useSession } from '@bubblyclouds-app/template';
import type { Party, Session } from '@bubblyclouds-app/template';
import type { RaceSession } from '@bubblyclouds-app/sudoku';
```

**Migration Steps**:
1. Import hooks from `@bubblyclouds-app/template` instead of app
2. Move RaceSession imports to `@bubblyclouds-app/sudoku`
3. Update generic Session usage to use `Session<T>` where T is your data
4. Ensure PartyProvider wraps app root
5. Implement required backend endpoints

---

## Quality Gates

Before template package can be shipped:

- [ ] All public API documented
- [ ] All exports in index.ts
- [ ] 100% of public API has tests
- [ ] No sudoku references in code
- [ ] No game-specific logic
- [ ] TypeScript strict mode passes
- [ ] 100% test pass rate
- [ ] All components/hooks work with both template and sudoku apps
- [ ] Real-time updates tested across multiple clients
