# @sudoku-web/template

Generic collaboration and application infrastructure package - game-agnostic party/session management.

## Purpose

Provides reusable collaborative features including party management, session tracking, member invitations, and application infrastructure that can be used by any collaborative application - **not specific to any particular game or domain**.

## Responsibility

- Party/group creation and management
- Collaborative session tracking
- Member invitations and management
- Multi-platform provider infrastructure (Capacitor, RevenueCat, Fetch)
- Global application state management
- Client-server state synchronization
- Daily action tracking and limits
- Premium feature configuration
- Error handling and recovery

## Public API

### Components

#### `ErrorBoundary`
React error boundary component for graceful error handling.

```tsx
import { ErrorBoundary } from '@sudoku-web/template';

<ErrorBoundary>
  <App />
</ErrorBoundary>
```

#### `AppDownloadModal`
Modal promoting mobile app downloads.

```tsx
import { AppDownloadModal } from '@sudoku-web/template';

<AppDownloadModal isOpen={showModal} onClose={() => setShowModal(false)} />
```

#### `GlobalErrorHandler`
Global error handler for uncaught errors.

```tsx
import { GlobalErrorHandler } from '@sudoku-web/template';

<GlobalErrorHandler />
```

### Providers

#### `CapacitorProvider`
Capacitor platform initialization and configuration.

```tsx
import { CapacitorProvider } from '@sudoku-web/template';

<CapacitorProvider>
  <App />
</CapacitorProvider>
```

#### `RevenueCatProvider`
RevenueCat subscription and payment integration.

```tsx
import { RevenueCatProvider, RevenueCatContext } from '@sudoku-web/template';

<RevenueCatProvider apiKey="your-api-key">
  <App />
</RevenueCatProvider>

// Access subscription state
const { isPremium, offerings } = useContext(RevenueCatContext);
```

#### `UserProvider`
User profile and authentication state management.

```tsx
import { UserProvider, UserContext } from '@sudoku-web/template';

<UserProvider>
  <App />
</UserProvider>

// Access user state
const { user, updateProfile } = useContext(UserContext);
```

#### `FetchProvider`
Authenticated API request handling.

```tsx
import { FetchProvider, FetchContext } from '@sudoku-web/template';

<FetchProvider baseUrl="https://api.example.com">
  <App />
</FetchProvider>

// Make authenticated requests
const fetchContext = useContext(FetchContext);
const data = await fetchContext.fetch('/api/endpoint');
```

#### `ThemeColorProvider`
Theme color management (re-exported from `@sudoku-web/ui`).

```tsx
import { ThemeColorProvider, useThemeColor } from '@sudoku-web/template';

<ThemeColorProvider>
  <App />
</ThemeColorProvider>
```

#### `GlobalStateProvider`
Global application state management.

```tsx
import { GlobalStateProvider, GlobalStateContext } from '@sudoku-web/template';

<GlobalStateProvider>
  <App />
</GlobalStateProvider>
```

#### `PartyProvider`
Party/group management and collaboration.

```tsx
import { PartyProvider, PartyContext } from '@sudoku-web/template';

<PartyProvider>
  <App />
</PartyProvider>

// Access party state
const { parties, createParty, inviteMember } = useContext(PartyContext);
```

### Hooks

#### `useOnline`
Detect online/offline network status.

```tsx
import { useOnline } from '@sudoku-web/template';

function Component() {
  const isOnline = useOnline();

  return isOnline ? <OnlineUI /> : <OfflineUI />;
}
```

#### `useLocalStorage`
Persistent local storage with React state.

```tsx
import { useLocalStorage } from '@sudoku-web/template';

function Component() {
  const [value, setValue, { loading, error }] = useLocalStorage('key', defaultValue);

  return <div>{value}</div>;
}
```

**Returns:** `[value, setValue, { loading, error, remove }]`

#### `useWakeLock`
Prevent device from sleeping.

```tsx
import { useWakeLock } from '@sudoku-web/template';

function GameComponent() {
  const { request, release, isActive } = useWakeLock();

  useEffect(() => {
    request(); // Keep screen awake during game
    return () => release();
  }, []);
}
```

#### `useFetch`
Authenticated API requests with error handling.

```tsx
import { useFetch } from '@sudoku-web/template';

function Component() {
  const fetch = useFetch();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data').then(setData);
  }, []);
}
```

#### `useDocumentVisibility`
Track document visibility state (tab focus).

```tsx
import { useDocumentVisibility } from '@sudoku-web/template';

function Component() {
  const isVisible = useDocumentVisibility();

  useEffect(() => {
    if (isVisible) {
      // Resume activity
    } else {
      // Pause activity
    }
  }, [isVisible]);
}
```

#### `useServerStorage`
Sync state with server storage.

```tsx
import { useServerStorage } from '@sudoku-web/template';

function Component() {
  const [serverState, updateServerState] = useServerStorage<MyState>('key', defaultValue);

  return <div>{serverState?.value}</div>;
}
```

### Types

#### `Party`
Party/group information.

```typescript
interface Party {
  partyId: string;
  partyName: string;
  createdBy: string;
  members: PartyMember[];
  settings?: PartySettings;
  createdAt: Date;
  updatedAt: Date;
}
```

#### `PartyMember`
Party member information.

```typescript
interface PartyMember {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: 'owner' | 'member';
  joinedAt: Date;
}
```

#### `PartyInvitation`
Party invitation details.

```typescript
interface PartyInvitation {
  invitationId: string;
  partyId: string;
  invitedBy: string;
  invitedEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  expiresAt: Date;
}
```

#### `Session<T>`
Generic session with custom state type.

```typescript
interface Session<T> {
  sessionId: string;
  state: T;
  updatedAt: Date;
}
```

#### `CollaborativeSession`
Session for collaborative activities.

```typescript
interface CollaborativeSession {
  sessionId: string;
  partyId?: string;
  participants: string[];
  startedAt: Date;
  status: 'active' | 'paused' | 'completed';
}
```

### Utilities

#### `dailyActionCounter`
Track and limit daily actions.

```tsx
import {
  getTodayActionCount,
  incrementActionCount,
  hasReachedDailyLimit,
  resetIfNewDay
} from '@sudoku-web/template';

// Check if user can perform action
if (!hasReachedDailyLimit('feature-name', 10)) {
  performAction();
  incrementActionCount('feature-name');
}
```

#### `playerColors`
Assign consistent colors to players.

```tsx
import { getPlayerColor, generatePlayerColors } from '@sudoku-web/template';

const color = getPlayerColor(userId); // Returns consistent color for user
const colors = generatePlayerColors(5); // Generate 5 distinct colors
```

### Config

#### `dailyLimits`
Daily action limits configuration.

```tsx
import { DAILY_LIMITS } from '@sudoku-web/template';

const limit = DAILY_LIMITS.FREE_TIER.ACTIONS_PER_DAY;
```

#### `premiumFeatures`
Premium feature configuration.

```tsx
import { PREMIUM_FEATURES } from '@sudoku-web/template';

if (PREMIUM_FEATURES.UNLIMITED_ACTIONS) {
  // Allow unlimited actions
}
```

### Helpers

Platform helpers (re-exported from `@sudoku-web/ui` and `@sudoku-web/auth`):

```tsx
import {
  calculateSeconds,
  formatSeconds,
  isCapacitor,
  isElectron,
  pkce
} from '@sudoku-web/template';

const seconds = calculateSeconds(startTime, endTime);
const formatted = formatSeconds(seconds); // "1:30"
```

## Integration Guide

### 1. Provider Setup

Wrap your application with all necessary providers:

```tsx
import {
  CapacitorProvider,
  RevenueCatProvider,
  UserProvider,
  FetchProvider,
  GlobalStateProvider,
  PartyProvider,
  ErrorBoundary
} from '@sudoku-web/template';
import { AuthProvider } from '@sudoku-web/auth';
import { ThemeColorProvider } from '@sudoku-web/ui';

function App() {
  return (
    <ErrorBoundary>
      <CapacitorProvider>
        <RevenueCatProvider apiKey={REVENUECAT_KEY}>
          <ThemeColorProvider>
            <FetchProvider baseUrl={API_URL}>
              <AuthProvider useFetch={useFetch}>
                <UserProvider>
                  <GlobalStateProvider>
                    <PartyProvider>
                      <YourApp />
                    </PartyProvider>
                  </GlobalStateProvider>
                </UserProvider>
              </AuthProvider>
            </FetchProvider>
          </ThemeColorProvider>
        </RevenueCatProvider>
      </CapacitorProvider>
    </ErrorBoundary>
  );
}
```

### 2. Creating and Managing Parties

```tsx
import { useContext } from 'react';
import { PartyContext } from '@sudoku-web/template';

function PartyManagement() {
  const { parties, createParty, inviteMember, leaveParty } = useContext(PartyContext);

  const handleCreateParty = async () => {
    const party = await createParty({
      partyName: 'My Collaborative Group',
      maxSize: 10
    });
  };

  const handleInvite = async (partyId: string, email: string) => {
    await inviteMember(partyId, email);
  };

  return (
    <div>
      <button onClick={handleCreateParty}>Create Party</button>
      {parties.map(party => (
        <PartyCard
          key={party.partyId}
          party={party}
          onInvite={handleInvite}
        />
      ))}
    </div>
  );
}
```

### 3. Using Local Storage Hook

```tsx
import { useLocalStorage } from '@sudoku-web/template';

function Settings() {
  const [settings, setSettings] = useLocalStorage('app-settings', {
    notifications: true,
    theme: 'auto'
  });

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings.notifications}
          onChange={(e) =>
            setSettings({ ...settings, notifications: e.target.checked })
          }
        />
        Enable Notifications
      </label>
    </div>
  );
}
```

### 4. Server State Synchronization

```tsx
import { useServerStorage } from '@sudoku-web/template';

function CollaborativeComponent() {
  const [state, updateState] = useServerStorage<MyAppState>(
    'collaborative-state',
    defaultState
  );

  const handleUpdate = (newData: Partial<MyAppState>) => {
    updateState({ ...state, ...newData });
  };

  return <div>{JSON.stringify(state)}</div>;
}
```

### 5. Premium Features

```tsx
import { useContext } from 'react';
import { RevenueCatContext } from '@sudoku-web/template';

function PremiumFeature() {
  const { isPremium, offerings, purchasePackage } = useContext(RevenueCatContext);

  if (!isPremium) {
    return (
      <div>
        <h2>Upgrade to Premium</h2>
        <button onClick={() => purchasePackage(offerings[0])}>
          Subscribe
        </button>
      </div>
    );
  }

  return <PremiumContent />;
}
```

## Dependencies

```json
{
  "react": "^18",
  "react-dom": "^18",
  "@sudoku-web/auth": "*",
  "@sudoku-web/ui": "*",
  "@sudoku-web/shared": "*",
  "@sudoku-web/types": "*"
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

### Complete Application Setup

```tsx
import {
  CapacitorProvider,
  UserProvider,
  PartyProvider,
  ErrorBoundary,
  useOnline
} from '@sudoku-web/template';
import { AuthProvider } from '@sudoku-web/auth';
import { ThemeColorProvider, Header, Footer } from '@sudoku-web/ui';

function App() {
  return (
    <ErrorBoundary>
      <CapacitorProvider>
        <ThemeColorProvider>
          <AuthProvider useFetch={useFetch}>
            <UserProvider>
              <PartyProvider>
                <Layout />
              </PartyProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeColorProvider>
      </CapacitorProvider>
    </ErrorBoundary>
  );
}

function Layout() {
  const isOnline = useOnline();

  return (
    <div>
      <Header title="My App" />
      {!isOnline && <OfflineBanner />}
      <main>
        <Routes />
      </main>
      <Footer />
    </div>
  );
}
```

### Daily Limits Implementation

```tsx
import {
  hasReachedDailyLimit,
  incrementActionCount,
  getTodayActionCount
} from '@sudoku-web/template';

function FeatureButton() {
  const [count, setCount] = useState(getTodayActionCount('my-feature'));
  const limit = 10;

  const handleClick = () => {
    if (hasReachedDailyLimit('my-feature', limit)) {
      alert('Daily limit reached! Upgrade to premium for unlimited access.');
      return;
    }

    performAction();
    incrementActionCount('my-feature');
    setCount(getTodayActionCount('my-feature'));
  };

  return (
    <button onClick={handleClick}>
      Use Feature ({count}/{limit} today)
    </button>
  );
}
```

## Notes

- This package is **game-agnostic** - no game-specific logic included
- All providers support server-side rendering (SSR) with Next.js
- Party management is designed for any collaborative application
- Session tracking uses generic types for flexibility
- Premium features integrate with RevenueCat for cross-platform subscriptions
- Error boundaries catch and handle React errors gracefully
- Wake lock prevents device sleep during active sessions

## Related Packages

- `@sudoku-web/auth` - Authentication (provides auth context)
- `@sudoku-web/ui` - UI components (provides theme and layout)
- `@sudoku-web/shared` - Shared utilities (provides helpers)
- `@sudoku-web/types` - Shared types (provides type definitions)

## Version

Current version: 0.1.0
