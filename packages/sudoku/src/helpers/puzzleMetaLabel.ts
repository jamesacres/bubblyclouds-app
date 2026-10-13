import { Translate } from '@bubblyclouds-app/games/types/i18n';
import { GameStateMetadata } from '../types/state';

const formatShortMonth = (monthIndex: number, language: string): string =>
  new Date(Date.UTC(2000, monthIndex, 1)).toLocaleString(language, {
    month: 'short',
    timeZone: 'UTC',
  });

export function derivePuzzleMetaLabel(
  metadata: Partial<GameStateMetadata>,
  t: Translate,
  language: string
): string {
  if (metadata.sudokuId?.startsWith('oftheday-')) {
    const parts = metadata.sudokuId.split('-');
    if (parts.length >= 2) {
      const ds = parts[1];
      if (ds.length === 8) {
        const date = new Date(
          `${ds.slice(0, 4)}-${ds.slice(4, 6)}-${ds.slice(6, 8)}`
        );
        const d = date.getUTCDate();
        return t('puzzleMeta.daily', {
          month: formatShortMonth(date.getUTCMonth(), language),
          day: t('puzzleMeta.dayOrdinal', { count: d, ordinal: true }),
        });
      }
    }
  }
  if (metadata.sudokuBookPuzzleId?.startsWith('ofthemonth-')) {
    const parts = metadata.sudokuBookPuzzleId.split('-');
    if (parts.length >= 4) {
      const ym = parts[1];
      const monthIndex = parseInt(ym.slice(4, 6), 10) - 1;
      const puzzleIndex = parseInt(parts[3], 10);
      if (!(monthIndex >= 0 && monthIndex <= 11) || isNaN(puzzleIndex)) {
        return '';
      }
      return t('puzzleMeta.book', {
        month: formatShortMonth(monthIndex, language),
        number: puzzleIndex + 1,
      });
    }
  }
  if (metadata.scannedAt && metadata.scannedAt !== 'undefined') {
    return t('puzzleMeta.scanned');
  }
  return '';
}
