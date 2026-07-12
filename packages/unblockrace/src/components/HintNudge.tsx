'use client';

// "Stuck? Try a hint" speech bubble: a small pill with a downward tail that
// points at the hint button, bobbing gently to draw the eye. Purely
// presentational — the caller (UnblockRace) owns when it appears and hides.
// Reduced motion stills the bob.
const HintNudge = () => (
  <div data-testid="hint-nudge" className="relative">
    <style>{`
      @keyframes unblock-hint-nudge-bob {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-testid="hint-nudge"] { animation: none !important; }
      }
    `}</style>
    <div
      className="bg-theme-primary flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-lg"
      style={{
        animation: 'unblock-hint-nudge-bob 1.6s ease-in-out infinite',
        boxShadow:
          '0 0 18px color-mix(in srgb, var(--theme-primary) 55%, transparent), 0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      Stuck? Try a hint
    </div>
    {/* Tail: a small triangle pointing down toward the hint button */}
    <div
      aria-hidden="true"
      className="bg-theme-primary absolute right-4 top-full h-2.5 w-2.5 -translate-y-1/2 rotate-45"
    />
  </div>
);

export default HintNudge;
