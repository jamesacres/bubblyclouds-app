// Emoji-free difficulty presentation for a game's own chrome (label + a
// pill class), as distinct from getDifficultyDisplay's {name, badgeColor}
// shape used by sudoku-style surfaces. A game defines its own difficulty
// vocabulary and maps it to this shape for shared multi-stage components
// (e.g. RaceHud, StageResultPanel, NextPuzzlePanel) to render.
export interface DifficultyDisplay {
  label: string;
  chipClass: string;
}
