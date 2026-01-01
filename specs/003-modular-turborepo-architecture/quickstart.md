# Quick Start: Using the Modular Architecture

**Date**: 2025-11-02
**Target Audience**: Developers working with the modular Turborepo

---

## Architecture Overview

The sudoku-web monorepo is organized into reusable packages that multiple applications can build on:

```
📦 Packages (core functionality)
├── @bubblyclouds-app/auth     → Authentication & user management
├── @bubblyclouds-app/ui       → Shared UI components & theming
├── @bubblyclouds-app/template → Collaborative features (parties, sessions)
├── @bubblyclouds-app/sudoku   → Game-specific logic
└── @bubblyclouds-app/shared   → Generic utilities

🚀 Applications (consume packages)
├── apps/template → Standalone collaboration app (auth + ui + template)
└── apps/sudoku   → Game app (auth + ui + sudoku + template)
```

---

## For App Developers

### Building the Template App (Standalone)

The template app is a complete, self-contained application with user authentication and collaborative features:

```bash
# Install dependencies
npm install

# Build template app only
npm run build -w apps/template

# Run template app
npm run dev -w apps/template

# Visit http://localhost:3000
```

**What template app includes**:
- ✅ User login/signup (OAuth + email)
- ✅ User profile management
- ✅ Party/group creation and management
- ✅ Session/collaboration tracking
- ✅ User invitations
- ✅ Responsive design
- ✅ Dark mode support
- ❌ No game logic

---

### Building the Sudoku App

The sudoku app extends the template with game-specific functionality:

```bash
# Install dependencies
npm install

# Build sudoku app
npm run build -w apps/sudoku

# Run sudoku app
npm run dev -w apps/sudoku

# Visit http://localhost:3001
```

**What sudoku app includes**:
- ✅ Everything from template app
- ✅ Sudoku puzzle grid
- ✅ Game solver and validation
- ✅ Racing/competitive mode
- ✅ Player rankings
- ✅ Game history tracking

---

## For Package Developers

### Creating a New Package

Want to create a new package (e.g., `@bubblyclouds-app/analytics`)?

1. **Create package structure**:
```bash
mkdir packages/analytics
cd packages/analytics
npm init -y
```

2. **Configure TypeScript**:
```bash
cp ../ui/tsconfig.json .
```

3. **Create source**:
```bash
mkdir src
touch src/index.ts
```

4. **Update root tsconfig.json** to add path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@bubblyclouds-app/analytics": ["packages/analytics/src"]
    }
  }
}
```

5. **Export public API only** (src/index.ts):
```typescript
// ✅ Export public API
export { AnalyticsProvider } from './providers/AnalyticsProvider';
export { useAnalytics } from './hooks/useAnalytics';
export type { AnalyticsEvent } from './types/AnalyticsEvent';

// ❌ Do NOT export internal implementations
// export { trackEventInternal } from './internal/tracking';
```

6. **Update root package.json**:
```json
{
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

---

### Understanding Package Dependencies

```
┌─────────────────────────┐
│   Template App          │
│   (apps/template)       │
├─────────────────────────┤
│ Imports:                │
│ • @bubblyclouds-app/auth     │
│ • @bubblyclouds-app/ui       │
│ • @bubblyclouds-app/template │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│   Packages              │
│ • auth                  │
│ • ui                    │
│ • template              │
├─────────────────────────┤
│ All depend on:          │
│ • @bubblyclouds-app/shared   │
│ • @bubblyclouds-app/types    │
└─────────────────────────┘
           ↓
┌─────────────────────────┐
│   Core Packages         │
│ • @bubblyclouds-app/shared   │
│ • @bubblyclouds-app/types    │
├─────────────────────────┤
│ Have NO dependencies    │
│ (except React, lodash)  │
└─────────────────────────┘
```

**Key Rule**: Apps import packages. Packages don't import apps. Core packages don't import feature packages.

---

### Importing from Packages

**Do This** ✅:
```typescript
// Import from package public API
import { useAuth } from '@bubblyclouds-app/auth';
import { Button, Header } from '@bubblyclouds-app/ui';
import { useParty } from '@bubblyclouds-app/template';
```

**Don't Do This** ❌:
```typescript
// DON'T import internals
import { AuthProvider } from '@bubblyclouds-app/auth/src/providers/AuthProvider';

// DON'T import from apps
import { SudokuGame } from 'apps/sudoku/src/components/SudokuGame';

// DON'T bypass the public API
import { getTokenInternal } from '@bubblyclouds-app/auth/src/internal/token';
```

---

## Common Tasks

### Task 1: Add a New Component to UI Package

1. **Create component file**:
```bash
# packages/ui/src/components/Card/Card.tsx
export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
}

export function Card({ children, variant = 'default' }: CardProps) {
  return <div className={`card card-${variant}`}>{children}</div>;
}
```

2. **Add to index.ts**:
```typescript
// packages/ui/src/index.ts
export { Card } from './components/Card/Card';
export type { CardProps } from './components/Card/Card';
```

3. **Write tests**:
```bash
# packages/ui/src/components/Card/Card.test.tsx
describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

4. **Use in app**:
```typescript
// apps/template/src/components/MyPage.tsx
import { Card } from '@bubblyclouds-app/ui';

export function MyPage() {
  return <Card>Page content here</Card>;
}
```

---

### Task 2: Add a New Hook to Auth Package

1. **Create hook**:
```typescript
// packages/auth/src/hooks/useVerifyEmail.ts
export function useVerifyEmail() {
  const { user } = useAuth();

  return {
    isVerified: user?.emailVerified ?? false,
    sendVerificationEmail: async () => { /* ... */ },
  };
}
```

2. **Export from index.ts**:
```typescript
// packages/auth/src/index.ts
export { useVerifyEmail } from './hooks/useVerifyEmail';
```

3. **Write tests**:
```typescript
// packages/auth/src/hooks/useVerifyEmail.test.ts
describe('useVerifyEmail', () => {
  it('returns verification status', () => {
    const { result } = renderHook(() => useVerifyEmail());
    expect(result.current.isVerified).toBe(false);
  });
});
```

4. **Use in app**:
```typescript
import { useVerifyEmail } from '@bubblyclouds-app/auth';

export function VerificationPrompt() {
  const { isVerified, sendVerificationEmail } = useVerifyEmail();
  // ...
}
```

---

### Task 3: Migrate Code from App into Package

1. **Identify the code**: What functionality should be in a shared package?
2. **Create package if needed**: Or add to existing package
3. **Move files**: Copy component/hook to package with tests
4. **Export from index.ts**: Add to package's public API
5. **Update imports**: Change all app imports to use `@bubblyclouds-app/*` alias
6. **Run tests**: Ensure no regressions (`npm test`)
7. **Delete old code**: Remove from app (if not needed)

Example:
```bash
# Move from app to template package
mv apps/sudoku/src/hooks/useParty.ts packages/template/src/hooks/useParty.ts
mv apps/sudoku/src/hooks/useParty.test.ts packages/template/src/hooks/useParty.test.ts

# Update app imports
# FROM: import { useParty } from 'src/hooks/useParty';
# TO:   import { useParty } from '@bubblyclouds-app/template';
```

---

### Task 4: Check for Sudoku References in Template Package

Want to ensure template package stays game-agnostic?

```bash
# Search for sudoku terminology
grep -r "sudoku\|puzzle\|game\|cell\|grid" packages/template/src --include="*.ts" --include="*.tsx"

# Should return 0 results if truly game-agnostic!
```

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests for Specific Package

```bash
npm test -w @bubblyclouds-app/auth
npm test -w apps/template
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Watch Mode (during development)

```bash
npm test -w @bubblyclouds-app/ui -- --watch
```

---

## Building for Deployment

### Build All Packages and Apps

```bash
npm run build
```

### Build Specific App

```bash
npm run build -w apps/sudoku
```

### Check TypeScript

```bash
npm run typecheck
```

### Lint Code

```bash
npm run lint
```

---

## Troubleshooting

### Issue: Module Not Found `@bubblyclouds-app/auth`

**Cause**: TypeScript path alias not configured or package not installed

**Solution**:
1. Check `tsconfig.json` has the path alias
2. Run `npm install`
3. Restart TypeScript server in IDE

---

### Issue: Circular Dependency Warning

**Cause**: Package A imports from Package B which imports from Package A

**Solution**:
1. Identify the circular dependency
2. Move shared code to a core package that both depend on
3. Or refactor one package to not import from the other

**Check for circular dependencies**:
```bash
npm run build 2>&1 | grep -i "circular"
```

---

### Issue: Tests Fail After Package Changes

**Cause**: Import paths or types changed

**Solution**:
1. Clear jest cache: `npx jest --clearCache`
2. Verify imports use correct path aliases
3. Check package index.ts exports everything needed
4. Run tests with verbose output: `npm test -- --verbose`

---

## Next Steps

1. **Add a new feature**: Use these packages as a foundation
2. **Create a new app**: Import the template package + add your custom logic
3. **Contribute a component**: Add to UI package and submit PR
4. **Start a new project**: Use this architecture as a template

---

## Resources

- **Package Contracts**: See `specs/003-modular-turborepo-architecture/contracts/`
- **Data Model**: See `specs/003-modular-turborepo-architecture/data-model.md`
- **Architecture Decision**: See `specs/003-modular-turborepo-architecture/research.md`
- **Tests**: See any `*.test.ts` or `*.test.tsx` file for testing examples
