# @bubblyclouds-app/auth

Authentication and user management package for multi-platform applications.

## Purpose

Provides comprehensive authentication functionality with support for OAuth 2.0 with PKCE flow, user profile management, and session handling across web, iOS, Android, and Electron platforms.

## Responsibility

- User authentication and authorization
- OAuth 2.0 with PKCE flow
- Session management and persistence
- User profile management
- Platform-specific authentication handling (Capacitor, Electron)
- Authentication UI components

## Public API

### Components

#### `HeaderUser`
Header component displaying user information and authentication state.

```tsx
import { HeaderUser } from '@bubblyclouds-app/auth';

<HeaderUser />
```

#### `UserAvatar`
User avatar component with fallback to initials.

```tsx
import { UserAvatar } from '@bubblyclouds-app/auth';

<UserAvatar user={user} size="md" />
```

#### `UserButton`
Button component for user actions (profile, settings, logout).

```tsx
import { UserButton } from '@bubblyclouds-app/auth';

<UserButton user={user} />
```

#### `UserPanel`
Full user profile panel with account management options.

```tsx
import { UserPanel } from '@bubblyclouds-app/auth';

<UserPanel />
```

#### `DeleteAccountDialog`
Dialog component for account deletion with confirmation.

```tsx
import { DeleteAccountDialog } from '@bubblyclouds-app/auth';

<DeleteAccountDialog isOpen={isOpen} onClose={onClose} />
```

### Providers

#### `AuthProvider`
React context provider for authentication state. **Required** at the root of your application.

```tsx
import { AuthProvider } from '@bubblyclouds-app/auth';
import { useFetch } from '@bubblyclouds-app/template';

<AuthProvider useFetch={useFetch}>
  <App />
</AuthProvider>
```

**Props:**
- `useFetch`: Function hook for making authenticated API requests
- `children`: React children

#### `UserContext`
React context for accessing authentication state.

```tsx
import { UserContext } from '@bubblyclouds-app/auth';

const { user, isAuthenticated, login, logout } = useContext(UserContext);
```

### Services

#### `pkce`
PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0.

```tsx
import { pkce } from '@bubblyclouds-app/auth';

const { codeVerifier, codeChallenge } = await pkce.generate();
```

#### Platform Detection

```tsx
import {
  isCapacitor,
  isElectron,
  getCapacitorState,
  saveCapacitorState,
  saveElectronState,
  openBrowser
} from '@bubblyclouds-app/auth';

if (isCapacitor()) {
  // Handle Capacitor (iOS/Android) authentication
  await saveCapacitorState(state);
  await openBrowser(authUrl);
}

if (isElectron()) {
  // Handle Electron (desktop) authentication
  await saveElectronState(state);
}
```

### Types

#### `User`
User account information.

```typescript
interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}
```

#### `UserProfile`
Extended user profile information.

```typescript
interface UserProfile extends User {
  createdAt: string;
  updatedAt: string;
  preferences?: UserPreferences;
}
```

#### `UserPreferences`
User preferences and settings.

```typescript
interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  language?: string;
}
```

#### `AuthToken`
Authentication token information.

```typescript
interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}
```

#### `SessionState`
Authentication session state.

```typescript
interface SessionState {
  isAuthenticated: boolean;
  user?: User;
  token?: AuthToken;
}
```

### Hooks (Internal)

Note: These hooks are available internally but accessed through `UserContext`:

- `useAuth()` - Authentication state and methods
- `useUser()` - User profile and preferences
- `useSession()` - Session management

## Integration Guide

### 1. Basic Setup

Wrap your application with `AuthProvider`:

```tsx
import { AuthProvider } from '@bubblyclouds-app/auth';
import { useFetch } from '@bubblyclouds-app/template';

function App() {
  return (
    <AuthProvider useFetch={useFetch}>
      <YourApp />
    </AuthProvider>
  );
}
```

### 2. Using Authentication in Components

Access authentication state through `UserContext`:

```tsx
import { useContext } from 'react';
import { UserContext } from '@bubblyclouds-app/auth';

function MyComponent() {
  const { user, isAuthenticated } = useContext(UserContext);

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  return <div>Welcome, {user.name}!</div>;
}
```

### 3. Using Pre-built Components

Use provided UI components for common authentication flows:

```tsx
import { HeaderUser, UserPanel } from '@bubblyclouds-app/auth';

function AppHeader() {
  return (
    <header>
      <HeaderUser />
    </header>
  );
}

function ProfilePage() {
  return <UserPanel />;
}
```

### 4. Platform-Specific Authentication

Handle platform-specific authentication flows:

```tsx
import { isCapacitor, isElectron, openBrowser } from '@bubblyclouds-app/auth';

async function handleLogin() {
  const authUrl = generateAuthUrl();

  if (isCapacitor()) {
    // Mobile authentication
    await openBrowser(authUrl);
  } else if (isElectron()) {
    // Desktop authentication
    window.electron.openAuth(authUrl);
  } else {
    // Web authentication
    window.location.href = authUrl;
  }
}
```

## Dependencies

```json
{
  "react": "^18",
  "react-dom": "^18"
}
```

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test
```

## Examples

### Complete Authentication Flow

```tsx
import { AuthProvider, UserContext, HeaderUser } from '@bubblyclouds-app/auth';
import { useFetch } from '@bubblyclouds-app/template';

// App wrapper
function App() {
  return (
    <AuthProvider useFetch={useFetch}>
      <Layout />
    </AuthProvider>
  );
}

// Layout component
function Layout() {
  const { user, isAuthenticated } = useContext(UserContext);

  return (
    <div>
      <header>
        <HeaderUser />
      </header>
      <main>
        {isAuthenticated ? (
          <Dashboard user={user} />
        ) : (
          <LandingPage />
        )}
      </main>
    </div>
  );
}
```

### Custom Authentication Button

```tsx
import { useContext } from 'react';
import { UserContext } from '@bubblyclouds-app/auth';

function CustomLoginButton() {
  const { isAuthenticated, login, logout, user } = useContext(UserContext);

  if (isAuthenticated) {
    return (
      <button onClick={logout}>
        Sign out ({user.email})
      </button>
    );
  }

  return <button onClick={login}>Sign in</button>;
}
```

## Notes

- This package is platform-agnostic and supports web, iOS (Capacitor), Android (Capacitor), and Electron
- OAuth 2.0 with PKCE flow provides secure authentication without client secrets
- Session state is persisted across page reloads
- Platform-specific deep linking is handled automatically
- All components support dark mode and are fully accessible

## Related Packages

- `@bubblyclouds-app/ui` - UI components and theming (used by auth components)
- `@bubblyclouds-app/template` - Application templates and providers (provides `useFetch`)
- `@bubblyclouds-app/shared` - Shared utilities

## Version

Current version: 0.1.0
