# Bubbly Clouds App - Modular Turborepo Architecture

A modular, reusable web application framework built with Next.js, TypeScript,
and Turborepo. Designed for building collaborative applications with built-in
authentication, user management, and multi-platform support (web, iOS, Android,
Electron).

## Architecture Overview

This monorepo uses a **7-layer package architecture** with clear dependency
rules:

```
L6: @app-sudoku, @app-bubblyclouds, @app-jamesacres, @app-stephenesch (Next.js applications)
     ↓
L5: @sudoku (game-specific logic)
     ↓
L4: @games (game-agnostic features)
     ↓
L3: @template (collaboration infrastructure)
     ↓
L2: @auth (authentication)
     ↓
L0-L1: @ui, @types, @blog (foundation)
```

**Key Principle**: Packages only depend on lower layers, never higher ones.

**📖 Read [ARCHITECTURE.md](./ARCHITECTURE.md) for:**

- Complete 7-layer hierarchy and dependency rules
- Decision tree: which package should my code go in?
- Just-in-Time package pattern (no build steps!)
- Import guidelines and best practices
- Architectural principles

## Quick Start

### Prerequisites

- Node.js 24 or higher
- pnpm 10 or higher

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bubblyclouds-app

# Install dependencies
pnpm install
```

### Development

```bash
# Run default app in development mode (Sudoku)
pnpm run dev

# Or run specific apps
pnpm run dev:sudoku
pnpm run dev:bubblyclouds
pnpm run dev:jamesacres
pnpm run dev:stephenesch
```

### Building

```bash
# Build all packages and apps
pnpm run build

# Build specific apps
pnpm run build:sudoku
pnpm run build:bubblyclouds
pnpm run build:jamesacres
pnpm run build:stephenesch

# Build for specific platforms (Sudoku app)
pnpm run build:sudoku:capacitor     # Sudoku iOS/Android
pnpm run build:sudoku:electron      # Sudoku desktop
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run tests for CI
pnpm test:ci
```

### Code Quality

```bash
# Run linting
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Type checking
pnpm run type-check
```

## Package Documentation

Each package has comprehensive documentation including API reference,
integration guides, and examples:

### Core Packages

- **[@bubblyclouds-app/auth](./packages/auth/README.md)** - Authentication &
  user management
  - OAuth 2.0 with PKCE flow
  - Multi-platform support (web, iOS, Android, Electron)
  - User profile management
  - Session persistence

- **[@bubblyclouds-app/ui](./packages/ui/README.md)** - Shared UI components &
  theming
  - Dark/light mode support
  - Custom theme colors
  - Responsive layout components
  - Platform-specific adaptations

- **[@bubblyclouds-app/template](./packages/template/README.md)** -
  Collaborative features (game-agnostic)
  - Party/group management
  - Session tracking
  - Member invitations
  - Application infrastructure
  - Premium features integration

- **[@bubblyclouds-app/games](./packages/games/README.md)** - Shared game logic
  & components
  - Scoring utilities
  - Leaderboard components
  - Race tracking
  - Traffic light system
  - Game-agnostic helpers

- **[@bubblyclouds-app/sudoku](./packages/sudoku/README.md)** - Sudoku game
  logic & components
  - Puzzle validation and solving
  - Grid calculations
  - Game state management
  - Timer functionality
  - Daily puzzle tracking

- **[@bubblyclouds-app/blog](./packages/blog/README.md)** - Blog components &
  utilities
  - Reusable blog components (header, footer, post list)
  - Blog post types and metadata
  - Reading time calculation
  - Post sorting and filtering helpers

### Utility Packages

- **[@bubblyclouds-app/types](./packages/types/README.md)** - Shared TypeScript
  types
  - Type definitions
  - Interfaces
  - Enums

## Application Documentation

### Sudoku App

The Sudoku application is a collaborative puzzle game built on reusable
packages:

- **Core Features** (from `@template` package):
  - User authentication (OAuth + email)
  - Party/group creation and management
  - Session/collaboration tracking
  - User invitations and social features
  - Premium features integration

- **Game Features** (from `@sudoku` and `@games` packages):
  - Sudoku puzzle grid with validation
  - Puzzle solver and hints
  - Racing/competitive mode
  - Player rankings and leaderboards
  - Game history tracking

- **UI/UX** (from `@ui` and `@auth` packages):
  - Responsive design
  - Dark mode support
  - Platform-specific adaptations (web, mobile, desktop)

### Bubblyclouds Website

The Bubblyclouds website is the company landing page and marketing site:

- **Core Features** (from `@auth` package):
  - User authentication
  - User profile management

- **UI/UX** (from `@ui` package):
  - Responsive design
  - Dark mode support
  - Marketing pages (landing, privacy, terms)

### Blog Applications

Personal blog applications built with the reusable `@blog` package:

#### James Acres Blog

The James Acres blog website (`@app-jamesacres`) showcases personal projects
and writing:

- **Core Features** (from `@blog` package):
  - MDX-based blog posts with code syntax highlighting
  - Dark/light mode support with theme persistence
  - RSS feed generation
  - Reading time calculation
  - Post metadata and categorization

- **UI/UX**:
  - Responsive design
  - Clean, minimal blog layout
  - Navigation and post listing

#### Stephen Esch Blog

The Stephen Esch blog website (`@app-stephenesch`) follows the same architecture
as the James Acres blog:

- **Core Features** (from `@blog` package):
  - MDX-based blog posts with code syntax highlighting
  - Dark/light mode support with theme persistence
  - RSS feed generation
  - Reading time calculation
  - Post metadata and categorization

- **UI/UX**:
  - Responsive design
  - Clean, minimal blog layout
  - Navigation and post listing

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

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete architecture documentation
  - Package hierarchy and 7-layer dependency structure
  - Decision tree for choosing which package to add code to
  - Just-in-Time package pattern
  - Import guidelines and best practices
- Creating new packages
- Understanding package dependencies
- Importing from packages
- Common development tasks
- Troubleshooting

## Multi-Platform Support

This project supports multiple platforms:

### Web

```bash
pnpm run dev           # Development
pnpm run build         # Production build
```

### iOS/Android (Capacitor)

```bash
# Build for mobile platforms
pnpm run build:sudoku:capacitor     # Build Sudoku for iOS/Android

# Then use Capacitor CLI to run on devices
npx cap open ios        # Open in Xcode
npx cap open android    # Open in Android Studio
```

### Desktop (Electron)

```bash
pnpm run build:sudoku:electron      # Build Sudoku desktop app
```

## Technology Stack

- **Framework**: Next.js 16
- **Language**: TypeScript 5
- **Build Tool**: Turborepo
- **Package Manager**: pnpm workspaces
- **Styling**: Tailwind CSS 4
- **Testing**: Jest + React Testing Library
- **Mobile**: Capacitor 8
- **Desktop**: Electron 30
- **UI Libraries**: Headless UI, React Feather
- **Other**: TensorFlow.js (AI features), RevenueCat (payments)

## Project Structure

```
bubblyclouds-app/
├── apps/
│   ├── sudoku/          # Sudoku application
│   │   ├── src/         # App source code
│   │   ├── public/      # Static assets
│   │   └── package.json
│   ├── bubblyclouds/    # Bubblyclouds website
│   │   ├── src/         # App source code
│   │   ├── public/      # Static assets
│   │   └── package.json
│   ├── jamesacres/      # James Acres blog
│   │   ├── src/         # App source code
│   │   ├── public/      # Static assets
│   │   └── package.json
│   └── stephenesch/     # Stephen Esch blog
│       ├── src/         # App source code
│       ├── public/      # Static assets
│       └── package.json
│
├── packages/
│   ├── auth/            # Authentication package
│   ├── ui/              # UI components package
│   ├── template/        # Collaborative features package
│   ├── games/           # Game-agnostic game features
│   ├── sudoku/          # Sudoku-specific logic
│   ├── blog/            # Blog components & utilities package
│   └── types/           # Shared TypeScript types
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
├── ARCHITECTURE.md     # Architecture documentation
└── jest.config.js      # Jest configuration
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass: `pnpm test`
4. Ensure linting passes: `pnpm run lint`
5. Ensure TypeScript compiles: `pnpm run type-check`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE)
file for details.

## Credits and Attribution

This project builds upon several excellent projects.

See [CREDITS.md](./CREDITS.md) for complete attribution.

## Support

For issues and questions:

- GitHub Issues: [repository-url]/issues
- Documentation: See `/specs` directory
- Credits: See [CREDITS.md](./CREDITS.md)

## Version

Current Version: 0.1.0

See CHANGELOG.md for version history.
