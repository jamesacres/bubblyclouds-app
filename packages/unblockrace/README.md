# @bubblyclouds-app/unblockrace

Unblock Race (Rush Hour style sliding-block puzzle) game logic and UI
components package. See `SPEC.md` at the repo root for the full design.

## Purpose

Provides the sliding-block puzzle game: board encoding, move validation, win
detection, drag interaction, race chain (5-puzzle run) orchestration, and the
mock puzzle-content source used until the real backend exists.

## Board encoding

Boards are strings of `width*height` characters, row-major, one per cell
(reused verbatim from [Michael Fogleman's rush](https://www.michaelfogleman.com/rush/)
database so his puzzle data can be used as seed content):

- `o` = empty, `x` = wall
- `A` = primary piece (always horizontal, exits off the right edge of its row)
- `B`–`Z` = other pieces

Piece orientation and size are derived from each label's cell indices, not
stored. The board string doubles as the puzzle id.

## Key modules

- `helpers/parseBoardString` / `helpers/boardToString` — string ↔ `Board`
  with the reference implementation's validation rules
- `helpers/boardMoves` — legal move ranges (walk from piece ends until
  hitting an occupied cell or edge)
- `helpers/doMove` / `helpers/isSolved` — immutable move application and the
  win condition (primary piece flush with the right edge)
- `hooks/useGameState` — per-puzzle state machine (local+server dual-write,
  polling, timer, undo/redo), mirrors `@sudoku`'s hook
- `hooks/useDrag` — Pointer Events piece dragging with axis constraint,
  range clamping, and direct-to-DOM transforms during the drag
- `components/UnblockRace` — the full game screen including the 5-puzzle
  chain mechanic (stage transitions without unmounting the racing chrome)
- `helpers/mockData` — deterministic daily run / monthly collection picks
  from `mockData/puzzles.json` (regenerate with
  `node scripts/generateMockPuzzles.mjs /path/to/rush.txt`)

## Layering

L5 game-specific package. Depends on `@games`, `@template`, `@auth`, `@ui`,
`@types`. Consumed by `apps/unblockrace`.
