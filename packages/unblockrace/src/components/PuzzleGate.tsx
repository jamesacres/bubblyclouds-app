'use client';

interface PuzzleGateProps {
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
}

// Full-board overlay that seals off a puzzle the player can't yet play (a
// locked collection deep-link). Styled like the stage-clear slam — backdrop
// blur plus the same slam-in — so it reads as part of the game's chrome, not
// a generic modal. Pointer events are enabled here (unlike the slam) because
// its two buttons are the only way forward.
const PuzzleGate = ({
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: PuzzleGateProps) => (
  <div
    data-testid="puzzle-gate"
    className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/45 px-6 text-center backdrop-blur-sm"
    style={{ animation: 'unblock-puzzle-gate 450ms ease-out both' }}
  >
    <style>{`
      @keyframes unblock-puzzle-gate {
        0% { transform: scale(1.5); opacity: 0; }
        55% { transform: scale(0.97); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-testid="puzzle-gate"],
        [data-testid="puzzle-gate"] * { animation: none !important; }
      }
    `}</style>
    <div
      className="text-2xl font-black uppercase tracking-tight text-white"
      style={{
        textShadow:
          '0 2px 12px rgba(0,0,0,0.55), 0 0 34px color-mix(in srgb, var(--theme-primary) 80%, transparent)',
      }}
    >
      {title}
    </div>
    <p className="max-w-xs text-sm font-medium text-white/85">{body}</p>
    <div className="mt-2 flex flex-col items-center gap-2">
      <button
        type="button"
        data-testid="puzzle-gate-primary"
        onClick={onPrimary}
        className="bg-theme-primary hover:bg-theme-primary-dark flex cursor-pointer items-center gap-1 rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-widest text-white transition-all duration-200 hover:scale-[1.03] active:scale-95"
        style={{
          boxShadow:
            '0 0 24px color-mix(in srgb, var(--theme-primary) 55%, transparent), 0 2px 8px rgba(0,0,0,0.35)',
        }}
      >
        {primaryLabel}
      </button>
      <button
        type="button"
        data-testid="puzzle-gate-secondary"
        onClick={onSecondary}
        className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-white/70 transition-opacity hover:text-white"
      >
        {secondaryLabel}
      </button>
    </div>
  </div>
);

export default PuzzleGate;
