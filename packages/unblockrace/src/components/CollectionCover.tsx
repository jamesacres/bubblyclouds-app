import SimpleBoard from './SimpleBoard';

interface CollectionCoverProps {
  month: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'portrait' | 'tile';
}

const SIZES = {
  small: { width: 120, height: 180 },
  medium: { width: 160, height: 240 },
  large: { width: 240, height: 360 },
};

// Decorative board shown on the cover — a real (easy) board from the seed
// database so the cover always looks like the game.
const COVER_BOARD = 'FBBCCoFoGoooAAGooooDDooooEEooooooooo';

const COVER_BACKGROUND =
  'linear-gradient(160deg, #061231 0%, #0b3a8f 55%, #0e7490 100%)';
const COVER_SHADOW =
  '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(56,189,248,0.35), inset 0 1px 0 rgba(255,255,255,0.18)';

// Mirrors sudoku's BookCover role, reframed as "collection" — no "book"
// language (TODO.md). The tile variant is the same cover identity squeezed
// into a near-square thumbnail; it fills the parent's width.
const CollectionCover = ({
  month,
  size = 'medium',
  variant = 'portrait',
}: CollectionCoverProps) => {
  if (variant === 'tile') {
    return (
      <div
        className="flex w-full flex-col overflow-hidden rounded-2xl p-2.5"
        style={{ background: COVER_BACKGROUND, boxShadow: COVER_SHADOW }}
      >
        <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-widest text-white/60">
          {month}
        </p>
        <SimpleBoard initial={COVER_BOARD} transparent compact />
      </div>
    );
  }

  const { width, height } = SIZES[size];

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl p-4"
      style={{
        width,
        height,
        background: COVER_BACKGROUND,
        boxShadow: COVER_SHADOW,
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
        Monthly collection
      </p>
      <p
        className="mb-3 text-xl font-black leading-tight text-white"
        style={{ textShadow: '0 0 14px rgba(103,232,249,0.8)' }}
      >
        {month}
      </p>
      <div className="mt-auto">
        <SimpleBoard initial={COVER_BOARD} transparent compact />
      </div>
      <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-white/40">
        Unblock Race
      </p>
    </div>
  );
};

export default CollectionCover;
