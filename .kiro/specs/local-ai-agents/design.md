# Design Document: Local AI Agents

## Overview

This feature introduces local AI agents that compete alongside human players in
Sudoku multiplayer racing. Agents solve puzzles using the existing `humanSolve`
algorithm, with their performance calibrated by the Dreyfus model of skill
acquisition. Each agent is assigned a skill level (Novice through Expert) that
determines which techniques they can apply and how quickly they execute them.

The design uses a pre-computation approach: when a puzzle starts, the complete
solution timeline is calculated upfront for each agent. During gameplay, the
existing polling mechanism calculates agent progress by comparing the current
time against these pre-computed timelines. This eliminates the need for
additional timers or background processes.

Agents appear in a special "Local Agents" team, display animal emoji avatars,
and integrate seamlessly with existing UI components (RaceTrack and Friends
Sidebar).

### Key Design Decisions

1. **Pre-computation over real-time execution**: Calculate all agent timings
   upfront rather than executing techniques in real-time. This simplifies
   implementation and ensures consistent performance.

2. **Dreyfus model for skill levels**: Use the five-level Dreyfus model (Novice,
   Advanced Beginner, Competent, Proficient, Expert) to create meaningful skill
   differentiation.

3. **Technique-level blocking**: Agents get "stuck" (1-hour delay) when
   encountering techniques above their skill level, creating realistic
   skill-based progression.

4. **Polling-based progress**: Leverage existing polling infrastructure to
   update agent progress, avoiding additional timers or intervals.

5. **Animal emoji avatars**: Use animal emojis (🦉, 🐺, 🦊, etc.) to give agents
   personality and visual distinction.

## Architecture

### Component Structure

```
apps/sudoku/
└── src/
    └── app/
        └── puzzle/
            └── [id]/
                └── page.tsx (integrate agent display)

packages/sudoku/
└── src/
    ├── helpers/
    │   ├── agentSkillLevels.ts (Dreyfus level definitions)
    │   ├── techniqueCategories.ts (technique → level mapping)
    │   ├── techniqueTiming.ts (base times & multipliers)
    │   ├── agentTimeline.ts (pre-computation logic)
    │   └── agentProgress.ts (progress calculation)
    └── types/
        ├── Agent.ts (agent data structures)
        └── AgentTimeline.ts (timeline data structures)

packages/games/
└── src/
    └── components/
        ├── RaceTrack.tsx (extend to display agents)
        └── FriendsSidebar.tsx (extend to display agents)
```

### Data Flow

```
Puzzle Start
    ↓
humanSolve(puzzle) → complete solution path
    ↓
For each agent:
    ↓
Calculate timeline with timestamps
    - Apply technique level filtering
    - Calculate execution times (base × multiplier × jitter)
    - Add stuck durations for blocked techniques
    ↓
Store pre-computed timelines
    ↓
During gameplay (polling):
    ↓
Compare current time vs timeline
    ↓
Calculate progress percentage
    ↓
Update RaceTrack & Friends Sidebar
```

## Components and Interfaces

### Agent Data Structures

```typescript
// packages/sudoku/src/types/Agent.ts

import { ServerState } from "./state";
import { Technique } from "./Technique";

export enum DreyfusLevel {
  Novice = "novice",
  AdvancedBeginner = "advancedBeginner",
  Competent = "competent",
  Proficient = "proficient",
  Expert = "expert",
}

export interface LocalAgent {
  id: string;
  name: string;
  emoji: string;
  skillLevel: DreyfusLevel;
  timeline: AgentTimeline;
}

export interface AgentStep {
  technique: Technique;
  timestamp: number; // milliseconds from start
  state: ServerState; // Complete puzzle state at this step (for visualization)
  wasBlocked: boolean; // true if agent was stuck on this technique
}

export interface AgentTimeline {
  steps: AgentStep[];
  totalDuration: number; // milliseconds
}
```

### Technique Categorization

```typescript
// packages/sudoku/src/helpers/techniqueCategories.ts

import { Technique } from "../types/Technique";
import { DreyfusLevel } from "../types/Agent";

export const TECHNIQUE_LEVELS: Record<Technique, DreyfusLevel> = {
  // Novice: Basic singles
  nakedSingle: DreyfusLevel.Novice,
  hiddenSingleBox: DreyfusLevel.Novice,
  hiddenSingleRow: DreyfusLevel.Novice,
  hiddenSingleCol: DreyfusLevel.Novice,

  // Advanced Beginner: Basic sets and locked candidates
  nakedPair: DreyfusLevel.AdvancedBeginner,
  hiddenPair: DreyfusLevel.AdvancedBeginner,
  lockedCandidatePointing: DreyfusLevel.AdvancedBeginner,
  lockedCandidateClaiming: DreyfusLevel.AdvancedBeginner,

  // Competent: Triples, quads, basic fish
  nakedTriple: DreyfusLevel.Competent,
  nakedQuad: DreyfusLevel.Competent,
  hiddenTriple: DreyfusLevel.Competent,
  hiddenQuad: DreyfusLevel.Competent,
  xWing: DreyfusLevel.Competent,
  skyscraper: DreyfusLevel.Competent,
  twoStringKite: DreyfusLevel.Competent,

  // Proficient: Advanced fish, wings, rectangles
  swordfish: DreyfusLevel.Proficient,
  jellyfish: DreyfusLevel.Proficient,
  yWing: DreyfusLevel.Proficient,
  xyzWing: DreyfusLevel.Proficient,
  wWing: DreyfusLevel.Proficient,
  emptyRectangle: DreyfusLevel.Proficient,
  finnedXWing: DreyfusLevel.Proficient,
  finnedSwordfish: DreyfusLevel.Proficient,
  finnedJellyfish: DreyfusLevel.Proficient,
  uniqueRectangleType1: DreyfusLevel.Proficient,
  uniqueRectangleType2: DreyfusLevel.Proficient,
  uniqueRectangleType3: DreyfusLevel.Proficient,
  uniqueRectangleType4: DreyfusLevel.Proficient,
  uniqueRectangleType5: DreyfusLevel.Proficient,
  bug: DreyfusLevel.Proficient,

  // Expert: Chains, ALS, forcing techniques
  xyChain: DreyfusLevel.Expert,
  aic: DreyfusLevel.Expert,
  aicRing: DreyfusLevel.Expert,
  groupedAIC: DreyfusLevel.Expert,
  alsXZ: DreyfusLevel.Expert,
  sueDeCoq: DreyfusLevel.Expert,
  deathBlossom: DreyfusLevel.Expert,
  nishio: DreyfusLevel.Expert,
  nishioNet: DreyfusLevel.Expert,
  cellRegionForcingChain: DreyfusLevel.Expert,
  cellRegionForcingNet: DreyfusLevel.Expert,
  forcingChain: DreyfusLevel.Expert,
};

export function getTechniqueLevel(technique: Technique): DreyfusLevel {
  return TECHNIQUE_LEVELS[technique];
}

export function canAgentUseTechnique(
  agentLevel: DreyfusLevel,
  technique: Technique,
): boolean {
  const techniqueLevel = getTechniqueLevel(technique);
  return DREYFUS_LEVEL_ORDER[agentLevel] >= DREYFUS_LEVEL_ORDER[techniqueLevel];
}

const DREYFUS_LEVEL_ORDER: Record<DreyfusLevel, number> = {
  [DreyfusLevel.Novice]: 0,
  [DreyfusLevel.AdvancedBeginner]: 1,
  [DreyfusLevel.Competent]: 2,
  [DreyfusLevel.Proficient]: 3,
  [DreyfusLevel.Expert]: 4,
};
```

### Technique Timing Configuration

```typescript
// packages/sudoku/src/helpers/techniqueTiming.ts

import { Technique } from "../types/Technique";
import { DreyfusLevel } from "../types/Agent";

// Base execution times in milliseconds
export const BASE_TIMES: Record<Technique, number> = {
  // Singles: 1-3 seconds
  nakedSingle: 1000,
  hiddenSingleBox: 2000,
  hiddenSingleRow: 2000,
  hiddenSingleCol: 2000,

  // Basic sets: 3-8 seconds
  nakedPair: 3000,
  hiddenPair: 4000,
  lockedCandidatePointing: 3000,
  lockedCandidateClaiming: 3000,

  // Intermediate: 8-15 seconds
  nakedTriple: 8000,
  nakedQuad: 10000,
  hiddenTriple: 9000,
  hiddenQuad: 11000,
  xWing: 10000,
  skyscraper: 8000,
  twoStringKite: 8000,

  // Advanced: 15-30 seconds
  swordfish: 20000,
  jellyfish: 25000,
  yWing: 15000,
  xyzWing: 18000,
  wWing: 20000,
  emptyRectangle: 15000,
  finnedXWing: 22000,
  finnedSwordfish: 28000,
  finnedJellyfish: 32000,
  uniqueRectangleType1: 18000,
  uniqueRectangleType2: 20000,
  uniqueRectangleType3: 22000,
  uniqueRectangleType4: 24000,
  uniqueRectangleType5: 26000,
  bug: 25000,

  // Expert: 30-60 seconds
  xyChain: 35000,
  aic: 40000,
  aicRing: 42000,
  groupedAIC: 50000,
  alsXZ: 45000,
  sueDeCoq: 48000,
  deathBlossom: 55000,
  nishio: 50000,
  nishioNet: 55000,
  cellRegionForcingChain: 52000,
  cellRegionForcingNet: 58000,
  forcingChain: 60000,
};

// Level multipliers: how skill level affects execution time
export const LEVEL_MULTIPLIERS: Record<DreyfusLevel, number> = {
  [DreyfusLevel.Novice]: 2.0, // Novices take twice as long
  [DreyfusLevel.AdvancedBeginner]: 1.5,
  [DreyfusLevel.Competent]: 1.0, // Baseline
  [DreyfusLevel.Proficient]: 0.75,
  [DreyfusLevel.Expert]: 0.5, // Experts are twice as fast
};

// Struggle multiplier when encountering technique above skill level
// Applied on top of the base time × level multiplier
export const STRUGGLE_MULTIPLIER = 10.0; // Takes 10x longer when struggling

// Jitter configuration: ±20% variation
export const JITTER_PERCENTAGE = 0.2;

export function calculateExecutionTime(
  technique: Technique,
  agentLevel: DreyfusLevel,
  isAboveSkillLevel: boolean = false,
): number {
  const baseTime = BASE_TIMES[technique];
  const multiplier = LEVEL_MULTIPLIERS[agentLevel];
  const struggleMultiplier = isAboveSkillLevel ? STRUGGLE_MULTIPLIER : 1.0;
  const jitter = 1 + (Math.random() * 2 - 1) * JITTER_PERCENTAGE; // 0.8 to 1.2
  return Math.max(100, baseTime * multiplier * struggleMultiplier * jitter); // Minimum 100ms
}
```

### Timeline Pre-computation

```typescript
// packages/sudoku/src/helpers/agentTimeline.ts

import { humanSolve, puzzleToGrid } from "../utils/humanSolver";
import { Puzzle } from "../types/puzzle";
import {
  AgentStep,
  AgentTimeline,
  DreyfusLevel,
  LocalAgent,
} from "../types/Agent";
import { ServerState } from "../types/state";
import { canAgentUseTechnique } from "./techniqueCategories";
import { calculateExecutionTime } from "./techniqueTiming";
import { applyHintToPuzzle } from "../utils/applyHint";

export function createAgentTimeline(
  initial: Puzzle<number>,
  final: Puzzle<number>,
  agentLevel: DreyfusLevel,
): AgentTimeline {
  const grid = puzzleToGrid(initial);
  const solution = humanSolve(grid);

  const steps: AgentStep[] = [];
  let currentTime = 0;
  const answerStack: Puzzle[] = [];

  for (const hint of solution.steps) {
    const technique = hint.technique;
    const canUse = canAgentUseTechnique(agentLevel, technique);
    const isAboveSkillLevel = !canUse;

    const stepDuration = calculateExecutionTime(
      technique,
      agentLevel,
      isAboveSkillLevel,
    );

    currentTime += stepDuration;

    // Apply the hint to create the next puzzle state
    const previousPuzzle = answerStack.length > 0
      ? answerStack[answerStack.length - 1]
      : initial;
    const nextPuzzle = applyHintToPuzzle(previousPuzzle, hint);
    answerStack.push(nextPuzzle);

    // Create ServerState matching server-side player structure
    const state: ServerState = {
      initial,
      final,
      answerStack: [...answerStack],
      timer: {
        startedAt: new Date(0).toISOString(), // Will be adjusted to actual start time
        seconds: Math.floor(currentTime / 1000),
      },
    };

    steps.push({
      technique,
      timestamp: currentTime,
      state,
      wasBlocked: isAboveSkillLevel,
    });
  }

  return {
    steps,
    totalDuration: currentTime,
  };
}

export function createLocalAgents(
  initial: Puzzle<number>,
  final: Puzzle<number>,
  agentConfigs: Array<
    { name: string; emoji: string; skillLevel: DreyfusLevel }
  >,
): LocalAgent[] {
  return agentConfigs.map((config, index) => ({
    id: `agent-${index}`,
    name: config.name,
    emoji: config.emoji,
    skillLevel: config.skillLevel,
    timeline: createAgentTimeline(initial, final, config.skillLevel),
  }));
}
```

### Progress Calculation

```typescript
// packages/sudoku/src/helpers/agentProgress.ts

import { LocalAgent } from "../types/Agent";
import { ServerState } from "../types/state";
import { calculateCompletionPercentageFromState } from "./calculateCompletionPercentage";

export function getAgentCurrentState(
  agent: LocalAgent,
  elapsedTimeMs: number,
): ServerState | null {
  const { steps } = agent.timeline;

  if (steps.length === 0) return null;

  // Find the most recent completed step
  const lastCompletedStep = steps.findLast((step) =>
    step.timestamp <= elapsedTimeMs
  );

  if (!lastCompletedStep) {
    // Return initial state with empty answer stack
    return {
      initial: steps[0].state.initial,
      final: steps[0].state.final,
      answerStack: [],
      timer: {
        startedAt: new Date(Date.now() - elapsedTimeMs).toISOString(),
        seconds: Math.floor(elapsedTimeMs / 1000),
      },
    };
  }

  // Return the state with timer adjusted to actual elapsed time
  return {
    ...lastCompletedStep.state,
    timer: {
      startedAt: new Date(Date.now() - elapsedTimeMs).toISOString(),
      seconds: Math.floor(elapsedTimeMs / 1000),
    },
  };
}

export function calculateAgentProgress(
  agent: LocalAgent,
  elapsedTimeMs: number,
): number {
  const state = getAgentCurrentState(agent, elapsedTimeMs);
  if (!state) return 0;
  return calculateCompletionPercentageFromState(state);
}

export function getAllAgentProgress(
  agents: LocalAgent[],
  startTimeMs: number,
): Array<
  {
    agentId: string;
    name: string;
    emoji: string;
    state: ServerState | null;
    percentage: number;
  }
> {
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTimeMs;

  return agents.map((agent) => {
    const state = getAgentCurrentState(agent, elapsedTime);
    return {
      agentId: agent.id,
      name: agent.name,
      emoji: agent.emoji,
      state,
      percentage: state ? calculateCompletionPercentageFromState(state) : 0,
    };
  });
}
```

## Data Models

### Agent Configuration

Default agent configurations for a puzzle session:

```typescript
// packages/sudoku/src/helpers/defaultAgents.ts

import { DreyfusLevel } from "../types/Agent";

export const DEFAULT_AGENT_CONFIGS = [
  { name: "Sage", emoji: "🦉", skillLevel: DreyfusLevel.Expert },
  { name: "Hunter", emoji: "🐺", skillLevel: DreyfusLevel.Proficient },
  { name: "Scout", emoji: "🦊", skillLevel: DreyfusLevel.Competent },
  { name: "Cub", emoji: "🐻", skillLevel: DreyfusLevel.AdvancedBeginner },
  { name: "Hopper", emoji: "🐰", skillLevel: DreyfusLevel.Novice },
];
```

### Integration with Existing Types

The agents use the same state structure as server-side players:

```typescript
// Agents use ServerState from packages/sudoku/src/types/state.ts
// This allows them to:
// 1. Be visualized in the sidebar with their puzzle state
// 2. Use calculateCompletionPercentageFromState() for progress
// 3. Share timer and completion tracking logic with server-side players

// Extend RaceTrack component props to accept agents
interface RaceTrackProps<T> {
  // ... existing props
  localAgents?: LocalAgent[];
  puzzleStartTime?: number;
}

// Extend Friends Sidebar to display agents with their ServerState
interface FriendsSidebarProps {
  // ... existing props
  localAgents?: LocalAgent[];
  puzzleStartTime?: number;
}

// Agent state can be treated as a member session
// This allows reusing existing rendering logic:
type AgentAsSession = {
  userId: string; // agent.id
  state: ServerState; // from getAgentCurrentState()
  emoji: string; // agent.emoji
  isAgent: true; // flag to distinguish from real users
};
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all
valid executions of a system—essentially, a formal statement about what the
system should do. Properties serve as the bridge between human-readable
specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I identified several opportunities to
consolidate redundant properties:

- Properties about agent structure (emoji, team membership, display) can be
  combined into comprehensive agent creation properties
- Timeline structure properties (timestamps, progress percentages) can be
  unified into a single timeline validity property
- Display properties for RaceTrack and Friends Sidebar share similar validation
  logic and can reference common rendering properties
- Configuration existence properties (base times, multipliers) can be combined
  into configuration completeness properties

### Property 1: Agent Creation Completeness

_For any_ puzzle session that is started, the system should create a "Local
Agents" team containing one or more agents, where each agent has a unique ID, an
animal emoji avatar, and exactly one Dreyfus skill level from the valid set
{Novice, Advanced Beginner, Competent, Proficient, Expert}.

**Validates: Requirements 1.1, 2.1, 2.2, 2.3, 3.1**

### Property 2: Agent Skill Level Immutability

_For any_ agent in a puzzle session, the agent's Dreyfus skill level at any
point during the session should equal its skill level at the start of the
session.

**Validates: Requirements 3.2**

### Property 3: Technique Categorization Completeness

_For any_ technique that can be returned by humanSolve, there should exist a
mapping to exactly one Dreyfus level, and this mapping should cover all possible
techniques.

**Validates: Requirements 4.1, 4.3, 4.4**

### Property 4: Timeline Pre-computation Validity

_For any_ agent created for a puzzle, the agent should have a pre-computed
timeline where each step contains a technique, a non-negative timestamp, a valid
ServerState (with initial/final/answerStack matching server-side player
structure), and a blocked flag, with timestamps in strictly increasing order.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 5: Timing Configuration Completeness

_For any_ technique in the system, there should exist a defined base time
(positive number), and for any Dreyfus level, there should exist a defined level
multiplier (positive number).

**Validates: Requirements 6.1, 6.2**

### Property 6: Execution Time Calculation

_For any_ technique and Dreyfus level combination (excluding blocked
techniques), the calculated execution time before jitter should equal the
technique's base time multiplied by the level's multiplier.

**Validates: Requirements 6.3**

### Property 7: Jitter Bounds

_For any_ calculated execution time with jitter applied, the final time should
be within the configured jitter percentage bounds of the base calculation and
should be positive.

**Validates: Requirements 6.4, 6.5, 12.1, 12.2, 12.5**

### Property 8: Jitter Variation

_For any_ technique and level combination, calculating execution time multiple
times (at least 100 iterations) should produce both values greater than and less
than the base calculation, demonstrating bidirectional jitter.

**Validates: Requirements 12.3**

### Property 9: Skill-Based Struggle

_For any_ agent encountering a technique in the solution path, if the
technique's level is above the agent's skill level, the step duration should
equal base time × level multiplier × struggle multiplier × jitter; otherwise,
the step duration should be calculated using base time × level multiplier ×
jitter (without struggle multiplier).

**Validates: Requirements 7.1, 7.2**

### Property 10: Timeline Continuation After Struggle

_For any_ agent timeline containing a struggle step (where wasBlocked is true),
there should exist at least one subsequent step in the timeline with a timestamp
greater than the struggle step's timestamp.

**Validates: Requirements 7.4**

### Property 11: Progress Calculation Correctness

_For any_ agent timeline and elapsed time value, the calculated progress
percentage should equal the result of calculateCompletionPercentageFromState()
applied to the most recent step's ServerState whose timestamp is less than or
equal to the elapsed time, or 0 if no such step exists.

**Validates: Requirements 8.1, 8.2, 8.4**

### Property 12: Agent Display on RaceTrack

_For any_ agent in a puzzle session, the agent should appear in the RaceTrack
component's rendered output with its emoji avatar and a position corresponding
to its current progress percentage.

**Validates: Requirements 2.4, 9.1, 9.2, 9.3**

### Property 13: Agent Display in Friends Sidebar

_For any_ agent in a puzzle session when the Friends Sidebar is open, the agent
should appear in the sidebar's rendered output with its emoji avatar and current
progress percentage formatted identically to human player progress.

**Validates: Requirements 2.5, 10.1, 10.2, 10.3, 10.4**

### Property 14: Level Multiplier Ordering

_For any_ two Dreyfus levels where level A is higher than level B in the skill
progression (Novice < Advanced Beginner < Competent < Proficient < Expert), the
multiplier for level A should be less than the multiplier for level B.

**Validates: Requirements 11.3**

### Property 15: Positive Execution Times

_For any_ technique, Dreyfus level, and jitter application, the final calculated
execution time should be strictly greater than zero.

**Validates: Requirements 11.4**

## Error Handling

### Invalid Puzzle Input

If `humanSolve` cannot solve the puzzle (returns empty steps array), agents
should:

- Have empty timelines with no steps
- Return initial ServerState with empty answerStack when queried
- Display 0% progress throughout the session
- Not cause rendering errors in RaceTrack or Friends Sidebar

### Missing Configuration

If technique categorization or timing configuration is incomplete:

- Throw descriptive error during agent creation (fail fast)
- Include the missing technique name in error message
- Prevent puzzle session from starting with incomplete configuration

### Timeline Calculation Errors

If timeline calculation fails for any agent:

- Log error with agent ID and skill level
- Continue creating other agents
- Exclude failed agent from display
- Do not block puzzle session from starting

### Progress Calculation Edge Cases

- **Elapsed time is negative**: Return initial ServerState with empty
  answerStack, 0% progress
- **Elapsed time exceeds timeline duration**: Return final step's ServerState
  with completion
- **Empty timeline**: Return initial ServerState with empty answerStack, 0%
  progress
- **Timeline with single step**: Return initial state if before step, step's
  ServerState if after

### UI Integration Errors

- **Missing agent data**: RaceTrack and Friends Sidebar should gracefully handle
  undefined/null agent arrays
- **Invalid progress percentage**: Clamp to 0-100 range before rendering
- **Missing emoji**: Fall back to default emoji (🤖)

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive
coverage:

- **Unit tests**: Verify specific examples, edge cases, and integration points
- **Property tests**: Verify universal properties across randomized inputs

### Unit Testing Focus

Unit tests should cover:

1. **Specific technique categorizations**: Verify key techniques are assigned to
   expected levels (e.g., nakedSingle → Novice, aic → Expert)

2. **Timeline creation examples**: Test timeline creation for simple puzzles
   with known solution paths

3. **Progress calculation examples**: Test progress at specific time points
   (e.g., 0ms, mid-timeline, after completion)

4. **Edge cases**:
   - Empty solution path (unsolvable puzzle)
   - Single-step solution
   - Agent with all techniques blocked
   - Progress calculation with negative elapsed time
   - Progress calculation beyond timeline duration

5. **Integration points**:
   - RaceTrack component receives and displays agent data
   - Friends Sidebar component receives and displays agent data
   - Agent creation during puzzle initialization
   - Progress updates during polling cycle

6. **Error conditions**:
   - Missing technique in categorization map
   - Missing technique in timing configuration
   - Invalid Dreyfus level
   - Null/undefined agent data in UI components

### Property-Based Testing Configuration

Use **fast-check** (JavaScript/TypeScript property-based testing library) for
property tests.

Each property test must:

- Run minimum 100 iterations
- Reference its design document property in a comment
- Use format: `// Feature: local-ai-agents, Property {number}: {property_text}`

### Property Test Specifications

#### Property 1: Agent Creation Completeness

```typescript
// Feature: local-ai-agents, Property 1: Agent creation completeness
// Generate: random puzzle, random agent configs
// Verify: Local Agents team exists, contains agents, each agent has ID/emoji/valid skill level
```

#### Property 2: Agent Skill Level Immutability

```typescript
// Feature: local-ai-agents, Property 2: Agent skill level immutability
// Generate: random agent, random timeline progression
// Verify: Skill level unchanged at any point in session
```

#### Property 3: Technique Categorization Completeness

```typescript
// Feature: local-ai-agents, Property 3: Technique categorization completeness
// Generate: all techniques from humanSolve
// Verify: Each technique has exactly one valid Dreyfus level mapping
```

#### Property 4: Timeline Pre-computation Validity

```typescript
// Feature: local-ai-agents, Property 4: Timeline pre-computation validity
// Generate: random puzzle, random agent skill level
// Verify: Timeline has valid structure (timestamps increasing, ServerState with initial/final/answerStack, all fields present)
```

#### Property 5: Timing Configuration Completeness

```typescript
// Feature: local-ai-agents, Property 5: Timing configuration completeness
// Generate: all techniques, all Dreyfus levels
// Verify: Base time exists for each technique, multiplier exists for each level, all positive
```

#### Property 6: Execution Time Calculation

```typescript
// Feature: local-ai-agents, Property 6: Execution time calculation
// Generate: random technique, random Dreyfus level (where agent can use technique)
// Verify: Calculated time (before jitter) equals base time × multiplier
```

#### Property 7: Jitter Bounds

```typescript
// Feature: local-ai-agents, Property 7: Jitter bounds
// Generate: random technique, random Dreyfus level
// Verify: Jittered time within bounds, positive
```

#### Property 8: Jitter Variation

```typescript
// Feature: local-ai-agents, Property 8: Jitter variation
// Generate: random technique, random Dreyfus level
// Verify: 100 calculations produce both increases and decreases
```

#### Property 9: Skill-Based Struggle

```typescript
// Feature: local-ai-agents, Property 9: Skill-based struggle
// Generate: random agent skill level, random technique
// Verify: If technique above level, duration includes struggle multiplier; else no struggle multiplier
```

#### Property 10: Timeline Continuation After Struggle

```typescript
// Feature: local-ai-agents, Property 10: Timeline continuation after struggle
// Generate: random puzzle with techniques above agent level
// Verify: After any struggle step, at least one subsequent step exists
```

#### Property 11: Progress Calculation Correctness

```typescript
// Feature: local-ai-agents, Property 11: Progress calculation correctness
// Generate: random timeline, random elapsed time
// Verify: Progress equals calculateCompletionPercentageFromState() of most recent completed step's ServerState
```

#### Property 12: Agent Display on RaceTrack

```typescript
// Feature: local-ai-agents, Property 12: Agent display on RaceTrack
// Generate: random agents with random progress
// Verify: Each agent appears with emoji and position matching progress
```

#### Property 13: Agent Display in Friends Sidebar

```typescript
// Feature: local-ai-agents, Property 13: Agent display in Friends Sidebar
// Generate: random agents with random progress
// Verify: Each agent appears with emoji and formatted progress
```

#### Property 14: Level Multiplier Ordering

```typescript
// Feature: local-ai-agents, Property 14: Level multiplier ordering
// Generate: all pairs of Dreyfus levels
// Verify: Higher skill level has lower multiplier
```

#### Property 15: Positive Execution Times

```typescript
// Feature: local-ai-agents, Property 15: Positive execution times
// Generate: random technique, random Dreyfus level, random jitter
// Verify: Final execution time > 0
```

### Test Organization

```
packages/sudoku/src/
├── helpers/
│   ├── agentTimeline.test.ts (unit + property tests)
│   ├── agentProgress.test.ts (unit + property tests)
│   ├── techniqueCategories.test.ts (unit + property tests)
│   └── techniqueTiming.test.ts (unit + property tests)
└── types/
    └── Agent.test.ts (type validation tests)

packages/games/src/
└── components/
    ├── RaceTrack.test.tsx (unit tests for agent display)
    └── FriendsSidebar.test.tsx (unit tests for agent display)
```

### Mocking Strategy

- **humanSolve**: Mock with predefined solution paths for unit tests; use real
  implementation for property tests
- **Date.now()**: Mock for deterministic progress calculation tests
- **Math.random()**: Seed for reproducible jitter tests in unit tests; use real
  randomness for property tests

### Performance Testing

While not part of correctness properties, performance should be validated:

- Timeline pre-computation should complete in < 100ms for typical puzzles
- Progress calculation should complete in < 1ms per agent
- UI rendering with 3 agents should not degrade frame rate
