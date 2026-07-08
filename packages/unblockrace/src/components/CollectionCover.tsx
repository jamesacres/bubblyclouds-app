import SimpleBoard from './SimpleBoard';

interface CollectionCoverProps {
  month: string;
  size?: 'small' | 'medium' | 'large';
}

const SIZES = {
  small: { width: 120, height: 180 },
  medium: { width: 160, height: 240 },
  large: { width: 240, height: 360 },
};

// Decorative board shown on the cover — a real (easy) board from the seed
// database so the cover always looks like the game.
const COVER_BOARD = 'FBBCCoFoGoooAAGooooDDooooEEooooooooo';

// Mirrors sudoku's BookCover role, reframed as "collection" — no "book"
// language (TODO.md).
const CollectionCover = ({ month, size = 'medium' }: CollectionCoverProps) => {
  const { width, height } = SIZES[size];

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-2xl p-4"
      style={{
        width,
        height,
        background:
          'linear-gradient(160deg, #1e1b4b 0%, #4c1d95 55%, #86198f 100%)',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.12), 0 0 30px rgba(139,92,246,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
        Monthly collection
      </p>
      <p
        className="mb-3 text-xl font-black leading-tight text-white"
        style={{ textShadow: '0 0 14px rgba(167,139,250,0.8)' }}
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
