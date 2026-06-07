import { GameStateMetadata } from '../types/state';

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function derivePuzzleMetaLabel(
  metadata: Partial<GameStateMetadata>
): string {
  if (metadata.sudokuId?.startsWith('oftheday-')) {
    const parts = metadata.sudokuId.split('-');
    if (parts.length >= 2) {
      const ds = parts[1];
      if (ds.length === 8) {
        const date = new Date(
          `${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}`
        );
        const d = date.getDate();
        const suffix =
          d >= 11 && d <= 13
            ? 'th'
            : (['st', 'nd', 'rd'][(d % 10) - 1] ?? 'th');
        return `Daily ${MONTHS[date.getMonth()]} ${d}${suffix}`;
      }
    }
  }
  if (metadata.sudokuBookPuzzleId?.startsWith('ofthemonth-')) {
    const parts = metadata.sudokuBookPuzzleId.split('-');
    if (parts.length >= 4) {
      const ym = parts[1];
      const monthName = MONTHS[parseInt(ym.slice(4, 6)) - 1];
      const num = parseInt(parts[3]) + 1;
      return `Book ${monthName} #${num}`;
    }
  }
  if (metadata.scannedAt && metadata.scannedAt !== 'undefined') {
    return 'Scanned Puzzle';
  }
  return '';
}
