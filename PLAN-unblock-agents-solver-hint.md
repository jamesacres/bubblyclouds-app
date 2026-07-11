# Plan: Unblock Race — AI agents, WASM solver, and "Ask for help" hint

> Status: awaiting approval. Once approved, implementation runs task-by-task via subagents with fresh context, each reading this file as its spec.

## Context

The Sudoku app has AI bot rivals (precomputed solver-driven timelines racing on the track) and an "Ask for help" hint button powered by `human-sudoku-solver`. Unblock Race ("Gridlock") has neither, and no solver exists in the monorepo. The C++ bitboard solver in `/Users/jamesacres/Documents/git/rush/cpp/src` (Michael Fogleman's rush, MIT) will be compiled to WebAssembly with emscripten — the same approach James used for tdoku (https://github.com/t-dillon/tdoku/pull/9) — and loaded the same way the sudoku app loads its tfjs wasm backend from `public/`. The solver powers both agent timelines and a hint button revealing the next best move from the current state.

**Decisions made**:
- **C++ → WASM via emscripten**, no separate npm package, no yalc. Artifacts: `solver.wasm` in `apps/unblockrace/public/solver/`; emscripten glue JS committed in `packages/unblockrace` (packages can't import from apps; the app serves the binary, the package loads it by URL — same split as tfjs: bundled glue + wasm fetched from public).
- Emscripten build added to `/Users/jamesacres/Documents/git/rush` (James's clone; upstream PR possible later, like the tdoku PR).
- Agents race **per stage**; hint is **free & unlimited**; credit fogleman/rush (MIT) in root `CREDITS.md` + the unblockrace credits page.
- Optional (only because it's trivial in TS): low-skill agents get non-optimal lines via reversible detour moves — see B5.

Est. performance: hardest 50-move seed puzzles ~20–200ms on low-end mobile via WASM (native C++ is sub-ms–10ms; wasm ~1.2–2× native, low-end mobile ~5–10× desktop). Hints from mid-game states are cheaper. No perf gating needed.

Key compatibility fact: rush board strings are format-identical to unblockrace's (`o`/`.` empty, `x` wall, `A`–`Z` pieces, `A` primary horizontal, square string). All current app content is 6×6.

---

## Part A — WASM solver

### A1. C++ changes in `/Users/jamesacres/Documents/git/rush/cpp` (behaviour-preserving for the existing enumeration use)

The cpp solver is enumeration-oriented; four gaps must close before it can serve the app:

1. **Board size**: `config.h` has compile-time `const int BoardSize = 5`. Guard it: `#ifndef RUSH_BOARD_SIZE ... 5 ... #else RUSH_BOARD_SIZE`, and compile the wasm build with `-DRUSH_BOARD_SIZE=6`. Bitboard is `uint64_t` so anything ≤ 8×8 works. Raise `MaxPieceSize` for the wasm build similarly (`-DRUSH_MAX_PIECE_SIZE=6`; small_vector→std::vector makes bounds soft anyway).
2. **Runtime target**: `Target`, `PrimaryRow` are consts; `Board::Solved()` and the solver's lower-bound prune use them. Add `Board::Target()` computed from `m_Pieces[0]` row (mirrors Go's `board.Target()`); use it in `Solved()` and `Solver::Search`. Enumeration always uses primary row 2, so behaviour is unchanged there; the app's parser allows any row.
3. **Walls**: `Board(std::string)` can't parse `x` cells (they'd form one invalid multi-cell "piece"). Add `bb m_WallMask` populated from `x` cells, OR'd into `Mask()`. Walls never enter `m_Pieces`, so move piece indices keep matching the app's pieces array (A=0, B=1, …). (Current seed puzzles have no walls, but the app format supports them.)
4. **Unsolvable termination — required**: `Solver::Solve` currently deepens forever if no solution exists, and hint calls will hit self-blocked states. Port solver.go's stagnation cutoff: track memo size per deepening iteration; if unchanged for `BoardSize - primarySize` consecutive iterations, return unsolvable. (This replaces the Go static analyzer — the stagnation check alone is sufficient for correctness; the analyzer is only a fast pre-filter and doesn't need porting.)
5. **De-boost**: `boost::unordered_map<BoardKey,int>` → `std::unordered_map` with a hash combining the two `uint64` masks; `boost::container::small_vector` → `std::vector`. Removes the only external dependency for the wasm build.

### A2. WASM interface + build (pattern from the tdoku PR)

New `cpp/src/wasm.cpp`:

```cpp
extern "C" const char* solve(const char* boardString);
```

- Parses (returning errors instead of throwing), solves, writes into a static `std::string`, returns `c_str()`.
- Return protocol (line-oriented, trivial to parse in TS):
  - `ok A+1 C-2 B+3` — solvable, space-separated moves in the app's existing `moveLabel` format (piece letter + signed steps)
  - `ok` — already solved
  - `unsolvable`
  - `invalid: <reason>` — bad string/length/shape (wrapper treats ≠36-length as invalid before calling)

New `cpp/compile-wasm.sh` (analog of tdoku's `compile-wasm.sh`):

```bash
emcc -O3 -flto -std=c++17 -DRUSH_BOARD_SIZE=6 -DRUSH_MAX_PIECE_SIZE=6 \
  src/wasm.cpp src/board.cpp src/piece.cpp src/move.cpp src/solver.cpp src/bb.cpp \
  -sEXPORTED_FUNCTIONS=_solve -sEXPORTED_RUNTIME_METHODS=ccall \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web -sALLOW_MEMORY_GROWTH=1 \
  -o <monorepo>/packages/unblockrace/src/services/solverWasm.js
```

(main.cpp/cluster/enumerator are excluded — solver path only.) The emitted `solverWasm.wasm` is moved to `apps/unblockrace/public/solver/solver.wasm`; `solverWasm.js` (glue, ES6 module with default-export factory) is committed to `packages/unblockrace/src/services/` and excluded from eslint/prettier (generated file).

Also add a tiny native test harness target (or reuse `main.cpp` locally) to sanity-run fixture puzzles natively before wasm. Toolchain prerequisite: emsdk (`brew install emscripten` or emsdk activate) — verify `emcc -v` first.

### A3. TS loader — `packages/unblockrace/src/services/solver.ts` (new)

Mirrors the tfjs pattern (`apps/sudoku/src/augmentedReality/imageRecognition/tensorflow.ts`: glue bundled, wasm fetched from `window.location.origin` path, lazy + memoized):

```ts
export interface SolverSolution { solvable: boolean; moves: Move[] }   // Move from '../types/board'
export const loadSolver: () => Promise<{ solve(boardString: string): SolverSolution }>;
```

- `loadSolver` memoizes: dynamic `import('./solverWasm.js')`, factory called with `{ locateFile: () => `${window.location.origin}/solver/solver.wasm` }`; `solve` uses `ccall('solve', 'string', ['string'], [boardString])` (sync once loaded) and parses the return protocol (`A+1` → `{ piece: 0, steps: 1 }`).
- Throws/returns `invalid` results as a typed error state, and validates `boardString.length === 36` up front (non-6×6 boards: solver features silently unavailable rather than broken).
- Static export + Capacitor need nothing extra: `output: 'export'` copies `public/solver/` into `out/`, `webDir: 'out'` bundles it, origin-relative URL resolves under the Capacitor local server (proven by tfjs).
- Jest: unit tests `jest.mock('../services/solver')` — no wasm in jsdom. Glue file also added to jest `testPathIgnorePatterns`-adjacent config only if needed (it's never imported statically except by solver.ts).

### A4. Credits

- Root `CREDITS.md`: add Rush — Michael Fogleman, https://github.com/fogleman/rush, MIT.
- `apps/unblockrace/src/components/Credits.tsx` (the credits page renders this): add as the first, game-logic entry: `{ name: 'Rush', description: 'Rush Hour puzzle solver and puzzle database by Michael Fogleman, compiled to WebAssembly', url: 'https://github.com/fogleman/rush', license: 'MIT' }`.

### A5. Solver verification

- Native first: build a quick native binary of wasm.cpp's solve path; run ~20 fixture puzzles sampled from `packages/unblockrace/src/mockData/puzzles.json` across move bands (incl. a 50-mover): assert solvable, `moves.length === movesRequired`, and replay legality via the app's `boardMoves`/`doMove` in a scratch script; walled/self-blocked boards → `unsolvable` terminates fast; already-solved → `ok`.
- Browser: temporary dev-page or console check that `loadSolver()` resolves and solves the daily's stage 1 in the running app; time a 50-mover on a throttled device profile.

---

## Part B — AI agents in `packages/unblockrace`

Mirror the sudoku implementation. Templates to copy/adapt: `packages/sudoku/src/types/Agent.ts`, `packages/sudoku/src/helpers/{defaultAgents,agentTimeline,techniqueTiming,agentProgress}.ts`, component wiring in `packages/sudoku/src/components/Sudoku.tsx` (~lines 111–256, 456–483), metadata persistence in `packages/sudoku/src/hooks/gameState.ts` (~line 666). Duplication across sibling layers is the established pattern — never import from `@bubblyclouds-app/sudoku`.

Shared UI needs zero changes: `packages/template/src/components/Lobby.tsx` (bot section renders only when `onAgentMode` is passed — UnblockRace currently passes no agent props at its `<Lobby>` ~line 555, so wiring is purely additive), `lobby/AgentSelectSheet.tsx`, `AgentPartyRow.tsx`. The 14 avatar webps already exist in `apps/unblockrace/public/opponents/`.

New/edited files in `packages/unblockrace/src/`:

1. **`types/Agent.ts`** (new): `DreyfusLevel` enum, `AgentStep { move: Move; timestamp: number; state: ServerState }`, `AgentTimeline { steps; totalDuration }`, `TimingCurve`, `TimingState`, `AgentConfig` (same fields as sudoku's), `LocalAgent`.
2. **`types/state.ts`** (edit): `export type UnblockMode = 'solo' | 'ai' | 'friends';` and `GameStateMetadata += mode?: UnblockMode; agentNames?: string;`.
3. **`helpers/defaultAgents.ts`** (new): copy sudoku's `DEFAULT_AGENT_CONFIGS` — same 14 personas/names/emojis/skill levels/timing curves; rewrite voiceLines to racing/blocks flavor; halve baseDelay/hesitation values (rescaling dominates anyway).
4. **`helpers/moveTiming.ts`** (new — analog of techniqueTiming.ts):
   - `DIFFICULTY_SOLVE_BOUNDS_MS: Record<string, [number, number, number]>` `[fastest, median, slowest]`: simple `[15s, 40s, 150s]`, easy `[30s, 80s, 300s]`, intermediate `[60s, 150s, 480s]`, expert `[100s, 240s, 720s]` (no real-user data yet; tune later).
   - `difficultyToSolveBounds`, `skillLevelTargetDuration` (copy sudoku's band logic: Novice/AdvBeginner draw from `[median, slowest]`, Competent+ from `[fastest, median]`).
   - `calculateMoveExecutionTime(branchingFactor, moveIndex, totalMoves, timingCurve, timingState)`: complexity `0.75 + branchingFactor/8` clamped `[0.75, 2.5]`; opening "planning" multiplier ×2–3 tapering over the first 25% of moves; endgame speedup past `timingCurve.endgameStart`; sudoku's bursts/hesitations/jitter block verbatim. No struggle multiplier — skill differentiation comes from target-duration rescaling plus detours (below).
5. **`helpers/agentTimeline.ts`** (new): `createLocalAgents(initial, final, configs, difficulty): Promise<LocalAgent[]>` — **async**: awaits `loadSolver()`, solves `initial` **once**, shares the optimal move list across agents; empty timelines + `console.error` on unsolvable/invalid. `createAgentTimeline` walks the moves using existing `parseBoardString`/`doMove`/`boardToString`; `branchingFactor = boardMoves(board).length` before each move (pure TS, no solver); snapshots `state = { initial, final, answerStack: [...], metadata: { movesRequired: String(optimalCount), movesMade: String(i+1) } }` so existing `calculateCompletionPercentageFromState` yields moves-based percentages (final step reads 100 via `isSolved`); rescales timestamps to `skillLevelTargetDuration`.
   **Detours (agent variety, per user)**: for Novice/AdvancedBeginner agents, insert 1–3 reversible detour pairs into their copy of the move list — pick a random legal move of a piece other than the optimal next piece, then its inverse immediately after; both states remain legal and solvable, no solver involvement, agents finish a few moves over par (reads realistically on the leaderboard). Skip entirely if the puzzle is under ~8 moves. Deterministic per agent per stage via a seeded pick from existing random usage patterns.
6. **`helpers/agentProgress.ts`** (new): near-verbatim sudoku copy — `getAgentCurrentState(agent, elapsedMs)` (findLast step ≤ elapsed), `getAllAgentProgress(agents, startTimeMs): AgentProgress<ServerState>[]`; `finishTime = Math.round(totalDuration/1000)` at 100%.
7. **`hooks/useGameState.ts`** (edit): add `mode`/`agentNames` state + setters (optional initial params), spread into saved `metadata` (with dep-array update), return them. Mirror sudoku's gameState.ts.
8. **`components/UnblockRace.tsx`** (edit — main wiring):
   - State: `selectedAgentConfigs`, `agents: LocalAgent[]`, `localAgentProgress`, `agentStartTimeMsRef`, `agentStageResults: Map<agentName, Map<stageIndex, StageResult>>`.
   - `handleAgentMode(names)` (async — awaits `createLocalAgents`) / `onRemoveAgent(agentId)` mirroring Sudoku.tsx; set `mode('ai')` + `agentNames` csv.
   - Per-stage rebuild effect on stage change: rebuild timelines from the new stage's `initial`/`final`/difficulty; reset `agentStartTimeMsRef` (solver runs in ~ms via wasm; the ~400ms stage slide masks it comfortably; guard against stale async results with a cancelled flag).
   - Clock: set `agentStartTimeMsRef.current = Date.now()` when `timer && !timer.countdown && ref === null`; sudoku's two-effect progress structure (effect on `[agents, timer]` + 1s interval until all agents at 100%).
   - Record agent stage results on `advanceStage`/`goToStage`/final `onComplete` from each agent's precomputed `totalDuration` + step count (agents "finish offscreen" deterministically; leaderboard only compares completed stages).
   - Lobby props: `localAgentProgress`, `onRemoveAgent`, `agentOptions={DEFAULT_AGENT_CONFIGS}`, `defaultSelectedAgentNames`, `onAgentMode={handleAgentMode}`.
9. **`helpers/runResults.ts`** (edit): optional `agentResults?: AgentRunInput[]` (`{ agentId: 'agent-'+name, name, stageResults: Map<number, StageResult> }`) folded like `ownResults`; `PlayerRunResult += nickname?: string; isAgent?: boolean`; same sort comparator; agents with no completed stage omitted.
10. **`components/UnblockRaceTrack.tsx`** (edit): new `localAgentProgress?: AgentProgress<ServerState>[]` prop; agents appended to the lane as emoji karts (skip `getPlayerColor` — agents aren't in `allUserIds`); finished agents flow into the finished list/leaderboard via `finishTime`; run-leaderboard rows resolve `nickname ?? (isCurrentUser ? 'You' : party nickname)`.

---

## Part C — "Ask for help" hint

1. **`helpers/hint.ts`** (new):
   ```ts
   type HintResult = { kind: 'move'; move: Move } | { kind: 'solved' } | { kind: 'unsolvable' } | { kind: 'unavailable' };
   getHint(boardString: string): Promise<HintResult>
   ```
   Awaits `loadSolver()` (memoized; instant after first call), takes `solution.moves[0]`; module-level FIFO cache (~200 entries) so undo/redo re-hints are free; `unavailable` for invalid/non-6×6 boards or loader failure (button hidden/no-op rather than broken).
2. **`components/Controls.tsx`** (edit): optional `onHint?: () => void; isHintDisabled?: boolean`; `Lightbulb` (lucide) button using existing `controlButtonClass`, placed left of Undo in the right-hand toolbar cluster, rendered only when `onHint` provided, `aria-label="Hint"`.
3. **`components/Board.tsx`** (edit): optional `hint?: Move | null`; overlay-only (no Piece.tsx changes): pulsing theme-color ring over the hinted piece + dashed ghost outline at the destination (`position + stride * steps`, %-based rects like the cell sockets), `pointer-events-none`, respects `prefers-reduced-motion`.
4. **`components/UnblockRace.tsx`** (edit): `hint`/`hintNotice` state; async `handleHint` awaits `getHint(answer)` (guard stale result if `answer` changed); unsolvable → amber notice "No way through from here — undo or reset to get back on track" under Controls; effect clears hint+notice on any `answer` change (move/undo/redo/stage change); `isHintDisabled = !!completed || !!transition || showLobby`; pass `hint` only to the interactive Board (not the transition-frozen copy). Optionally warm `loadSolver()` on mount so the first hint is instant.

Free/unlimited — no dailyActionCounter, no subscription gate (hinted moves still count toward par, self-penalising).

---

## Part D — Tests & verification

Monorepo (jest — mock `services/solver` everywhere): new `helpers/{hint,agentTimeline,agentProgress,moveTiming}.test.ts` (agentTimeline: steps length = optimal + detours, timestamps increasing, final state solved, detour pairs cancel out, unsolvable → empty); extend `helpers/runResults.test.ts` (agent rows + sorting), `hooks/useGameState.test.ts` (mode/agentNames persisted to metadata), `components/UnblockRace.test.tsx` (mocked solver; hint shows/clears; agent selection → track chips; stage advance → agent leaderboard rows), plus Controls/Board test additions for the new props.

Final verification: from monorepo root `pnpm run lint:fix`, `pnpm run build`, `pnpm run test` (known sandbox EPERM — rerun sandbox-disabled if needed). Manual dev-server check (`pnpm dev` for unblockrace): hint highlight/dismiss/unsolvable notice; bot picking in Lobby; agent karts advancing per stage after countdown; agent rows in the run leaderboard after stage 1. Confirm `out/solver/solver.wasm` present after static export (Capacitor path).

---

## Task breakdown for subagent implementation

Each task is self-contained with fresh context; each subagent reads this file plus the named template/source files.

| # | Task | Scope | Depends on |
|---|------|-------|-----------|
| 1 | C++ generalize + wasm build | A1 changes in rush repo, wasm.cpp, compile-wasm.sh, native fixture check, emit glue+wasm into monorepo (A2, A5-native). Needs emsdk. | — |
| 2 | TS loader + credits | services/solver.ts, glue lint/jest exclusions, CREDITS.md + Credits.tsx (A3, A4) | 1 |
| 3 | Hint feature | Part C files + tests | 2 |
| 4 | Agent types + helpers | Part B items 1–6 + tests | 2 |
| 5 | Agent wiring | Part B items 7–10 + tests | 4 |
| 6 | Final verification | lint:fix/build/test from root, dev-server + static-export manual checks (A5-browser, Part D), fix fallout | 3, 5 |

## Risks

- **emsdk toolchain** must be installed/activated locally before Task 1 (`emcc -v`); rush repo changes should stay upstream-PR-friendly (guarded defines, additive walls/target changes).
- **Unsolvable termination in C++** is new code (stagnation cutoff ported from solver.go) — test walled and self-blocked boards natively before shipping the wasm.
- **Generated glue in package src**: eslint/prettier/jest must ignore it; re-generate + re-commit on every C++ change (document in compile-wasm.sh header).
- **6×6 compile-time board size**: non-6×6 boards degrade gracefully (`unavailable` hints, no agents) — acceptable since all content is 6×6; recompile with a different define if that changes.
- **Branch state**: `feature/unblock-race-init` has uncommitted run-leaderboard work in the same files this plan edits (`UnblockRace.tsx`, `useGameState.ts`, `UnblockRaceTrack.tsx`, `runResults.ts`). Build on top of it; consider committing it first.
