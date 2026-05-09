# Implementation Plan: Local AI Agents

## Overview

This implementation adds local AI agents that compete alongside human players in
Sudoku multiplayer racing. The approach uses pre-computed timelines based on the
Dreyfus skill model, with agents solving puzzles using the existing humanSolve
algorithm. Progress is calculated during existing polling intervals by comparing
elapsed time against pre-computed timelines.

## Tasks

-
  1. [x] Set up agent type definitions and core data structures
  - Create `packages/sudoku/src/types/Agent.ts` with DreyfusLevel enum,
    LocalAgent, AgentStep, and AgentTimeline interfaces
  - Ensure types reference existing ServerState and Technique types
  - _Requirements: 1.1, 2.1, 2.2, 3.1_

-
  2. [x] Implement technique categorization system
  - [x] 2.1 Create `packages/sudoku/src/helpers/techniqueCategories.ts`
    - Define TECHNIQUE_LEVELS mapping all 47 techniques to Dreyfus levels
    - Implement getTechniqueLevel() function
    - Implement canAgentUseTechnique() function with level ordering
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ]* 2.2 Write property test for technique categorization completeness
    - **Property 3: Technique categorization completeness**
    - **Validates: Requirements 4.1, 4.3, 4.4**

-
  3. [x] Implement timing configuration system
  - [x] 3.1 Create `packages/sudoku/src/helpers/techniqueTiming.ts`
    - Define BASE_TIMES for all 47 techniques (1s to 60s range)
    - Define LEVEL_MULTIPLIERS for all 5 Dreyfus levels (2.0 to 0.5)
    - Define STRUGGLE_MULTIPLIER constant (10.0)
    - Define JITTER_PERCENTAGE constant (0.2)
    - Implement calculateExecutionTime() with base time, multiplier, struggle,
      and jitter logic
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 12.1, 12.2, 12.3, 12.5_

  - [ ]* 3.2 Write property tests for timing configuration
    - **Property 5: Timing configuration completeness**
    - **Property 6: Execution time calculation**
    - **Property 7: Jitter bounds**
    - **Property 8: Jitter variation**
    - **Property 15: Positive execution times**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 11.4, 12.1, 12.2, 12.3,
      12.5**

  - [ ]* 3.3 Write unit tests for timing edge cases
    - Test minimum execution time enforcement (100ms floor)
    - Test jitter produces both positive and negative variations
    - Test struggle multiplier application
    - _Requirements: 6.4, 6.5, 7.1, 7.2_

-
  4. [ ] Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

-
  5. [x] Implement timeline pre-computation
  - [x] 5.1 Create `packages/sudoku/src/helpers/agentTimeline.ts`
    - Implement createAgentTimeline() function
    - Use humanSolve() to get complete solution path
    - Calculate step timestamps with technique timing
    - Build ServerState for each step using applyHintToPuzzle
    - Track wasBlocked flag for techniques above skill level
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.4_

  - [x] 5.2 Implement agent creation function
    - Implement createLocalAgents() function
    - Accept initial puzzle, final puzzle, and agent configs
    - Generate timeline for each agent
    - Return array of LocalAgent objects
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2_

  - [ ]* 5.3 Write property tests for timeline validity
    - **Property 4: Timeline pre-computation validity**
    - **Property 9: Skill-based struggle**
    - **Property 10: Timeline continuation after struggle**
    - **Validates: Requirements 5.2, 5.3, 5.4, 7.1, 7.2, 7.4**

  - [ ]* 5.4 Write unit tests for timeline creation
    - Test timeline with simple puzzle (known solution path)
    - Test empty solution path (unsolvable puzzle)
    - Test single-step solution
    - Test agent with all techniques blocked
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

-
  6. [x] Implement progress calculation
  - [x] 6.1 Create `packages/sudoku/src/helpers/agentProgress.ts`
    - Implement getAgentCurrentState() function
    - Find most recent completed step based on elapsed time
    - Return ServerState with adjusted timer
    - Handle edge cases (negative time, beyond completion, empty timeline)
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 6.2 Implement progress calculation functions
    - Implement calculateAgentProgress() using
      calculateCompletionPercentageFromState
    - Implement getAllAgentProgress() for batch calculation
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]* 6.3 Write property test for progress calculation correctness
    - **Property 11: Progress calculation correctness**
    - **Validates: Requirements 8.1, 8.2, 8.4**

  - [ ]* 6.4 Write unit tests for progress calculation edge cases
    - Test progress at 0ms (should be 0%)
    - Test progress mid-timeline
    - Test progress after completion
    - Test negative elapsed time
    - Test empty timeline
    - Test single-step timeline
    - _Requirements: 8.1, 8.2, 8.4_

-
  7. [ ] Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

-
  8. [x] Create default agent configurations
  - [x] 8.1 Create `packages/sudoku/src/helpers/defaultAgents.ts`
    - Define DEFAULT_AGENT_CONFIGS array with 5 agents
    - Include Sage (🦉, Expert), Hunter (🐺, Proficient), Scout (🦊, Competent),
      Cub (🐻, Advanced Beginner), Hopper (🐰, Novice)
    - _Requirements: 2.2, 3.1_

  - [ ]* 8.2 Write property test for agent creation completeness
    - **Property 1: Agent creation completeness**
    - **Property 2: Agent skill level immutability**
    - **Validates: Requirements 1.1, 2.1, 2.2, 2.3, 3.1, 3.2**

-
  9. [x] Extend RaceTrack component for agent display
  - [x] 9.1 Update RaceTrack component props and rendering
    - Add localAgents and puzzleStartTime to RaceTrackProps
    - Calculate agent progress during render using getAllAgentProgress
    - Render agent avatars (emoji) at positions based on progress percentage
    - Ensure agents render in same visual style as human players
    - _Requirements: 2.4, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 9.2 Write unit tests for RaceTrack agent display
    - Test agents appear with correct emoji
    - Test agent positions match progress percentages
    - Test graceful handling of undefined/null agent arrays
    - Test missing emoji fallback (🤖)
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 9.3 Write property test for agent display on RaceTrack
    - **Property 12: Agent display on RaceTrack**
    - **Validates: Requirements 2.4, 9.1, 9.2, 9.3**

-
  10. [x] Extend Friends Sidebar for agent display
  - [x] 10.1 Update Friends Sidebar component props and rendering
    - Add localAgents and puzzleStartTime to FriendsSidebarProps
    - Calculate agent progress during render using getAllAgentProgress
    - Display agents with emoji avatars and formatted progress percentages
    - Format agent progress identically to human player progress
    - _Requirements: 2.5, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 10.2 Write unit tests for Friends Sidebar agent display
    - Test agents appear with correct emoji and progress
    - Test progress formatting matches human players
    - Test graceful handling of undefined/null agent arrays
    - Test invalid progress percentage clamping (0-100)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 10.3 Write property test for agent display in Friends Sidebar
    - **Property 13: Agent display in Friends Sidebar**
    - **Validates: Requirements 2.5, 10.1, 10.2, 10.3, 10.4**

-
  11. [x] Integrate agents into puzzle page
  - [x] 11.1 Update puzzle page to create and manage agents
    - Import createLocalAgents and DEFAULT_AGENT_CONFIGS
    - Create agents when puzzle starts using initial and final puzzles
    - Store puzzle start time for progress calculation
    - Pass agents and start time to RaceTrack and Friends Sidebar components
    - _Requirements: 1.1, 2.1, 8.3_

  - [ ]* 11.2 Write integration tests for puzzle page
    - Test agents created on puzzle start
    - Test agents passed to RaceTrack component
    - Test agents passed to Friends Sidebar component
    - Test Local Agents team appears in team list
    - _Requirements: 1.1, 1.2, 2.1, 2.3_

-
  12. [x] Add error handling and edge cases
  - [x] 12.1 Implement error handling in timeline creation
    - Handle humanSolve returning empty steps (unsolvable puzzle)
    - Handle missing technique in categorization map
    - Handle missing technique in timing configuration
    - Log errors with descriptive messages
    - _Requirements: 5.1, 5.2_

  - [x] 12.2 Implement error handling in UI components
    - Handle undefined/null agent arrays gracefully
    - Clamp progress percentages to 0-100 range
    - Provide fallback emoji (🤖) for missing emojis
    - _Requirements: 9.1, 10.1_

  - [ ]* 12.3 Write unit tests for error conditions
    - Test empty solution path handling
    - Test missing technique configuration
    - Test invalid Dreyfus level
    - Test UI components with null agent data
    - _Requirements: 5.1, 5.2, 9.1, 10.1_

-
  13. [ ] Final checkpoint - Ensure all tests pass
  - Run pnpm run build to verify compilation
  - Run pnpm run test to verify all tests pass
  - Run pnpm run lint:fix to fix linting issues
  - Ensure all tests pass, ask the user if questions arise.

-
  14. [ ] Verify level multiplier configuration
  - [ ]* 14.1 Write property test for level multiplier ordering
    - **Property 14: Level multiplier ordering**
    - **Validates: Requirements 11.1, 11.2, 11.3**

  - [ ]* 14.2 Write unit tests for multiplier scaling
    - Test Expert multiplier < 1.0
    - Test Novice multiplier > 1.0
    - Test progressive scaling from Novice to Expert
    - _Requirements: 11.1, 11.2, 11.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from design document
- Unit tests validate specific examples and edge cases
- All code uses TypeScript as specified in the design document
- Implementation follows monorepo architecture with proper package layering
  (types → sudoku → games → app)
