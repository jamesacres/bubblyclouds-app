# Sudoku Web Monorepo - Quick Start Guide

Welcome to the Sudoku Web monorepo! This guide will help you get started with
development.

## Prerequisites

- **Node.js**: 20.10.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: For version control

## Project Structure

```
bubblyclouds-app/
├── apps/
│   ├── template/        # Generic reusable template library
│   └── sudoku/          # Sudoku-specific app
├── packages/
│   ├── types/           # Shared type definitions
│   └── shared/          # Shared utilities
├── turbo.json           # Turborepo configuration
└── package.json         # Root workspace configuration
```

## Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone <repo-url> bubblyclouds-app
cd bubblyclouds-app

# Install all dependencies (installs for all workspaces)
npm install
```

### 2. Development

#### Run all apps in development mode

```bash
npm run dev
```

#### Run specific workspace

```bash
# Sudoku app only
npm run dev:sudoku

# Template only (type checking)
npm run dev:template
```

### 3. Building

#### Build all workspaces

```bash
npm run build
```

#### Build specific workspace

```bash
# Sudoku app only
npm run build:sudoku

# Template only
npm run build:template
```

**Note**: Turborepo caches build outputs. Subsequent builds will be much faster!

### 4. Testing

#### Run all tests

```bash
npm test
```

#### Run tests for specific workspace

```bash
npm test --filter=@bubblyclouds-app/sudoku
```

#### Run tests in watch mode

```bash
npm run test:watch
```

### 5. Linting & Type Checking

#### Lint all workspaces

```bash
npm run lint
```

#### Fix linting issues

```bash
npm run lint:fix
```

#### Type check all workspaces

```bash
npm run type-check
```

## Platform Builds

### iOS (via Capacitor)

```bash
# Build and open in Xcode
npm run build:ios

# Or just open Xcode
npm run open:ios
```

### Android (via Capacitor)

```bash
# Build and open in Android Studio
npm run build:android

# Or just open Android Studio
npm run open:android

# Run on connected device
npm run start:android
```

### Electron (Desktop)

```bash
# Build Electron app
npm run build:electron
```

## Working with the Template

The `@bubblyclouds-app/template` package contains reusable components, hooks,
providers, and utilities.

### Importing from Template

```typescript
// In sudoku app or any other app
import {
  ErrorBoundary,
  Header,
  useAuth,
  UserProvider,
} from "@bubblyclouds-app/template";
```

### Template Exports

**Components**:

- Layout: `Header`, `HeaderBack`, `HeaderUser`, `HeaderOnline`, `Footer`
- UI: `ErrorBoundary`, `GlobalErrorHandler`, `ThemeSwitch`, `ThemeColorSwitch`,
  `ThemeControls`
- Interactive: `CopyButton`, `NotesToggle`, `CelebrationAnimation`,
  `AppDownloadModal`
- Business: `SocialProof`, `PremiumFeatures`

**Providers**:

- `CapacitorProvider` - Capacitor platform integration
- `RevenueCatProvider` - In-app purchases
- `UserProvider` - Authentication & user management
- `FetchProvider` - API client
- `ThemeColorProvider` - Theme management
- `GlobalStateProvider` - Global state
- `SessionsProvider` - Session management

**Hooks**:

- `useOnline` - Network connectivity
- `useLocalStorage` - Local storage with sync
- `useWakeLock` - Keep screen awake
- `useDrag` - Drag interactions
- `useFetch` - API requests
- `useDocumentVisibility` - Page visibility
- `useServerStorage` - Server-side storage

**Types**: 30+ shared types including `UserProfile`, `ServerState`, `Party`,
`Session`, `Timer`, etc.

**Helpers**: Platform detection, time formatting, PKCE, cell calculations, etc.

## Workspace Commands

Turborepo supports filtering workspaces:

```bash
# Run command in specific workspace
turbo run <command> --filter=@bubblyclouds-app/<workspace>

# Examples
turbo run build --filter=@bubblyclouds-app/sudoku
turbo run test --filter=@bubblyclouds-app/template
```

## Turborepo Features

### Build Caching

Turborepo caches build outputs based on file content. If nothing changed, builds
are instant!

```bash
# First build (cache miss)
npm run build  # ~30-60 seconds

# Second build (cache hit)
npm run build  # <5 seconds ✨
```

### Parallel Execution

Turborepo runs independent tasks in parallel automatically:

```bash
# Builds template and sudoku in parallel
npm run build
```

### Dependency-Aware Builds

Turborepo understands workspace dependencies:

```bash
# Builds template first, then sudoku (depends on template)
turbo run build --filter=@bubblyclouds-app/sudoku
```

## Development Workflow

### Adding a New Feature to Sudoku

1. **Check if template has what you need**
   ```bash
   # Browse template exports
   cat apps/template/src/index.ts
   ```

2. **Import from template if available**
   ```typescript
   import { Header, useAuth } from "@bubblyclouds-app/template";
   ```

3. **Create sudoku-specific code in `apps/sudoku/src/`**
   ```
   apps/sudoku/src/
   ├── components/     # Sudoku-specific components
   ├── hooks/          # Game-specific hooks
   └── helpers/        # Puzzle-specific logic
   ```

### Adding Generic Code to Template

1. **Create in `apps/template/src/`**
   ```
   apps/template/src/
   ├── components/     # Generic UI components
   ├── hooks/          # Reusable hooks
   ├── providers/      # App-wide providers
   └── types/          # Shared types
   ```

2. **Export from appropriate index file**
   ```typescript
   // apps/template/src/components/index.ts
   export { default as MyComponent } from "./MyComponent";
   ```

3. **Use in sudoku or other apps**
   ```typescript
   import { MyComponent } from "@bubblyclouds-app/template";
   ```

## Troubleshooting

### Build fails with "Cannot find module"

```bash
# Clean and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### Turborepo cache issues

```bash
# Clear Turborepo cache
rm -rf .turbo
npm run build
```

### Type errors after pulling changes

```bash
# Rebuild everything
npm run build
npm run type-check
```

### Platform build fails

**iOS/Android (Capacitor)**:

```bash
# Ensure web build is up to date
npm run build:sudoku

# Sync native projects
npx cap sync

# Then open platform
npm run open:ios  # or open:android
```

**Electron**:

```bash
# Ensure electron dependencies are installed
cd electron && npm install && cd ..

# Run electron build script
npm run build:electron
```

## Useful Commands Reference

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `npm install`            | Install all workspace dependencies |
| `npm run dev`            | Start all dev servers              |
| `npm run dev:sudoku`     | Start sudoku dev server only       |
| `npm run build`          | Build all workspaces               |
| `npm run build:sudoku`   | Build sudoku workspace only        |
| `npm test`               | Run all tests                      |
| `npm run lint`           | Lint all workspaces                |
| `npm run type-check`     | Type check all workspaces          |
| `npm run build:ios`      | Build for iOS (requires macOS)     |
| `npm run build:android`  | Build for Android                  |
| `npm run build:electron` | Build for desktop (Electron)       |

## Getting Help

- **Documentation**: See `/specs/002-turborepo-monorepo-setup/IMPLEMENTATION.md`
  for detailed implementation notes
- **Turborepo Docs**: https://turbo.build/repo/docs
- **Issues**: Check GitHub issues or create a new one

## Next Steps

- Explore the template components in `apps/template/src/components/`
- Review the sudoku app structure in `apps/sudoku/src/`
- Read the implementation documentation in
  `/specs/002-turborepo-monorepo-setup/`
- Start building! 🚀

---

**Happy coding!** If you have questions or run into issues, don't hesitate to
ask.
