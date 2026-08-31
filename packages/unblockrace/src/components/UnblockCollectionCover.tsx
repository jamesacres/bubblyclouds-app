import CollectionCover from '@bubblyclouds-app/games/components/CollectionCover';
import SimpleBoard from './SimpleBoard';
import { getMonthlyCollectionTheme } from '../helpers/monthlyCollectionTheme';

interface UnblockCollectionCoverProps {
  month: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'portrait' | 'tile';
}

// Decorative board shown on the cover — a real (easy) board from the seed
// database so the cover always looks like the game.
const COVER_BOARD = 'FBBCCoFoGoooAAGooooDDooooEEooooooooo';

// Unblock Race's own identity, themed per month (blue/cyan/amber/lime/rose/
// orange/teal — never violet/fuchsia, which is Sudoku Race's) layered on the
// shared @games CollectionCover shell. Mirrors sudoku's BookCover role,
// reframed as "collection" — no "book" language (TODO.md).
const UnblockCollectionCover = ({
  month,
  size,
  variant,
}: UnblockCollectionCoverProps) => {
  const theme = getMonthlyCollectionTheme(month);

  return (
    <CollectionCover
      title={month}
      gameLabel="Unblock Race"
      kicker={theme.kicker}
      size={size}
      variant={variant}
      background={theme.background}
      shadow={theme.shadow}
      titleGlow={theme.titleGlow}
      icon={theme.icon}
      iconAnimationClass={theme.animationClass}
    >
      <SimpleBoard initial={COVER_BOARD} transparent compact />
    </CollectionCover>
  );
};

export default UnblockCollectionCover;
