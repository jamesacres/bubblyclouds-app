import { ReactNode } from 'react';

interface CollectionCoverProps {
  title: string;
  gameLabel: string;
  kicker?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'portrait' | 'tile';
  background: string;
  shadow: string;
  titleGlow: string;
  // Optional decorative badge (e.g. a themed emoji) shown in the corner of
  // the portrait variant, with an optional CSS animation class applied to it.
  icon?: string;
  iconAnimationClass?: string;
  // The board preview shown on the cover — the caller's own thumbnail
  // render, so the cover always looks like the game it belongs to.
  children: ReactNode;
}

const SIZES = {
  small: { width: 120, height: 180 },
  medium: { width: 160, height: 240 },
  large: { width: 240, height: 360 },
};

// Mirrors sudoku's BookCover role, reframed as "collection" — a game's own
// identity (colours, kicker copy, footer label) is entirely the caller's.
// The tile variant is the same cover identity squeezed into a near-square
// thumbnail; it fills the parent's width.
const CollectionCover = ({
  title,
  gameLabel,
  kicker = 'Monthly collection',
  size = 'medium',
  variant = 'portrait',
  background,
  shadow,
  titleGlow,
  icon,
  iconAnimationClass,
  children,
}: CollectionCoverProps) => {
  if (variant === 'tile') {
    return (
      <div
        className="flex w-full flex-col overflow-hidden rounded-2xl p-2.5"
        style={{ background, boxShadow: shadow }}
      >
        <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-widest text-white/60">
          {title}
        </p>
        {children}
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
        background,
        boxShadow: shadow,
      }}
    >
      {icon && (
        <div
          className={`absolute right-3 top-3 text-2xl opacity-80 ${iconAnimationClass || ''}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
        {kicker}
      </p>
      <p
        className="mb-3 text-xl font-black leading-tight text-white"
        style={{ textShadow: `0 0 14px ${titleGlow}` }}
      >
        {title}
      </p>
      <div className="mt-auto">{children}</div>
      <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-white/40">
        {gameLabel}
      </p>
    </div>
  );
};

export default CollectionCover;
