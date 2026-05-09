export type CellHighlightRole =
  | 'stem'
  | 'petalA'
  | 'petalB'
  | 'pattern'
  | 'chainOn'
  | 'chainOff'
  | 'elimination';

export interface CellHighlight {
  role: CellHighlightRole;
  eliminatedDigits?: number[];
  visibleDigits?: number[];
}
