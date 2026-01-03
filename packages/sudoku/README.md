# @bubblyclouds-app/sudoku

Sudoku game logic, algorithms, and UI components package.

## Purpose

Provides Sudoku-specific game logic including puzzle generation, solving algorithms, grid validation, game state management, and reusable game UI components.

## Responsibility

- Sudoku puzzle validation and solving
- Grid and cell calculations
- Game state management
- Timer functionality
- Puzzle parsing and formatting
- Daily puzzle tracking
- Racing/competitive mode types
- Reusable game UI components (NumberPad, Timer, TrafficLight)

## Public API

### Components

#### `NumberPad`
Number input pad for sudoku cell entry.

```tsx
import { NumberPad } from '@bubblyclouds-app/sudoku';

<NumberPad
  onSelect={(number) => handleNumberSelect(number)}
  selectedNumber={selectedNumber}
  disabled={false}
/>
```

**Props:**
- `onSelect: (number: number) => void` - Callback when number is selected
- `selectedNumber?: number` - Currently selected number (1-9)
- `disabled?: boolean` - Disable number selection

#### `TimerDisplay`
Displays elapsed time in formatted format.

```tsx
import { TimerDisplay } from '@bubblyclouds-app/sudoku';

<TimerDisplay seconds={elapsed} />
// Displays: "2:35"
```

**Props:**
- `seconds: number` - Elapsed time in seconds

#### `TrafficLight`
Visual indicator for puzzle correctness (red/yellow/green).

```tsx
import { TrafficLight } from '@bubblyclouds-app/sudoku';

<TrafficLight status="correct" />
```

**Props:**
- `status: 'error' | 'incomplete' | 'correct'` - Current puzzle status

### Hooks

#### `useTimer`
Game timer hook with start/stop/reset functionality.

```tsx
import { useTimer } from '@bubblyclouds-app/sudoku';

function GameComponent() {
  const { seconds, isRunning, start, stop, reset } = useTimer();

  return (
    <div>
      <TimerDisplay seconds={seconds} />
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

**Returns:**
```typescript
{
  seconds: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}
```

### Helpers

#### Puzzle Validation

```tsx
import { checkCell, checkGrid, isInitialCell } from '@bubblyclouds-app/sudoku';

// Check if a single cell is correct
const isCorrect = checkCell(grid, rowIndex, colIndex);

// Check if entire grid is valid and complete
const isComplete = checkGrid(grid);

// Check if cell is part of initial puzzle (not user-entered)
const isInitial = isInitialCell(puzzle, rowIndex, colIndex);
```

#### Completion Calculation

```tsx
import { calculateCompletionPercentage } from '@bubblyclouds-app/sudoku';

const percentage = calculateCompletionPercentage(grid);
// Returns: 0-100 (percentage of filled cells)
```

#### Puzzle Parsing

```tsx
import { puzzleTextToPuzzle } from '@bubblyclouds-app/sudoku';

const puzzleString = "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79";
const puzzle = puzzleTextToPuzzle(puzzleString);
// Returns: Puzzle (9x9 2D array)
```

#### Cell ID Calculations

```tsx
import {
  calculateBoxId,
  calculateCellId,
  splitCellId,
  calculateNextCellId
} from '@bubblyclouds-app/sudoku';

// Calculate box ID from row/col (0-8)
const boxId = calculateBoxId(4, 5); // Returns: 4

// Calculate cell ID from row/col
const cellId = calculateCellId(3, 6); // Returns: "3-6"

// Split cell ID back to row/col
const { row, col } = splitCellId("3-6"); // Returns: { row: 3, col: 6 }

// Calculate next cell ID (for auto-advance)
const nextId = calculateNextCellId("3-6"); // Returns: "3-7"
```

### Utilities

#### Daily Puzzle Tracking

```tsx
import {
  getTodayDateString,
  getDailyPuzzleIds,
  addDailyPuzzleId,
  getDailyPuzzleCount
} from '@bubblyclouds-app/sudoku';

// Get today's date string (YYYY-MM-DD)
const today = getTodayDateString();

// Get list of puzzle IDs completed today
const completedIds = getDailyPuzzleIds();

// Add a puzzle ID to today's completed list
addDailyPuzzleId('puzzle-123');

// Get count of puzzles completed today
const count = getDailyPuzzleCount(); // Returns: number
```

### Types

#### `Cell`
Sudoku cell information.

```typescript
interface Cell {
  value: number; // 0 = empty, 1-9 = filled
  isInitial: boolean; // True if part of original puzzle
  isError?: boolean; // True if cell contains error
  notes?: number[]; // Note-taking mode (candidate numbers)
}
```

#### `SudokuGrid`
9x9 sudoku grid.

```typescript
type SudokuGrid = Cell[][];
```

#### `SudokuState`
Complete game state.

```typescript
interface SudokuState {
  grid: SudokuGrid;
  selectedCell?: { row: number; col: number };
  selectedNumber?: number;
  notes?: Notes;
  timer: Timer;
  completed: boolean;
}
```

#### `Puzzle`
Initial puzzle definition.

```typescript
type Puzzle = number[][];  // 9x9 array, 0 = empty
type PuzzleRow = number[]; // Single row (9 numbers)
type PuzzleBox = number[]; // Single box (9 numbers)
type PuzzleRowOrColumn = number[]; // Row or column
```

#### `Notes`
Note-taking for candidate numbers.

```typescript
interface Notes {
  [cellId: string]: number[]; // "row-col": [1, 2, 3]
}

type ToggleNote = (cellId: string, number: number) => void;
```

#### `Timer`
Timer state information.

```typescript
interface Timer {
  seconds: number;
  isRunning: boolean;
}
```

#### Game State Types

```typescript
// Select a number from number pad
type SelectNumber = (number: number) => void;

// Set currently selected cell
type SetSelectedCell = (row: number, col: number) => void;

// Set answer for a cell
type SetAnswer = (row: number, col: number, value: number) => void;

// Game metadata
interface GameStateMetadata {
  puzzleId: string;
  difficulty: Difficulty;
  startedAt: Date;
  completedAt?: Date;
}

// Complete game state (generic)
interface GameState<T = any> {
  grid: SudokuGrid;
  metadata: GameStateMetadata;
  customState?: T; // App-specific state
}
```

#### Server Types

Server response types for API integration:

```typescript
enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

enum BookPuzzleDifficulty {
  BEGINNER = 'beginner',
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  CHALLENGING = 'challenging'
}

enum EntitlementDuration {
  LIFETIME = 'lifetime',
  ONE_MONTH = 'one_month',
  ONE_YEAR = 'one_year'
}

// Daily puzzle from server
interface SudokuOfTheDayResponse {
  puzzleId: string;
  puzzle: string; // Puzzle text format
  difficulty: Difficulty;
  date: string;
}

interface SudokuOfTheDay {
  puzzleId: string;
  puzzle: Puzzle;
  difficulty: Difficulty;
  date: Date;
}

// Book puzzle from server
interface SudokuBookPuzzle {
  puzzleId: string;
  puzzle: Puzzle;
  difficulty: BookPuzzleDifficulty;
  bookNumber: number;
  pageNumber: number;
}

interface SudokuBookOfTheMonthResponse {
  bookNumber: number;
  month: string;
  puzzles: SudokuBookPuzzle[];
}

interface SudokuBookOfTheMonth {
  bookNumber: number;
  month: Date;
  puzzles: SudokuBookPuzzle[];
}

// Session, Party, Member types (collaborative features)
interface SessionResponse<T>;
interface Session<T>;
interface SessionParty<T>;
interface Parties<T>;
interface StateResponse<T>;
interface ServerStateResult<T>;
interface PartyResponse;
interface MemberResponse;
interface Member;
interface Party;
interface InviteResponse;
interface Invite;
interface PublicInvite;
```

### Constants

```tsx
import { emptyPuzzle } from '@bubblyclouds-app/sudoku';

// 9x9 grid of zeros (empty puzzle)
const puzzle = emptyPuzzle;
```

## Integration Guide

### 1. Basic Sudoku Game

```tsx
import {
  SudokuGrid,
  NumberPad,
  TimerDisplay,
  useTimer,
  checkGrid,
  checkCell
} from '@bubblyclouds-app/sudoku';

function SudokuGame({ initialPuzzle }) {
  const [grid, setGrid] = useState(initializeGrid(initialPuzzle));
  const [selectedCell, setSelectedCell] = useState(null);
  const { seconds, isRunning, start, stop } = useTimer();

  const handleCellClick = (row, col) => {
    if (!grid[row][col].isInitial) {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberSelect = (number) => {
    if (!selectedCell) return;

    const newGrid = updateCell(grid, selectedCell.row, selectedCell.col, number);
    setGrid(newGrid);

    if (checkGrid(newGrid)) {
      stop();
      alert('Puzzle complete!');
    }
  };

  return (
    <div>
      <TimerDisplay seconds={seconds} />
      <GridComponent
        grid={grid}
        selectedCell={selectedCell}
        onCellClick={handleCellClick}
      />
      <NumberPad
        onSelect={handleNumberSelect}
        selectedNumber={null}
      />
    </div>
  );
}
```

### 2. Puzzle Validation

```tsx
import { checkCell, checkGrid, calculateCompletionPercentage } from '@bubblyclouds-app/sudoku';

function validatePuzzle(grid: SudokuGrid) {
  // Check if puzzle is complete
  if (checkGrid(grid)) {
    return { status: 'complete', errors: [] };
  }

  // Find errors
  const errors = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (!checkCell(grid, row, col)) {
        errors.push({ row, col });
      }
    }
  }

  // Calculate progress
  const completion = calculateCompletionPercentage(grid);

  return { status: 'incomplete', errors, completion };
}
```

### 3. Daily Puzzle Tracking

```tsx
import {
  getDailyPuzzleCount,
  addDailyPuzzleId,
  getTodayDateString
} from '@bubblyclouds-app/sudoku';

function DailyPuzzleTracker() {
  const [count, setCount] = useState(getDailyPuzzleCount());
  const maxDaily = 3; // Free tier limit

  const handlePuzzleComplete = (puzzleId: string) => {
    addDailyPuzzleId(puzzleId);
    setCount(getDailyPuzzleCount());
  };

  const canPlayMore = count < maxDaily;

  return (
    <div>
      <p>Puzzles completed today: {count}/{maxDaily}</p>
      {!canPlayMore && <UpgradeToPremiumButton />}
    </div>
  );
}
```

### 4. Timer Integration

```tsx
import { useTimer, TimerDisplay } from '@bubblyclouds-app/sudoku';

function GameWithTimer() {
  const timer = useTimer();

  useEffect(() => {
    // Start timer when component mounts
    timer.start();

    // Stop timer when puzzle is complete
    if (isPuzzleComplete) {
      timer.stop();
    }

    return () => timer.stop();
  }, [isPuzzleComplete]);

  return (
    <div>
      <TimerDisplay seconds={timer.seconds} />
      <button onClick={timer.reset}>Reset Timer</button>
    </div>
  );
}
```

### 5. Puzzle Parsing

```tsx
import { puzzleTextToPuzzle } from '@bubblyclouds-app/sudoku';

async function loadPuzzle(puzzleId: string) {
  const response = await fetch(`/api/puzzles/${puzzleId}`);
  const data = await response.json();

  // Convert puzzle string to 2D array
  const puzzle = puzzleTextToPuzzle(data.puzzleText);

  return puzzle;
}
```

## Dependencies

```json
{
  "react": "^18",
  "react-dom": "^18",
  "mathjs": "^13.0.2"
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

### Complete Game Component

```tsx
import {
  NumberPad,
  TimerDisplay,
  TrafficLight,
  useTimer,
  checkGrid,
  checkCell,
  calculateCompletionPercentage,
  type SudokuGrid
} from '@bubblyclouds-app/sudoku';

function SudokuGameComplete() {
  const [grid, setGrid] = useState<SudokuGrid>(initialGrid);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const timer = useTimer();
  const [status, setStatus] = useState<'incomplete' | 'error' | 'correct'>('incomplete');

  useEffect(() => {
    timer.start();
  }, []);

  useEffect(() => {
    const hasErrors = hasErrorsInGrid(grid);
    const isComplete = checkGrid(grid);

    if (isComplete) {
      setStatus('correct');
      timer.stop();
    } else if (hasErrors) {
      setStatus('error');
    } else {
      setStatus('incomplete');
    }
  }, [grid]);

  const completion = calculateCompletionPercentage(grid);

  return (
    <div className="game-container">
      <header>
        <TrafficLight status={status} />
        <TimerDisplay seconds={timer.seconds} />
        <div>{completion}% Complete</div>
      </header>

      <main>
        <GridComponent
          grid={grid}
          selectedCell={selectedCell}
          onCellClick={setSelectedCell}
        />
      </main>

      <footer>
        <NumberPad
          onSelect={(num) => handleNumberInput(num)}
          selectedNumber={null}
        />
      </footer>
    </div>
  );
}
```

### Racing Mode Integration

```tsx
import {
  useTimer,
  checkGrid,
  calculateCompletionPercentage,
  type SudokuGrid
} from '@bubblyclouds-app/sudoku';

function RacingMode({ partyMembers }) {
  const [myGrid, setMyGrid] = useState<SudokuGrid>(initialGrid);
  const [memberProgress, setMemberProgress] = useState<Record<string, number>>({});
  const timer = useTimer();

  // Sync progress with other party members
  useEffect(() => {
    const myProgress = calculateCompletionPercentage(myGrid);

    // Broadcast to party
    broadcastProgress(myProgress);
  }, [myGrid]);

  // Listen for other members' progress
  useEffect(() => {
    const unsubscribe = subscribeToPartyProgress((updates) => {
      setMemberProgress(updates);
    });

    return unsubscribe;
  }, []);

  const leaderboard = Object.entries(memberProgress)
    .sort(([, a], [, b]) => b - a);

  return (
    <div>
      <TimerDisplay seconds={timer.seconds} />

      <div className="leaderboard">
        {leaderboard.map(([userId, progress]) => (
          <div key={userId}>
            {userId}: {progress}%
          </div>
        ))}
      </div>

      <GridComponent grid={myGrid} onUpdate={setMyGrid} />
    </div>
  );
}
```

## Notes

- This package contains **only sudoku-specific logic** - no generic app infrastructure
- Some components (SudokuBox, Sudoku, SimpleSudoku, RaceTrack) are NOT exported because they have app-specific dependencies. Apps should implement their own versions or copy these as templates.
- `useGameState` hook is NOT exported for the same reason - it depends on party/session hooks from `@bubblyclouds-app/template`
- All algorithms use efficient mathematical calculations (mathjs) for performance
- Timer uses requestAnimationFrame for accurate timing
- Daily puzzle tracking uses localStorage with automatic date rollover
- Grid validation checks rows, columns, and 3x3 boxes for duplicates

## Related Packages

- `@bubblyclouds-app/template` - Collaborative features (party/session management)
- `@bubblyclouds-app/ui` - UI components (used in game UI)
- `mathjs` - Mathematical operations library

## Version

Current version: 0.1.0
