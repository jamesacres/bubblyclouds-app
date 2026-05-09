# Requirements Document

## Introduction

This feature adds local AI agents (intelligent bots) to the Sudoku multiplayer
racing experience. These agents appear as team members in the "Local Agents"
team, solve puzzles using human-like techniques at different skill levels based
on the Dreyfus model, and display their progress on the racetrack alongside
human players. The agents use pre-computed solving timings rather than real-time
execution, allowing their progress to be calculated efficiently during existing
polling intervals.

## Glossary

- **Local_Agent**: An AI bot that solves Sudoku puzzles locally using human-like
  techniques and appears as a team member
- **Local_Agents_Team**: A special team in the team list that contains all
  Local_Agents
- **Dreyfus_Level**: A skill level from the Dreyfus model of skill acquisition
  (Novice, Advanced Beginner, Competent, Proficient, Expert)
- **Technique**: A Sudoku solving method (e.g., nakedSingle, hiddenPair, xWing,
  aic) as defined in the humanSolver
- **Technique_Level**: The minimum Dreyfus_Level required to apply a specific
  Technique
- **Base_Time**: The inherent time required to execute a Technique, independent
  of skill level
- **Level_Multiplier**: A factor applied to Base_Time based on the agent's
  Dreyfus_Level
- **Struggle_Multiplier**: A factor (e.g., 10.0x) applied to execution time when
  an agent encounters a Technique above their Dreyfus_Level
- **Progress_Percentage**: The completion percentage of a puzzle (0-100%)
  calculated from solved cells
- **Pre_Computed_Timeline**: A data structure containing all solving steps with
  their calculated timestamps
- **Racetrack**: The UI component displaying player progress during multiplayer
  racing
- **Friends_Sidebar**: The UI panel showing current progress of all players and
  agents
- **humanSolve**: The existing function that returns a complete solution path
  with technique steps
- **Animal_Emoji**: An emoji representing an animal (e.g., 🦉, 🐺, 🦊) used as
  an agent's avatar

## Requirements

### Requirement 1: Local Agents Team Display

**User Story:** As a player, I want to see a "Local Agents" team in the team
list, so that I can distinguish AI agents from human players

#### Acceptance Criteria

1. WHEN a puzzle is started, THE System SHALL create a team named "Local Agents"
   in the team list
2. THE Local_Agents_Team SHALL appear in the same team list as human player
   teams
3. THE Local_Agents_Team SHALL be visually distinguishable from human teams
4. THE Local_Agents_Team SHALL persist for the duration of the puzzle session

### Requirement 2: Agent Creation and Display

**User Story:** As a player, I want to see AI agents as team members with animal
avatars, so that they feel like participants in the race

#### Acceptance Criteria

1. WHEN a puzzle is started, THE System SHALL create one or more Local_Agents
2. THE System SHALL assign each Local_Agent an Animal_Emoji as their avatar
3. THE System SHALL display each Local_Agent as a member of the
   Local_Agents_Team
4. THE System SHALL display each Local_Agent on the Racetrack alongside human
   players
5. WHEN the Friends_Sidebar opens, THE System SHALL display each Local_Agent
   with their current Progress_Percentage

### Requirement 3: Agent Skill Level Assignment

**User Story:** As a system, I want each agent to have a Dreyfus skill level, so
that agents exhibit varied solving abilities

#### Acceptance Criteria

1. THE System SHALL assign each Local_Agent exactly one Dreyfus_Level from:
   Novice, Advanced Beginner, Competent, Proficient, or Expert
2. THE Dreyfus_Level SHALL remain constant for a Local_Agent throughout a puzzle
   session
3. THE System SHALL support multiple Local_Agents with different Dreyfus_Levels
   in the same session

### Requirement 4: Technique Level Categorization

**User Story:** As a system, I want each Sudoku technique categorized by
difficulty level, so that agents can be limited by their skill level

#### Acceptance Criteria

1. THE System SHALL assign each Technique a Technique_Level corresponding to one
   of the five Dreyfus_Levels
2. THE Technique_Level assignments SHALL be based on the logical complexity and
   learning progression of Sudoku solving
3. THE System SHALL maintain a mapping from each Technique to its
   Technique_Level
4. THE mapping SHALL include all Techniques returned by humanSolve

### Requirement 5: Pre-Computed Solving Timeline

**User Story:** As a system, I want to calculate agent solving timings upfront,
so that progress can be determined efficiently without setTimeout

#### Acceptance Criteria

1. WHEN a puzzle is started, THE System SHALL invoke humanSolve to obtain the
   complete solution path
2. FOR EACH Local_Agent, THE System SHALL calculate a Pre_Computed_Timeline
   containing all solving steps with timestamps
3. THE Pre_Computed_Timeline SHALL include the timestamp when each step is
   completed
4. THE Pre_Computed_Timeline SHALL include the Progress_Percentage after each
   step
5. THE System SHALL calculate all timings before the puzzle solving begins

### Requirement 6: Technique Timing Calculation

**User Story:** As a system, I want technique execution times to vary by agent
skill level, so that agents solve at realistic speeds

#### Acceptance Criteria

1. THE System SHALL define a Base_Time for each Technique
2. THE System SHALL define a Level_Multiplier for each Dreyfus_Level
3. WHEN calculating step timing, THE System SHALL compute execution time as
   Base_Time × Level_Multiplier
4. THE System SHALL apply random jitter to the calculated execution time to
   reduce rigidity
5. THE jitter SHALL be bounded to maintain realistic timing ranges

### Requirement 7: Skill-Based Struggle

**User Story:** As a system, I want agents to struggle with techniques above
their skill level, so that skill differences are meaningful

#### Acceptance Criteria

1. WHEN a Local_Agent encounters a Technique with Technique_Level above their
   Dreyfus_Level, THE System SHALL apply Struggle_Multiplier to the execution
   time calculation
2. WHEN a Local_Agent encounters a Technique with Technique_Level at or below
   their Dreyfus_Level, THE System SHALL calculate timing using Base_Time and
   Level_Multiplier without Struggle_Multiplier
3. THE Struggle_Multiplier SHALL be a configurable value greater than 1.0
4. THE System SHALL continue timeline calculation after struggle periods

### Requirement 8: Progress Calculation During Polling

**User Story:** As a system, I want to calculate agent progress during existing
polls, so that no additional timers are needed

#### Acceptance Criteria

1. WHEN the existing polling mechanism executes, THE System SHALL calculate
   current Progress_Percentage for each Local_Agent
2. THE System SHALL determine Progress_Percentage by comparing current time
   against the Pre_Computed_Timeline
3. THE System SHALL update Local_Agent progress at the same time as server-side
   player updates
4. THE System SHALL use the Pre_Computed_Timeline to find the most recent
   completed step based on current time

### Requirement 9: Racetrack Display Integration

**User Story:** As a player, I want to see AI agents on the racetrack, so that I
can compare my progress against them visually

#### Acceptance Criteria

1. THE System SHALL display each Local_Agent on the Racetrack
2. THE System SHALL position each Local_Agent based on their current
   Progress_Percentage
3. THE System SHALL display each Local_Agent's Animal_Emoji avatar on the
   Racetrack
4. THE Racetrack SHALL update Local_Agent positions during the same render cycle
   as human player positions

### Requirement 10: Friends Sidebar Integration

**User Story:** As a player, I want to see agent progress in the friends
sidebar, so that I can track their completion status

#### Acceptance Criteria

1. WHEN the Friends_Sidebar opens, THE System SHALL display all Local_Agents
2. THE System SHALL display each Local_Agent's Animal_Emoji avatar in the
   Friends_Sidebar
3. THE System SHALL display each Local_Agent's current Progress_Percentage in
   the Friends_Sidebar
4. THE Friends_Sidebar SHALL format Local_Agent progress identically to human
   player progress

### Requirement 11: Level Multiplier Scaling

**User Story:** As a system, I want expert agents to be faster on easy
techniques but still take time on expert techniques, so that skill progression
feels realistic

#### Acceptance Criteria

1. THE Level_Multiplier for Expert SHALL be less than 1.0 for techniques at
   lower Technique_Levels
2. THE Level_Multiplier for Novice SHALL be greater than 1.0 for techniques at
   their Technique_Level
3. THE Level_Multiplier SHALL scale progressively from Novice to Expert
4. FOR ALL Techniques, THE execution time SHALL remain positive and non-zero

### Requirement 12: Random Jitter Application

**User Story:** As a system, I want timing variations to feel natural, so that
agents don't appear robotic

#### Acceptance Criteria

1. THE System SHALL apply random jitter to each calculated step timing
2. THE jitter SHALL be applied as a percentage variation of the calculated time
3. THE jitter SHALL produce both positive and negative variations
4. THE jitter range SHALL be configurable
5. THE jitter SHALL not produce negative execution times
