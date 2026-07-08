export type Orientation = 'horizontal' | 'vertical';

export interface Piece {
  position: number;
  size: number;
  orientation: Orientation;
}

export interface Move {
  piece: number;
  steps: number;
}

export interface Board {
  width: number;
  height: number;
  pieces: Piece[];
  walls: number[];
}
