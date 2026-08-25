import CollectionCover from '@bubblyclouds-app/games/components/CollectionCover';
import SimpleBoard from './SimpleBoard';

interface UnblockCollectionCoverProps {
  month: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'portrait' | 'tile';
}

// Decorative board shown on the cover — a real (easy) board from the seed
// database so the cover always looks like the game.
const COVER_BOARD = 'FBBCCoFoGoooAAGooooDDooooEEooooooooo';

const COVER_BACKGROUND =
  'linear-gradient(160deg, #061231 0%, #0b3a8f 55%, #0e7490 100%)';
const COVER_SHADOW =
  '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(56,189,248,0.35), inset 0 1px 0 rgba(255,255,255,0.18)';
const COVER_TITLE_GLOW = 'rgba(103,232,249,0.8)';

// Unblock Race's own identity (blue/cyan gradient, its own hero board) layered
// on the shared @games CollectionCover shell. Mirrors sudoku's BookCover role,
// reframed as "collection" — no "book" language (TODO.md).
const UnblockCollectionCover = ({
  month,
  size,
  variant,
}: UnblockCollectionCoverProps) => (
  <CollectionCover
    title={month}
    gameLabel="Unblock Race"
    size={size}
    variant={variant}
    background={COVER_BACKGROUND}
    shadow={COVER_SHADOW}
    titleGlow={COVER_TITLE_GLOW}
  >
    <SimpleBoard initial={COVER_BOARD} transparent compact />
  </CollectionCover>
);

export default UnblockCollectionCover;
