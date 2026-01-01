# Bubbly Clouds App - Modular Turborepo Architecture

A modular, reusable web application framework built with Next.js, TypeScript,
and Turborepo. Designed for building collaborative applications with built-in
authentication, user management, and multi-platform support (web, iOS, Android,
Electron).

## Architecture Overview

This monorepo follows a package-based architecture where core functionality is
organized into reusable packages that multiple applications can build on:

```
bubblyclouds-app/
├── packages/              # Reusable packages (core functionality)
│   ├── auth/             # Authentication & user management
│   ├── ui/               # Shared UI components & theming
│   ├── template/         # Collaborative features (parties, sessions)
│   ├── games/            # Shared game logic & components
│   ├── sudoku/           # Sudoku-specific logic
│   └── types/            # Shared TypeScript types
│
├── apps/                 # Applications (consume packages)
│   ├── template/         # Standalone collaboration app
│   └── sudoku/           # Game app (extends template)
│
└── specs/                # Feature specifications & documentation
```

### Package Dependency Graph

```
Apps Layer:
┌─────────────────┐     ┌─────────────────┐
│  Template App   │     │   Sudoku App    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ├───────────────────────┤
         │                       │
Feature Packages:
┌────────┴────────┬───────────┴──────────┬────────────┐
│ @bubblyclouds   │  @bubblyclouds       │ @bubbly    │
│ -app/auth       │  -app/template       │ clouds-app/│
│                 │                      │ sudoku     │
└────────┬────────┴──────────┬───────────┴────────────┘
         │                   │
Game & UI Packages:
┌────────┴─────────┬─────────┴──────┬──────────────┐
│ @bubblyclouds    │ @bubblyclouds  │ @bubblyclouds│
│ -app/games       │ -app/ui        │ -app/types   │
└──────────────────┴────────────────┴──────────────┘
```

**Key Principles**:

- Apps import from packages (never the reverse)
- Core packages (types) have no dependencies on feature packages
- Template package is game-agnostic (no sudoku references)
- Sudoku package contains all game-specific logic

## Quick Start

### Prerequisites

- Node.js 20.10.0 or higher
- npm 8 or higher

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bubblyclouds-app

# Install dependencies
npm install
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Run specific app
npm run dev:template    # Template app only
npm run dev:sudoku      # Sudoku app only
```

### Building

```bash
# Build all packages and apps
npm run build

# Build specific app
npm run build:template
npm run build:sudoku

# Build for specific platforms
npm run build:sudoku:capacitor     # Sudoku iOS/Android
npm run build:sudoku:electron      # Sudoku desktop
npm run build:template:capacitor   # Template iOS/Android
npm run build:template:electron    # Template desktop
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests in watch mode
npm test:watch

# Run tests for CI
npm test:ci
```

### Code Quality

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## Package Documentation

Each package has comprehensive documentation including API reference,
integration guides, and examples:

### Core Packages

- **[@bubblyclouds-app/auth](./packages/auth/README.md)** - Authentication & user
  management
  - OAuth 2.0 with PKCE flow
  - Multi-platform support (web, iOS, Android, Electron)
  - User profile management
  - Session persistence

- **[@bubblyclouds-app/ui](./packages/ui/README.md)** - Shared UI components & theming
  - Dark/light mode support
  - Custom theme colors
  - Responsive layout components
  - Platform-specific adaptations

- **[@bubblyclouds-app/template](./packages/template/README.md)** - Collaborative
  features (game-agnostic)
  - Party/group management
  - Session tracking
  - Member invitations
  - Application infrastructure
  - Premium features integration

- **[@bubblyclouds-app/games](./packages/games/README.md)** - Shared game logic &
  components
  - Scoring utilities
  - Leaderboard components
  - Race tracking
  - Traffic light system
  - Game-agnostic helpers

- **[@bubblyclouds-app/sudoku](./packages/sudoku/README.md)** - Sudoku game logic &
  components
  - Puzzle validation and solving
  - Grid calculations
  - Game state management
  - Timer functionality
  - Daily puzzle tracking

### Utility Packages

- **[@bubblyclouds-app/types](./packages/types/README.md)** - Shared TypeScript types
  - Type definitions
  - Interfaces
  - Enums

## Application Documentation

### Template App

The template app is a standalone application with:

- User authentication (OAuth + email)
- User profile management
- Party/group creation and management
- Session/collaboration tracking
- User invitations
- Responsive design
- Dark mode support

**No game logic included** - perfect for building new collaborative
applications.

### Sudoku App

The sudoku app extends the template with:

- All template features (auth, parties, sessions)
- Sudoku puzzle grid
- Game solver and validation
- Racing/competitive mode
- Player rankings
- Game history tracking

## Developer Resources

### Package Documentation

Each package includes:

- Purpose and responsibility
- Public API documentation
- Integration guides with examples
- Type definitions
- Development commands

### Specifications

- **[specs/](./specs/)** - Feature specifications and documentation
  - [003-modular-turborepo-architecture](./specs/003-modular-turborepo-architecture/) -
    Current architecture spec

### Development Guides

- Creating new packages
- Understanding package dependencies
- Importing from packages
- Common development tasks
- Troubleshooting

## Multi-Platform Support

This project supports multiple platforms:

### Web

```bash
npm run dev           # Development
npm run build         # Production build
```

### iOS/Android (Capacitor)

```bash
# Build for mobile platforms
npm run build:sudoku:capacitor     # Build Sudoku for iOS/Android
npm run build:template:capacitor   # Build Template for iOS/Android

# Then use Capacitor CLI to run on devices
npx cap open ios        # Open in Xcode
npx cap open android    # Open in Android Studio
```

### Desktop (Electron)

```bash
npm run build:sudoku:electron      # Build Sudoku desktop app
npm run build:template:electron    # Build Template desktop app
```

## Technology Stack

- **Framework**: Next.js 16
- **Language**: TypeScript 5
- **Build Tool**: Turborepo
- **Package Manager**: npm workspaces
- **Styling**: Tailwind CSS 4
- **Testing**: Jest + React Testing Library
- **Mobile**: Capacitor 7
- **Desktop**: Electron 30
- **UI Libraries**: Headless UI, React Feather
- **Other**: TensorFlow.js (AI features), RevenueCat (payments)

## Project Structure

```
bubblyclouds-app/
├── apps/
│   ├── template/         # Standalone collaboration app
│   │   ├── src/         # App source code
│   │   ├── public/      # Static assets
│   │   └── package.json
│   └── sudoku/          # Game app
│       ├── src/         # App source code
│       ├── public/      # Static assets
│       └── package.json
│
├── packages/
│   ├── auth/            # Authentication package
│   ├── ui/              # UI components package
│   ├── template/        # Template features package
│   ├── games/           # Shared game logic package
│   ├── sudoku/          # Sudoku-specific package
│   └── types/           # TypeScript types
│
├── specs/               # Feature specifications
│   └── 003-modular-turborepo-architecture/
│       ├── spec.md      # Architecture specification
│       ├── quickstart.md # Developer quickstart
│       ├── data-model.md # Data model documentation
│       └── contracts/   # Package contracts
│
├── scripts/             # Build scripts
├── android/             # Android platform files
├── ios/                 # iOS platform files
├── electron/            # Electron platform files
│
├── package.json         # Root package configuration
├── turbo.json          # Turborepo configuration
├── tsconfig.json       # TypeScript configuration
└── jest.config.js      # Jest configuration
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass: `npm test`
4. Ensure linting passes: `npm run lint`
5. Ensure TypeScript compiles: `npm run type-check`
6. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions:

- GitHub Issues: [repository-url]/issues
- Documentation: See `/specs` directory

## Version

Current Version: 0.1.0

See CHANGELOG.md for version history.
