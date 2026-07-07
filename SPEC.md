# Unblock Race — Implementation Spec

Sliding-block puzzle racing game (Rush Hour / Unblock Me style), built as
`packages/unblockrace` and consumed by `apps/unblockrace` (already scaffolded
as a skeleton — see `TODO.md`). This spec breaks down what's needed to turn
that skeleton into a playable game.

No new libraries. Same stack as every other package: React, Tailwind,
Next.js, existing `@bubblyclouds-app/*` packages. No code in this document —
implementation tasks only.

## 1. Background and references

- Notes: `Other puzzle racing` (private doc) — product direction distilled
  below.
- Reference implementation (algorithms/format only, not code to copy):
  [michaelfogleman.com/rush](https://www.michaelfogleman.com/rush/), repo
  cloned locally at `/Users/jamesacres/Documents/git/rush` (Go + JS, MIT
  licensed). Read `model.go`, `solver.go`, `web/app.js` directly — they are
  the ground truth for the encoding, solver, and interaction model described
  below.
- Example board string + move count (encoding reused, delivery mechanism is
  not — see §4): `IBBxooIooLDDJAALooJoKEEMFFKooMGGHHHM`, 60 moves.

### Product direction (from the notes)

- **Continuous chain of 5**: not one puzzle at a time. A run is 5 puzzles
  back-to-back. Solving one immediately loads the next — no menu in between.
  Scrolling right shows what's coming up. We want to track stats for each
  puzzle even if they don't complete the whole chain that is fine.
- **Daily limit**: 3 puzzles/day free, then gated behind Plus.
- **Shareable via puzzle IDs**: a shared link contains comma-separated puzzle
  IDs, fetched from the server (or, for now, the mock/seed data — see §8).
- **Race view shows *stage*, not intra-stage progress**: opponents/AI show
  "on puzzle 3 of 5", not "62% through puzzle 3". This is a deliberate
  simplification vs. Sudoku Race's move-by-move progress bar.
- **Visual differentiation from ThinkFun's Rush Hour**: primary piece is
  **theme colour**. Exit iconography, grid styling, and UI chrome should be
  our own (Tailwind, existing `@ui`/`@games` components) — do not reproduce
  the physical Rush Hour board look. This matters for trademark/lookalike
  risk (Rush Hour is a ThinkFun trademark; "Rush Hour style" as a genre
  descriptor in copy is fine, cloning the exact visual presentation is not).
- **Theming (later, not in this spec's scope)**: vehicle skins, board
  themes. Out of scope for v1 — noted here so the piece-rendering component
  doesn't hardcode "it's always a car" in a way that blocks it later.

## 2. Game model — board encoding (reused verbatim from Fogleman)

This is not just "inspired by" — the spec adopts the exact same encoding so
that (a) Fogleman's public database can be used unmodified as seed data, and
(b) URL sharing is a drop-in match for anyone familiar with the format.

- **Board string**: `width*height` characters, row-major, one char per cell.
  - `o` = empty
  - `x` = wall (fixed 1x1 obstacle)
  - `A` = primary piece (always horizontal, always the piece that must exit
    off the right edge of its row)
  - `B`–`Z` = other pieces
- **Standard board is 6x6** (36 chars), matching the reference database.
  Support arbitrary square boards in the parser (the algorithm is
  size-agnostic) but only ship 6x6 puzzles in v1.
- **Piece orientation and size are derived, not stored**: scan the string for
  each distinct label's cell indices. If consecutive indices differ by `1`,
  the piece is horizontal; if they differ by `width`, it's vertical. Size is
  the count of cells with that label. This is exactly `model.go`'s
  `NewBoard()` / `app.js`'s `Board()` constructor — implement the TypeScript
  equivalent the same way, including its validation rules (piece size >= 2,
  consistent stride, primary piece horizontal, no other horizontal piece may
  share the primary piece's row).
- **Exit target**: always `(primaryRow + 1) * width - primarySize`, i.e. the
  primary piece exits off the right edge of the grid on its row. There is no
  separate "exit position" field — it's computed.
- **Win condition**: primary piece's column + its size === board width (it's
  flush with/past the right edge). It goes into the start position of the next puzzle

## 3. Game model — moves and solving

- **Move**: `{ piece: index, steps: signed int }`. Positive steps = move
  right (horizontal piece) or down (vertical piece); negative = left/up.
  `label()` for a move is `String.fromCharCode(65 + pieceIndex)` (i.e. `A`,
  `B`, `C`...), matching the reference format's move notation
  (`F+1 K+1 M-1 C+3`) if move-list debug/hint output is ever surfaced.
- **Legal moves for a piece**: walk backward from the piece's start cell
  until hitting an occupied cell or the grid edge (that's the max negative
  steps), and forward from its end cell the same way (max positive steps).
  Every intermediate integer step is a legal move. This is a direct port of
  `Board.Moves()` / `Board.prototype.moves()`.
- **Do/undo move**: clear occupied cells at the piece's old span, update its
  position by `steps * stride`, mark the new span occupied. Undo is
  `DoMove({piece, steps: -steps})`.
- **Solver**: iterative-deepening DFS with memoization (not BFS — verify
  against `solver.go` if implementing a client-side solver at all; see the
  scope decision in §3.1 below). The memo key is the full piece-position
  tuple; a lower-bound prune counts occupied cells between the primary piece
  and its target and skips branches where that's `>=` remaining depth
  budget.

### 3.1 Scope decision: do we need a client-side solver?

**No, not for v1.** All puzzles ship pre-solved from the seed data (every row
in Fogleman's database already has its optimal move count attached). The
solver algorithm is documented above only so that:

- The number-of-moves badge shown for daily/collection puzzles matches the
  seed data's known-optimal count (no need to compute it — read it from the
  data row).
- Anyone implementing "hint" or "hardest puzzle at N moves" features later
  has the algorithm already researched instead of re-deriving it.

If a "generate infinite unique puzzles" feature is wanted later (post-v1),
this is where the enumerator/generator/solver Go code would inform a
TypeScript port — explicitly out of scope here per the "as simple as
possible" instruction.

## 4. URL format

No hash fragments. Fogleman's `#<boardString>/<movesRequired>` hash format
is not used here — this app puts everything in query params on the existing
`/puzzle` route, consistent with the rest of the monorepo (sudoku's
`/puzzle?initial=...&final=...`), and because it needs to express more than
one puzzle per URL for the chain mechanic.

**The board string itself is the puzzle identifier.** There is no separate
`unblockId`/sha256 wrapper around it — the board string is already unique
per puzzle and directly parseable back into a `Board` (§2), so it doubles as
both the puzzle's content and its ID. Drop `unblockId` from
`GameStateMetadata` entirely (see §6) in favor of just storing/keying on the
board string.

- **Single puzzle** (daily challenge, "share this one"):
  `/puzzle?board=<boardString>&moves=<movesRequired>` under
  `apps/unblockrace/src/app/puzzle/page.tsx` (already stubbed).
- **Chained run** (the 5-puzzle race, the primary mode per the notes):
  `/puzzle?board=<b1>,<b2>,<b3>,<b4>,<b5>&moves=<m1>,<m2>,<m3>,<m4>,<m5>` —
  comma-separated lists in both params, positionally paired (`board[i]` goes
  with `moves[i]`). Parse both on `,`, zip them into a `boards: string[]`
  array plus a `currentStageIndex` starting at 0. A run is fully
  reconstructed from the URL — no server round-trip needed to resolve an
  opaque ID (simpler for v1's mocked backend, §8). If a single `board`/
  `moves` pair is present (no commas), treat it as a 1-puzzle run.
- **Stage transition**: when the current stage's `isSolved()` fires, the
  primary piece finishes its slide off the right edge of the grid (§9's win
  animation), then the board swaps to the next `board[i]`/`moves[i]` pair
  and `currentStageIndex` increments — visually, the piece's exit motion
  continues into the next board sliding in from the left, matching "the car
  and app scrolls across into the next puzzle position." The URL doesn't
  need to change on stage transition (the full run is already encoded up
  front); `currentStageIndex` is tracked in component/session state instead,
  so a mid-run refresh can restore progress from the session rather than
  the URL (see §6).

## 5. Package structure — `packages/unblockrace`

Mirror `packages/sudoku`'s conventions exactly (same JIT export pattern, same
`package.json` shape, same directory layout). New package, depends on
`@auth`, `@games`, `@template`, `@types`, `@ui` (same dependency set already
declared in `apps/unblockrace/package.json` for the L5 sudoku-equivalent
layer — see `ARCHITECTURE.md`'s decision tree, this is the "Sudoku-specific?"
branch but for Unblock Race).

```
packages/unblockrace/
├── package.json          # name: @bubblyclouds-app/unblockrace, JIT exports
├── src/
│   ├── index.ts
│   ├── types/
│   │   ├── board.ts       # Board, Piece, Orientation, Move types
│   │   └── state.ts       # GameState, ServerState, GameStateMetadata
│   │                       #   (mirrors packages/sudoku/src/types/state.ts,
│   │                       #    extends @template's BaseState/BaseServerState)
│   ├── helpers/
│   │   ├── parseBoardString.ts     # string -> Board (pieces derived, per §2)
│   │   ├── boardToString.ts        # Board -> string (inverse)
│   │   ├── boardMoves.ts           # legal moves for a piece / whole board
│   │   ├── doMove.ts / undoMove.ts
│   │   ├── isSolved.ts             # primary piece flush with right edge
│   │   ├── calculateCompletionPercentage.ts
│   │   │   # Distance-based: primary piece's column position relative to
│   │   │   # the exit (see §6's stage-level race view). Used both for the
│   │   │   # generic MyPuzzlesTab/FriendsTab progress display AND the live
│   │   │   # per-stage race view's ProgressTrack. Chain-level "stage N/5"
│   │   │   # summary is a separate, coarser calculation (§6) — don't
│   │   │   # conflate the two.
│   │   ├── buildPuzzleUrl.ts       # mirrors sudoku's helper; builds the
│   │   │                           #   query-param URL (§4), single-puzzle
│   │   │                           #   or comma-separated chained run
│   │   ├── puzzleTextToPuzzle.ts   # thin wrapper if any text transform is
│   │   │                           #   needed beyond the raw board string
│   │   │                           #   (likely a no-op passthrough — the
│   │   │                           #   board string IS the puzzle text)
│   │   └── cheatDetection.ts       # mirrors sudoku's: flag if answerStack
│   │                               #   jumps straight from initial to solved
│   │                               #   with zero intermediate states
│   ├── hooks/
│   │   ├── useDrag.ts       # piece drag/snap interaction (see §9)
│   │   └── useGameState.ts  # per-puzzle state machine (see §6)
│   ├── providers/
│   │   └── CollectionProvider.tsx  # mirrors sudoku's BookProvider.tsx,
│   │                               #   renamed/reframed as "collection" per
│   │                               #   TODO.md (no "book" language)
│   └── components/
│       ├── Board.tsx         # renders grid, walls, pieces; owns drag layer
│       ├── Piece.tsx         # single draggable piece (car)
│       ├── SimpleBoard.tsx   # non-interactive small render, mirrors
│       │                     #   SimpleSudoku.tsx (used in MyPuzzlesTab rows,
│       │                     #   FriendsTab, session lists)
│       ├── Controls.tsx      # undo/reset/moves-counter bar, mirrors
│       │                     #   SudokuControls.tsx
│       └── CollectionCover.tsx  # mirrors BookCover.tsx
└── (test files alongside each, same *.test.ts(x) convention as sudoku)
```

## 6. Game state, sessions, and the 5-puzzle chain

Reuse the exact same generic infra Sudoku Race already has — this is the
main reason the notes call this "almost a perfect map onto what you've
built for Sudoku Race."

- **`GameState`/`ServerState`**: extend `@template`'s `BaseState`/
  `BaseServerState<State, StackItem, Metadata>` the same way sudoku's
  `state.ts` does, but `State` is `Board` (or its serializable form — the
  board string plus current piece positions) instead of a `Puzzle` grid.
  `answerStack` becomes a stack of board snapshots (one per move), enabling
  undo/redo and cheat detection the same way sudoku does.
- **`GameStateMetadata`**: `{ difficulty?, unblockCollectionPuzzleId?,
  stageIndex? }` — no `unblockId` field; the board string itself is the
  identifier (§4), so it's stored directly as `initial`/`final` on the
  state, not duplicated into metadata. `stageIndex` is new, specific to the
  chain mechanic (which of the puzzles in the current run this state is).
  `apps/unblockrace/src/app/puzzle/page.tsx` currently has a
  `GameStateMetadata` stub that includes `unblockId` — remove it as part of
  wiring up the real type; keep `unblockCollectionPuzzleId`.
- **`useGameState`**: port `packages/sudoku/src/hooks/gameState.ts` structure
  directly — same local+server storage dual-write, same polling-for-friends
  logic, same timer integration (`@template/hooks/timer`), same
  inactivity-pause behavior, same `useSessions<ServerState>()` /
  `useParties()` integration. The board-specific parts (`pushAnswer`,
  `isSolved` check, `reset`, `reveal`) swap sudoku's grid logic for the
  board-move logic from §3. Undo/redo already maps 1:1 onto move
  do/undo. Keyboard shortcuts: drop sudoku's number-entry bindings, keep
  undo (`z`)/redo (`y`)/reset if desired — arrow keys aren't meaningful here
  since interaction is drag-based, not cell-selection-based (see §9).
- **Chain mechanic (the 5-in-a-row)**: this is new — nothing like it exists
  in sudoku. Model it as:
  - A **run** = `{ runId, puzzleIds: string[5], currentStageIndex: number }`.
  - Each of the 5 puzzles is its own `GameState`/session, keyed by its own
    `puzzleId` exactly like sudoku puzzles are today, but tagged with the
    same `runId` in `metadata`. Because each stage is its own independent
    session, per-puzzle stats (moves made, time, completed/not) are saved
    the moment that stage completes — a racer who abandons the run after
    stage 2 of 5 still has stages 1–2's stats persisted normally; there's no
    "all or nothing" save tied to finishing the whole chain.
  - On `isSolved()` for stage N, auto-advance `currentStageIndex` and route
    to stage N+1's board *without unmounting the racing chrome* — i.e. the
    puzzle board component swaps its `initial`/`final`/`boardString` props
    but `RaceTrack`/`Lobby`/party state stays mounted. This is what makes it
    feel like "sliding into the next challenge" instead of a page nav.
  - Daily limit (3/day free per the notes): reuse
    `@template/utils/dailyActionCounter` (`canUseUndo`/`canUseCheckGrid`
    already exist there as the pattern for "N free actions per day, then
    paywall") — add a `canStartRun`/`incrementRunCount` pair the same shape.
  - **Two levels of progress, don't conflate them**:
    - **Chain-level** (which of the 5 puzzles a racer is on): shown wherever
      the run as a whole is summarized (e.g. a "stage 3/5" chip in the
      header/lobby list). `RaceTrack`'s
      `calculateCompletionPercentage(initial, final, latest)` prop, when used
      to summarize a whole run in a party/friends list, returns
      `(completedStagesInRun / 5) * 100`.
    - **Stage-level** (live head-to-head on the *current* puzzle): this is
      where the notes' distance-based visual + move-counter hybrid applies —
      it is the primary in-race view while both racers are on the same
      stage, not a replacement for the chain-level indicator above.
      Per-racer, per-stage:
      ```
      <RaceView>
        <PlayerTrack>
          <MoveCounter>12/15 moves ⚡</MoveCounter>
          <ProgressTrack>
            <PrimaryPiece position={getCarDistance(state)} />
            <FinishLine />
          </ProgressTrack>
        </PlayerTrack>
        <OpponentTrack>
          <MoveCounter>8/15 moves ⚡</MoveCounter>
          <ProgressTrack>
            <PrimaryPiece position={getOpponentDistance(state)} />
            <FinishLine />
          </ProgressTrack>
        </OpponentTrack>
      </RaceView>
      ```
      - `getCarDistance(state)`: primary piece's column position relative to
        the exit — `(maxColumn - primaryPiece.col) / maxColumn`, i.e. how far
        along the board the primary piece physically is, not how many moves
        were spent getting there. Intuitive and always accurate to the
        actual board state (mirrors the notes' "Option 2: Distance-Based
        Progress").
      - Move counter: `movesMade / movesRequired` shown alongside, not
        blended into the same bar — the notes are explicit that showing both
        separately (not one derived metric) is what creates the "they're
        ahead in moves, but I'm closer to exit" tension. `movesRequired`
        comes from the seed data's known-optimal count (§3.1), so this is
        available with zero extra computation.
      - Over-par handling: if `movesMade > movesRequired`, add a warning
        affordance (⚠️) next to the counter rather than clamping/hiding it —
        moving past optimal is valid, just not perfect. Optional "par"
        framing for the post-stage summary (under optimal = bonus, at
        optimal = ✓, over = still counts) — nice-to-have polish, not a
        blocker for v1.
      - This is per-stage: when a racer advances to stage N+1, both tracks
        reset their distance/move-counter to the new stage's state. The
        chain-level indicator (stage 3/5) persists across the reset; the
        stage-level distance/move view does not.
- **`CollectionProvider`** (was "BookProvider" in sudoku): same
  cache-per-month localStorage pattern, same `fetchCollectionData`/
  `clearCollectionData` shape, renamed types (`UnblockCollectionOfTheMonth`
  instead of `SudokuBookOfTheMonth`) per the TODO.md direction to drop "book"
  language entirely for this game.

## 7. End-game stats

Per the notes, completing a stage (or a whole run) shows a summary card,
e.g.:

```
🚗 Unblock Race - Daily #127
🏁 Escaped in 0:47
🎯 Beat opponent by 3 seconds
⚡ 12 moves (optimal: 11)
```

Everything needed for this is already produced by §6's state model — this
section just says where each line comes from and when to show it, no new
data collection required:

- **Puzzle number/label** (`Daily #127`): only meaningful for the daily
  challenge, not the collection or an ad-hoc shared run. Derive from the
  existing daily-puzzle counter convention
  (`packages/sudoku/src/utils/dailyPuzzleCounter.ts` — mirror its
  day-since-epoch/launch-date counting, don't invent a new numbering
  scheme). For collection/shared-run completions, omit this line or replace
  it with the collection puzzle's index (`unblockCollectionPuzzleId`)
  instead.
- **Time** (`Escaped in 0:47`): `calculateSeconds(timer)` — already computed
  by `useGameState`'s `completed.seconds` field (direct port from sudoku's
  `gameState.ts`, §6), formatted with `@ui/helpers/formatSeconds` (already
  used by `RaceTrack`, no new formatting helper needed).
- **Opponent comparison** (`Beat opponent by 3 seconds`): only shown when
  `sessionParties` (§6) has another completed session for the same
  puzzle/stage. Compare `completed.seconds` between the current user's
  session and the fastest completed friend session for that
  puzzle/`runId`+`stageIndex`. If the user finished slower, phrase it as
  "X seconds behind" rather than hiding the comparison — losing information
  is worse than a losing result. If no friend has completed this
  puzzle/stage yet, omit the line entirely rather than showing a
  placeholder.
- **Moves vs. optimal** (`12 moves (optimal: 11)`): `answerStack.length - 1`
  (moves made) vs. `movesRequired` from the seed data (§3.1) — same two
  numbers already surfaced live during the race by §6's move-counter, just
  restated on the summary card. Reuse the same over-par warning affordance
  (⚠️) from §6 if `movesMade > movesRequired`; reuse the optional par framing
  (🌟 under, ✓ at, plain number over) if that nice-to-have gets built.
- **Card lifecycle**: shown once per stage completion (not just at the end
  of the whole 5-puzzle run) — consistent with §6's "stats persist per
  stage even if the run isn't finished" requirement. At the end of stage 5,
  show a run-level summary in addition (total time across all 5 stages,
  total moves, how many stages beaten the fastest friend on) rather than
  instead of the per-stage card.
- **Component**: a new `RaceSummaryCard` (or similar) in
  `packages/unblockrace/src/components/`, taking the same shape of props
  `useGameState`/`RaceTrack` already expose — no new data-fetching, this is
  a pure presentational component driven by state that already exists by
  the time a stage completes.

## 8. Mock server data (seed data from Fogleman's database)

The notes say "you can mock the server for now... we can use some from the
database from michaelfogleman." Concretely:

- **Source**: [rush.txt.gz](https://www.michaelfogleman.com/static/rush/rush.txt.gz)
  (33MB) or the [1000-row preview](https://www.michaelfogleman.com/static/rush/rush1000.txt)
  (44KB) — download separately, not vendored via a package dependency.
  Format: `<numMoves> <boardString> <clusterSize>` per line, whitespace
  separated.
- **Import step**: write a one-off script (not part of the app bundle) that
  reads the preview file (or a curated slice of the full file — a few
  hundred rows spanning a spread of move counts is plenty for mock data) and
  emits a static JSON fixture: `packages/unblockrace/src/mockData/puzzles.json`
  — array of `{ id: sha256(boardString), boardString, movesRequired,
  clusterSize }`. This fixture ships in the package (small, static, not
  fetched at runtime) purely as placeholder content until a real backend
  exists.
- **Mock "puzzle of the day"**: deterministic pick from the fixture keyed by
  the UTC date (same seeding idea as sudoku's daily puzzle — check
  `packages/sudoku/src/utils/dailyPuzzleCounter.ts` for the existing
  date-seeding convention and mirror it, not reinvent it).
- **Mock "monthly collection"**: deterministic pick of N puzzles (sudoku
  uses puzzles-per-month sized to a calendar month; match that count) from
  the fixture, keyed by year+month, mirroring
  `packages/sudoku/src/providers/BookProvider.tsx`'s month-key caching.
- **Mock "run of 5"**: when a user starts a race, pick 5 consecutive-ish
  difficulty puzzles from the fixture (e.g. ascending move-count bands, per
  the ideation notes' difficulty-tier idea:
  easy/medium/hard bands by move count) and mint a `runId`. Server-side
  resolution of `runId -> puzzleIds` is mocked as an in-memory/localStorage
  map for now — there is no real API for this yet (see TODO.md's "Server
  project" section, which already lists "api add support for unblock
  collections" as unbuilt).
- **What's explicitly NOT mocked**: sessions, parties, invites, auth,
  RevenueCat — all of that infra is real and already wired up in
  `apps/unblockrace/src/app/providers.tsx`. Only the puzzle-content source
  (which specific boards exist, what the daily/collection picks are) is
  mocked.

## 9. Board rendering and interaction

**Decision: plain HTML/CSS (absolutely-positioned divs), not canvas.** Port
the interaction model from `web/app.js`'s `View`/`Piece` prototypes, but
render with React + Tailwind instead of p5.js canvas drawing.

Why DOM over canvas for this specific game, given the "smoothest,
interactive, mobile-web" requirement:

- **Board size is tiny** (6x6 = up to ~18 pieces on screen). Canvas's
  performance advantage matters at hundreds/thousands of rendered
  nodes — it's irrelevant at this scale. A 6x6 div grid is not something any
  mobile browser struggles to paint.
- **Drag smoothness comes from the CSS properties used, not from canvas.**
  Animating `transform: translate3d(...)` (not `top`/`left`) during drag is
  GPU-composited in every mobile browser exactly the same way a canvas
  redraw would be, with none of canvas's downsides below. Pair with
  `will-change: transform` on the actively-dragged piece only (added on
  pointerdown, removed on pointerup — leaving it on permanently costs
  memory for no benefit).
- **Canvas would cost, not gain, given the other requirements already in
  this spec**: the neon glow styling (below, this section) is
  `box-shadow`/`filter: drop-shadow`, which is trivial in CSS and
  expensive/fiddly to hand-roll in canvas (shadow blur redraws per frame).
  Light/dark mode (below, this section) is
  free with Tailwind `dark:` variants; in canvas it means manually
  re-drawing every color on theme change. Touch/pointer hit-testing is
  native DOM event targeting; in canvas it means manually mapping
  coordinates to pieces by hand (which is exactly what `web/app.js`'s
  `Board.prototype.pieceAt` has to do — that whole method disappears for
  free with DOM elements).
- **No new dependency either way** — this isn't an argument for canvas
  (no library needed for either approach), it's an argument that DOM has no
  offsetting downside here while removing real complexity.

- **Grid**: absolutely-positioned divs inside a square, aspect-ratio-locked
  container (`aspect-ratio: 1` or padding-top trick, sized to `min(vw, vh)`
  so it fits either dimension without scrolling) — matches
  `computeScale`'s aspect-preserving approach, just via CSS instead of a
  canvas transform. Each cell/piece is positioned with `%`-based
  `top`/`left`/`width`/`height` (static layout) and moved during drag via
  `transform: translate3d(...)` (interactive layout) — never animate
  `top`/`left` directly, that's what causes jank on mobile.
- **Piece drag** (`useDrag.ts`, new hook, same file-naming convention as
  sudoku's `useDrag.ts` which handles a different interaction — don't
  conflate the two, this is board-piece dragging, not sudoku's zoom/pan
  drag):
  - On pointer down on a piece: compute that piece's legal move range (min/
    max steps) from `boardMoves()` (§3), matching
    `View.prototype.mousePressed`'s `dragMin`/`dragMax` calculation.
  - On drag: constrain movement to the piece's single axis (horizontal
    pieces only move horizontally, vertical only vertically) and clamp to
    `[dragMin, dragMax]` cells, matching `piece.pickAxis`.
  - On release: round the drag delta to the nearest whole cell step, clamp
    again, and if a legal move exists at that exact step count, commit it
    via the same `pushAnswer`-equivalent flow `useGameState` (§6) exposes;
    otherwise snap back to the original position.
  - Support both mouse and touch via the Pointer Events API
    (`pointerdown`/`pointermove`/`pointerup`, with `setPointerCapture` on
    `pointerdown` so the drag keeps tracking even if the pointer leaves the
    piece element) — one set of handlers for both input types, no separate
    touch handlers needed the way the p5.js version required.
  - Set `touch-action: none` on the piece being dragged (only while
    dragging) so mobile browsers don't try to scroll/zoom the page in
    response to what should be a piece drag — this is the single most
    common cause of janky/unresponsive drag on mobile web and must be
    handled explicitly, it's not automatic.
  - During drag, update position via `transform: translate3d(...)` each
    `pointermove` (not React state re-render per pixel of movement — write
    the transform directly to the DOM node, e.g. via a ref, and only commit
    to React state on `pointerup`). This avoids a full component re-render
    on every mouse-move event, which is what actually determines whether
    dragging feels smooth on a mid-range mobile device.
- **Win animation**: when `isSolved()` becomes true, the primary piece
  continues its slide fully off the right edge of the grid (matches the
  "car exits the grid" language in the notes) — implemented as a CSS
  transition on `transform` (not a new state re-render loop) — before
  transitioning to the next stage (§6).
- **Walls**: rendered as static 1x1 blocks (no interaction), matching the
  `x` character / `fixed` piece flag from the reference implementation.
- **Visual style: neon, built from the theme color** — not ThinkFun's flat
  cardboard-and-plastic look. This is the main visual differentiator (in
  addition to piece coloring below) from the physical board, and matches
  the existing app's "glowing" aesthetic already used on
  `apps/unblockrace/src/app/page.tsx` (`liquid-glass`/`liquid-glass-strong`
  classes, neon blob backgrounds, `text-shadow` glow on headings — reuse
  those existing utility classes/patterns rather than inventing new ones).
  Concretely, each piece gets: a saturated fill, a `box-shadow`/`filter:
  drop-shadow` glow in the same hue as its fill (soft outer glow, not just a
  border), and a subtle brighter inner highlight edge.
- **Must work equally well in light and dark mode** — the neon
  effect cannot assume the permanently-dark hero-section treatment
  `page.tsx`'s marketing sections use; the puzzle board itself is played in
  whichever theme the user has selected (the app already supports both via
  `next-themes`/`dark:` variants, e.g. `page.tsx`'s
  `bg-stone-50 dark:bg-zinc-900` sections and the
  `text-theme-primary dark:text-theme-primary-light` token pair). Concretely:
  - Board background: a light neutral (e.g. `bg-stone-100`/`bg-white`) in
    light mode, dark (e.g. `bg-zinc-900`, matching the rest of the app's
    dark-mode surfaces) in dark mode — not hardcoded to always-dark. Glows
    still read clearly on a light background (a saturated color with a soft
    `box-shadow` blur is visible on both), just tune glow opacity/blur
    per-mode with `dark:` variants rather than assuming the dark-only look
    of the marketing hero.
  - Grid lines: low-opacity dark line color on the light background,
    low-opacity light line color (`dark:`) on the dark background — same
    "don't compete with the piece glow" principle as before, mirrored per
    theme.
  - Piece palette hues (below) should be chosen/tuned so every color stays
    legible and glows convincingly against *both* a light and a dark board
    background — verify each palette entry in both modes rather than
    picking colors that only work on dark (a common neon-design trap).
- **Primary piece color**: the app's theme color (`theme-primary` Tailwind
  token already used elsewhere in the app, per
  `apps/unblockrace/src/app/page.tsx`'s existing `text-theme-primary` usage)
  — not red, to stay visually distinct from ThinkFun's physical board.
- **Other pieces — one distinct hue per piece, not a single secondary
  color**: each non-primary piece (`B`, `C`, `D`...) gets its own color from
  a fixed palette, cycling if there are more pieces than palette entries.
  Pick a small palette of neon-friendly hues that read well against the dark
  board and stay distinguishable from the primary's theme color and from
  each other (e.g. cycle through a fixed set of hues spaced around the color
  wheel — magenta, cyan, amber, lime, violet — rather than shades of one
  color). Assignment is deterministic by piece index (`B` is always palette
  color 0 for a given board, etc.) so a piece's color doesn't shift on
  re-render or when the board state is restored from storage. Walls (§ below)
  are not pieces and don't get a palette color — they stay a neutral
  dark/wall tone, since they're static obstacles, not vehicles.
- No vehicle artwork/skins in v1 — colored, glowing blocks with rounded
  corners, matching the "as simple as possible" instruction. Exit
  affordance: a small triangle/chevron marker on the grid edge at the
  primary piece's row (mirrors `View.prototype.draw`'s exit-triangle shape,
  drawn with CSS instead of canvas), styled with the same glow treatment so
  it reads as "this is where the glow leads out," not a plain static icon.

## 10. App-level wiring (`apps/unblockrace`)

Already-stubbed files that need real implementations, cross-referenced with
`TODO.md`'s existing task list (don't duplicate that list here — this
section says *how*, TODO.md already says *what*):

- **`src/app/puzzle/page.tsx`**: parse `board`/`moves` (or comma-separated
  chained lists of each, §4) from the query string, resolve to the current
  stage's board string + moves required, render the new `Board` component
  from `packages/unblockrace` wired through `useGameState` (§6). Replace the
  `buildPuzzleUrl`/`puzzleTextToPuzzle` stub functions currently inline in
  `page.tsx` with real imports from the new package.
- **`src/app/page.tsx`**: `SimpleStateWrapper`/`GameState` stub (currently
  `<div>{JSON.stringify(state)}</div>`) becomes `SimpleBoard` from the new
  package. `openUnblockRaceOfTheDay` resolves the mock daily puzzle (§8) and
  routes to `/puzzle?board=...&moves=...`. `calculateCompletionPercentageFromState`/
  `isPuzzleCheated`/`buildPuzzleUrlFromState` stubs get replaced with the
  real helpers from `packages/unblockrace`.
- **`src/app/collection/page.tsx`**: replace the "Coming soon" placeholder
  with the real collection grid (mirrors sudoku's `book/page.tsx` before it
  was stripped — same `IntegratedSessionRow`/`CollectionCover` layout, same
  difficulty-jump buttons, sourced from `CollectionProvider` (§6) instead of
  `BookProvider`.
- **`app.config.js`**: no changes needed beyond what's already there
  (`gameName: 'Unblock Race'` already flows into `RaceTrack`'s `gameName`
  prop per the earlier `gameName` threading work).

## 11. Testing

Same coverage bar as `packages/sudoku` (every helper/hook/component has a
co-located `.test.ts(x)`). Priority order:

1. `parseBoardString` / `boardToString` round-trip, including the derived
   orientation/size logic and validation errors (primary piece must be
   horizontal, no horizontal piece on primary's row, piece shape
   contiguity) — port `model.go`'s `Validate()` test cases as the reference
   for what should be rejected.
2. `boardMoves` — legal move ranges for a piece boxed in by walls/other
   pieces on both sides, at grid edges, etc.
3. `isSolved` / exit target calculation.
4. `useGameState` — mirror sudoku's `gameState.test.ts` structure (restore
   from local/server, save-on-change, polling, completion detection).
5. `Board`/`Piece` component drag interaction — simulate pointer down/move/
   up sequences and assert the committed move matches the nearest legal
   step.
6. Chain/run advancement — solving stage N routes to stage N+1 without
   remounting shared chrome; run completes after stage 5.

## 12. Explicit non-goals for this spec

- No AI opponents/agents implementation (the notes mention AI characters
  should show the same chain-level/stage-level progress views as human
  racers, but building the agent simulation itself is a separate, larger
  effort — out of scope here).
- No vehicle theming/skins.
- No new npm dependencies of any kind — canvas/animation libraries, drag
  libraries, etc. are all deliberately avoided in favor of native Pointer
  Events + CSS, matching the rest of this monorepo's dependency discipline.
- No real backend for puzzle-of-the-day/collections/run-resolution — mocked
  per §8 until the "Server project" TODO.md items are picked up.
- No changes to the native (Android/iOS/Electron) shells beyond what's
  already noted as outstanding in TODO.md.
