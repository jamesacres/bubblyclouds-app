// Move count graded against par, in the same colours as the game's
// leaderboards — amber over par, emerald under, neutral on par — with the
// golf-style delta saying exactly how far over or under
import { useTranslation } from 'react-i18next';

export const MovesDisplay = ({
  moves,
}: {
  moves: { movesMade: number; movesRequired: number };
}) => {
  const { t } = useTranslation('template');
  const movesDelta = moves.movesMade - moves.movesRequired;
  return (
    <span
      dir="ltr"
      className={`font-mono tabular-nums ${
        movesDelta > 0
          ? 'text-amber-600 dark:text-amber-400'
          : movesDelta < 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'opacity-75'
      }`}
    >
      {moves.movesMade}/{moves.movesRequired}
      {movesDelta !== 0 && ` ${movesDelta > 0 ? '+' : ''}${movesDelta}`}
      <span className="sr-only">
        {` ${
          movesDelta === 0
            ? t('moves.onPar')
            : movesDelta > 0
              ? t('moves.overPar', { delta: Math.abs(movesDelta) })
              : t('moves.underPar', { delta: Math.abs(movesDelta) })
        }`}
      </span>
    </span>
  );
};
