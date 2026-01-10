# Quickstart: Using the Extracted Template

**Feature**: Template Extraction (001) | **Scope**: How to use `@packages/template` in a new app

After template extraction, new apps can be built quickly by importing generic components, hooks, and providers from the template package.

---

## For New App Developers

### Setup a New App

```bash
# In monorepo root, create a new app
mkdir apps/my-new-app
cd apps/my-new-app

# Initialize Next.js (or copy from Sudoku app structure)
npm create next-app@latest .

# Add template as dependency
npm install @packages/template
```

### Wrap App with Template Providers

**`src/app/layout.tsx`:**
```typescript
import { ReactNode } from 'react';
import { AuthProvider, UserProvider, ThemeProvider, SessionProvider } from '@packages/template/providers';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <UserProvider>
            <ThemeProvider>
              <SessionProvider>
                {children}
              </SessionProvider>
            </ThemeProvider>
          </UserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Authentication Flow

The template's `useAuth()` hook provides user state. When user is not authenticated, the auth service automatically redirects to the OAuth provider. After OAuth completes, the auth service persists the session and user is authenticated.

### Use Template Hooks

**`src/app/page.tsx`:**
```typescript
'use client';

import { useAuth, useUser } from '@packages/template';

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const { profile } = useUser();

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    // Auth service redirects to OAuth page automatically
    return null;
  }

  return (
    <div>
      <h1>Welcome, {profile.displayName}</h1>
      <button onClick={logout}>Sign Out</button>
    </div>
  );
}
```

### Import Template Components

**`src/app/sessions/page.tsx`:**
```typescript
'use client';

import { useSession } from '@packages/template';

export default function SessionsPage() {
  const { sessions, createSession } = useSession();

  return (
    <div>
      <h1>Your Sessions</h1>
      <button onClick={() => createSession({ state: {} })}>
        New Session
      </button>
      <ul>
        {sessions.map(session => (
          <li key={session.id}>{session.id}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## For Sudoku Developers

After extraction, Sudoku imports generic code from template:

### Generic Imports (from template)
```typescript
// All generic hooks/components come from template
import { useAuth, useUser, useSession, useParty } from '@packages/template';
import { Navigation, Profile } from '@packages/template/components';
import { AuthProvider } from '@packages/template/providers';
```

### Sudoku-Specific Imports (local)
```typescript
// All game-specific code stays local in Sudoku
import { usePuzzle, useGameState } from '@/sudoku/hooks';
import { GameBoard, SudokuGrid } from '@/sudoku/components';
import { generatePuzzle } from '@/sudoku/services';
```

### Structure Example

```typescript
// src/app/game/page.tsx
'use client';

import { useSession } from '@packages/template'; // generic
import { usePuzzle, useGameState } from '@/sudoku/hooks'; // sudoku-specific
import { GameBoard } from '@/sudoku/components'; // sudoku-specific

export default function GamePage() {
  const { session, updateSession } = useSession(); // from template
  const { puzzle } = usePuzzle(session.id); // from sudoku
  const { gameState, updateCell } = useGameState(); // from sudoku

  return (
    <div>
      <GameBoard puzzle={puzzle} gameState={gameState} onCellChange={updateCell} />
    </div>
  );
}
```

---

## What's in the Template

The template exports:

### Hooks
- `useAuth()` - User auth state, logout (OAuth handled by auth service)
- `useUser()` - Current user profile
- `useTheme()` - Theme toggle
- `useSession<T>()` - Generic session management
- `useParty()` - Party/group management
- `useError()` - Error handling
- `useOnline()` - Online/offline status
- Plus: `useFetch`, `useLocalStorage`, etc.

### Components
- `Navigation` - Tab navigation
- `Profile` - User profile page/component
- `Settings` - User settings
- `ErrorBoundary` - Error catching
- Plus: Buttons, forms, modals, loading states

### Providers
- `AuthProvider` - Authentication session
- `UserProvider` - User profile
- `ThemeProvider` - Dark/light mode
- `SessionProvider` - Generic session state
- `PartyProvider` - Party management
- `ErrorProvider` - Global error handling

### Types
All existing types (User, Session, Party, Invite, Member, etc.) can be imported:
```typescript
import type { User, Session, Party, Invite } from '@packages/template/types';
```

### Services
API clients for auth, users, sessions, parties:
```typescript
import { authService, userService, sessionService, partyService } from '@packages/template/services';
```

---

## Common Patterns

### Login (OAuth)

```typescript
// The login button redirects to OAuth via auth service
// Users navigate to /auth/login, which the auth service handles
// Auth service redirects to OAuth provider, then back to app with session
```

### Protect a Route

```typescript
'use client';

import { useAuth } from '@packages/template';
import { redirect } from 'next/navigation';

export default function ProtectedPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) redirect('/auth/login');

  return <div>Protected content</div>;
}
```

### Subscribe to Session Changes

```typescript
'use client';

import { useSession } from '@packages/template';
import { useEffect } from 'react';

export default function SessionMonitor() {
  const { session, subscribe } = useSession();

  useEffect(() => {
    const unsubscribe = subscribe((updated) => {
      console.log('Session updated:', updated);
    });

    return () => unsubscribe();
  }, [subscribe]);

  return <div>Listening to session updates...</div>;
}
```

### Create and Join Party

```typescript
'use client';

import { useParty } from '@packages/template';
import { useState } from 'react';

export default function PartyPage() {
  const { createParty, joinParty } = useParty();
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async () => {
    const party = await createParty({ name: 'Gaming Night' });
    console.log('Created party:', party);
  };

  const handleJoin = async () => {
    const party = await joinParty(inviteCode);
    console.log('Joined party:', party);
  };

  return (
    <div>
      <button onClick={handleCreate}>Create Party</button>
      <input
        placeholder="Invite code"
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
      />
      <button onClick={handleJoin}>Join Party</button>
    </div>
  );
}
```

---

## FAQ

**Q: Can I customize the Navigation component?**
A: Yes, import it and wrap/extend it, or create your own in your app.

**Q: Can I override template styles?**
A: Yes, template uses Tailwind CSS. Override in your app's Tailwind config.

**Q: Do I need all the providers?**
A: No, wrap only what you use. Optional providers don't need to be included.

**Q: What if I need a hook that doesn't exist?**
A: Add it to your app's local hooks directory and import locally.

**Q: How do I add app-specific state to Session?**
A: Session type is `Session<T>`. Define your own `T` and pass it to `useSession<T>()`.

---

## Next Steps

1. Create new app and import template providers
2. Use template hooks for auth, user, session, party
3. Build your app-specific features
4. Test with backend API (services handle the details)
5. Deploy to all platforms (web, iOS, Android, Electron)

The template handles all generic infrastructure. Focus on your app's unique features.
