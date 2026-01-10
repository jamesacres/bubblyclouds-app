# Contract: @bubblyclouds-app/auth Package

**Package**: `@bubblyclouds-app/auth`
**Version**: 2.0.0 (initial after refactoring)
**Type**: React component library + hooks
**Platform**: Browser-based (Next.js, React)

---

## Public API

### Components

#### AuthProvider

Wraps application with authentication context and session management.

**Props**:
```typescript
interface AuthProviderProps {
  children: React.ReactNode;
  onAuthStateChange?: (state: SessionState) => void;
}
```

**Provides Context**: `AuthContext` with value `SessionState`

**Behavior**:
- Initializes authentication state from stored tokens
- Manages token refresh automatically
- Syncs across browser tabs/windows
- Clears session on logout

---

### Hooks

#### useAuth

Access current authentication state and methods.

**Returns**:
```typescript
interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loginWithProvider: (provider: string) => Promise<void>;
}
```

**Example**:
```typescript
function MyComponent() {
  const { user, login, isLoading } = useAuth();
  // Use user, login, etc.
}
```

---

#### useSession

Access session tokens and refresh mechanism.

**Returns**:
```typescript
interface UseSessionReturn {
  token: AuthToken | null;
  refresh: () => Promise<void>;
  isValid: boolean;
}
```

---

#### useUser

Access current user info only (simpler than useAuth for read-only scenarios).

**Returns**:
```typescript
interface UseUserReturn {
  user: User | null;
  isLoading: boolean;
}
```

---

### Types (Public Exports)

```typescript
export type { User, UserPreferences } from './types/User';
export type { AuthToken, SessionState } from './types/AuthToken';
export type { LoginCredentials, LoginResponse } from './types/Login';
export type { OAuthProvider } from './types/OAuthProvider';
```

---

## Integration Points

### Dependencies

- `@bubblyclouds-app/types`: Core types
- `@bubblyclouds-app/shared`: Utilities (e.g., localStorage access)
- React 18+
- Next.js 14+ (for API routes)

### No Dependencies On

- ❌ `@bubblyclouds-app/ui`
- ❌ `@bubblyclouds-app/sudoku`
- ❌ `@bubblyclouds-app/template`
- ❌ App-specific code

---

## Contract Guarantees

### Stability

1. **Public API is stable**: Exported components, hooks, and types will not change in minor versions
2. **Breaking changes only in MAJOR versions**: Type changes, hook return value changes, component prop changes
3. **Backwards compatibility**: New features added as optional parameters, not required changes

### Behavior Guarantees

1. **Authentication state persists**: Session survives page reload
2. **Automatic token refresh**: Access token automatically refreshed before expiry
3. **Single source of truth**: Only one auth state across entire application
4. **Secure token storage**: Tokens stored securely (httpOnly cookies preferred, or localStorage with encryption)
5. **OAuth support**: Supports Google, GitHub, and Apple sign-in
6. **Logout is complete**: All tokens cleared, session terminated, user returned to login

### Testing Guarantees

1. **100% of public API is testable**: All hooks and components can be tested in isolation
2. **Mocks provided**: Auth package provides mock implementations for testing

---

## Consumer Contract

### Apps Using This Package Must:

1. Wrap application root with `<AuthProvider>`
2. Handle `useAuth()` being called only within AuthProvider tree
3. Provide OAuth configuration via environment variables:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `NEXT_PUBLIC_GITHUB_CLIENT_ID`
   - `NEXT_PUBLIC_APPLE_CLIENT_ID`
4. Implement backend endpoints for:
   - POST `/api/auth/login` - Authenticate user
   - POST `/api/auth/logout` - Terminate session
   - POST `/api/auth/refresh` - Refresh access token
   - POST `/api/auth/callback` - OAuth callback handler

### Apps Must NOT:

1. ❌ Store tokens directly in localStorage without encryption
2. ❌ Bypass AuthProvider to access authentication state
3. ❌ Call useAuth() hooks outside of AuthProvider tree
4. ❌ Implement their own authentication logic (use this package instead)

---

## Versioning Strategy

**Current Version**: 2.0.0

**Next Versions**:
- `2.1.0`: Add passwordless sign-in
- `2.2.0`: Add session timeout management
- `3.0.0`: Switch to passwordless-only (breaking: remove password login)

---

## Migration Path (from v1.x to v2.0.0)

Old (v1.x):
```typescript
// Auth was in multiple locations
import { LoginForm } from 'src/components/auth/LoginForm';
import { useAuth } from 'src/hooks/useAuth';
```

New (v2.0.0):
```typescript
// Auth is now a package
import { useAuth } from '@bubblyclouds-app/auth';
import { AuthProvider } from '@bubblyclouds-app/auth';
```

**Migration Steps**:
1. Update imports to use `@bubblyclouds-app/auth`
2. Ensure `AuthProvider` wraps application root
3. Update environment variables for OAuth
4. Implement required backend endpoints
5. Update tests to use new auth package

---

## Quality Gates

Before auth package can be shipped:

- [ ] All public API documented
- [ ] All exports included in index.ts
- [ ] 100% of public API has tests
- [ ] TypeScript strict mode passes
- [ ] No console errors or warnings in tests
- [ ] Works across all platforms (web, iOS, Android, Electron)
- [ ] Login form works with keyboard navigation
- [ ] Login form accessible (WCAG 2.1 AA)
