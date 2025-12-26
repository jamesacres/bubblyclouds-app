# Research: Template Extraction for Multi-App Platform

**Date**: 2025-11-01 | **Feature**: Template Extraction (001) | **Phase**: Planning

This document captures the extraction approach and key decisions for refactoring Sudoku's generic code into a reusable template.

---

## Extraction Strategy

### Principle: Extract as-is, Don't Redesign

**Key Decision**: The template extraction is a **refactoring task**, not an architecture redesign. We extract existing code that already works, without changing:
- Backend API configuration
- Type definitions (User, Session, Party, Invite, etc.)
- API service calls and endpoints
- Authentication flow
- State management patterns
- Test infrastructure

This keeps the risk low and delivery focused.

### What Code Is "Generic"?

**Generic code** = Code that works the same way regardless of the app:
- Authentication (useAuth hook, auth state management)
- Auth service integration (OAuth redirects, session persistence)
- User profile management (display name, avatar, preferences)
- Theme switching (dark/light mode)
- Error boundaries and error handling
- Navigation and tab layout
- Session/party CRUD operations
- Loading states and skeletons
- Form components and validation helpers
- Storage and utility functions

**Sudoku-specific code** = Code tied to the game:
- Puzzle generation and solving logic
- Game board UI (grid, cell input, pencil marks)
- Timer and scoring
- Daily puzzle system
- Leaderboards and racing
- Book system (series/collections)
- Sudoku page layouts and routes

### Why This Boundary?

**Generic code** solves these problems for ANY app:
- "How do I authenticate users?"
- "How do I manage user profiles?"
- "How do I create and join parties?"
- "How do I handle errors gracefully?"

**Sudoku-specific code** solves:
- "How do I generate valid Sudoku puzzles?"
- "How do I display the game board?"
- "How do I track racing progress?"

---

## Extraction Approach

### Phase 1: Audit & Identify

**Goal**: Walk through Sudoku `src/` and categorize each file as "generic" or "sudoku-specific"

**Steps**:
1. List all components in `src/components/`
   - Mark: Navigation, Profile, Settings, Tabs → "generic"
   - Mark: GameBoard, SudokuGrid, SessionRow → "sudoku-specific"

2. List all hooks in `src/hooks/`
   - Mark: useAuth, useUser, useTheme, useSession, useParty → "generic"
   - Mark: usePuzzle, useGameState, useDailyPuzzle → "sudoku-specific"

3. List all services in `src/services/`
   - Mark: authService, userService, sessionService, partyService → "generic"
   - Mark: puzzleService, scoringService, dailyPuzzleService → "sudoku-specific"

4. Types in `src/types/`
   - Mark: User, Session, Party, Invite, Member → "generic"
   - Mark: Puzzle, GameState, DailyChallenge → "sudoku-specific"

5. Utils in `src/lib/` or `src/utils/`
   - Mark: formatters, validators, storage helpers → "generic"
   - Mark: puzzle solvers, scoring algorithms → "sudoku-specific"

**Output**: A categorized list of files to extract vs. keep

### Phase 2: Create Template Structure

**Goal**: Set up `packages/template/` with same structure as Sudoku `src/`

**Steps**:
1. Create directory structure:
   ```
   packages/template/
   ├── src/
   │   ├── components/
   │   ├── hooks/
   │   ├── providers/
   │   ├── services/
   │   ├── types/
   │   ├── utils/
   │   └── config/
   ├── __mocks__/
   ├── tests/
   └── package.json
   ```

2. Copy Sudoku's `package.json` and adjust:
   - Name: `"name": "@packages/template"`
   - Remove sudoku-specific dependencies if any
   - Keep all shared dependencies (React, Next.js, etc.)

3. Copy Tailwind and TypeScript configs from Sudoku

### Phase 3: Copy Generic Code

**Goal**: Copy all "generic" code identified in Phase 1 to template

**Steps**:
1. Copy generic components to `packages/template/src/components/`
2. Copy generic hooks to `packages/template/src/hooks/`
3. Copy generic services to `packages/template/src/services/`
4. Copy generic types to `packages/template/src/types/`
5. Copy generic utils to `packages/template/src/utils/`
6. Copy generic tests (adjust imports)

**Important**: Don't delete from Sudoku yet—we'll remove after validation

**Import Paths**:
- Update all imports within template to use relative paths or `@packages/template`
- Verify imports resolve correctly

### Phase 4: Wire Sudoku to Use Template

**Goal**: Update Sudoku to import generic code from template instead of local `src/`

**Steps**:
1. Add dependency in `apps/sudoku/package.json`:
   ```json
   {
     "dependencies": {
       "@packages/template": "workspace:*"
     }
   }
   ```

2. Update imports in Sudoku:
   ```typescript
   // Before
   import { useAuth } from '@/hooks';
   import { AuthProvider } from '@/providers';

   // After
   import { useAuth } from '@packages/template';
   import { AuthProvider } from '@packages/template/providers';
   ```

3. Keep Sudoku-specific imports local:
   ```typescript
   // These stay in Sudoku
   import { usePuzzle } from '@/sudoku/hooks';
   import { GameBoard } from '@/sudoku/components';
   ```

4. Remove or comment out duplicated code in Sudoku `src/` after successful import from template

### Phase 5: Testing & Validation

**Goal**: Ensure Sudoku works identically before and after extraction

**Steps**:
1. **Run test suite**: `npm test` should pass with same coverage
2. **Check imports**: Verify no circular dependencies
3. **Build**: `npm run build` succeeds
4. **Platform builds**: iOS, Android, Electron builds succeed
5. **Manual testing**: Verify game functionality hasn't changed
6. **Bundle size**: Compare before/after (should be same or smaller)

---

## Key Implementation Details

### Preserving Existing Behavior

**No changes to**:
- Backend API client configuration or authentication
- Type definitions
- API service endpoints
- State management
- Test infrastructure

**What changes**:
- File locations (from `src/hooks/` to `@packages/template/hooks/`)
- Import paths in Sudoku (add `@packages/template/` prefix for generic code)
- Directory structure (template package added)

### Handling Shared Configuration

**Tailwind CSS**:
- Can stay at template root or in template package
- Sudoku extends or inherits template config

**Next.js config**:
- May need adjustments for monorepo (handled by feature 002)
- Template and Sudoku share same base config

**TypeScript**:
- Share root `tsconfig.json` from feature 002
- Template and Sudoku extend root config

**Jest**:
- Existing setup preserved
- Mocks organized in template and Sudoku

### What "Generic" Really Means

A component/hook is truly generic if:
- ✅ Works without any game state (no puzzle, score, timer)
- ✅ Accepts game state via props or generics (e.g., `useSession<T>`)
- ✅ No hardcoded strings referring to "Sudoku" or "puzzle"
- ✅ Tests don't mock game-specific logic
- ✅ No imports from `sudoku/` directory

### Edge Cases to Watch

**Q: What if a component uses data from both generic and game-specific hooks?**
A: Keep it in Sudoku. It's not fully generic.

**Q: What about shared types that extend generic types?**
A: Generic base types in template, extensions in Sudoku.

**Q: What about styling that's shared?**
A: Keep in template as Tailwind utility classes or shared CSS.

---

## Success Checklist

- ✅ Audit completed: All files categorized
- ✅ Template structure created with correct layout
- ✅ Generic code copied to template with updated imports
- ✅ Sudoku updated to import from template
- ✅ All tests pass without regressions
- ✅ App builds successfully for all platforms
- ✅ Manual testing confirms feature parity
- ✅ No changes to backend API, types, or API calls
- ✅ Documentation reflects new structure

---

## Summary

The template extraction is a straightforward refactoring of existing, working code. We're not redesigning the architecture—we're just moving code to a different location and updating imports. The backend API, types, and API calls remain unchanged. This approach keeps risk low while enabling code reuse for new apps.
