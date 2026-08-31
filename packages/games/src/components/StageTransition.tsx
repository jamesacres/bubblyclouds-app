'use client';

import { ReactNode, useEffect, useState } from 'react';

// How long the two-board slide takes. The outgoing piece has already reached
// the exit edge of its board; this carries it across the seam into the next
// puzzle so it reads as one continuous motion.
export const STAGE_SLIDE_MS = 620;

interface StageTransitionProps {
  // The outgoing stage, rendered non-interactive by the caller (e.g. still
  // playing its own win-exit animation) so it reads as sliding off toward
  // the incoming stage.
  renderFrom: ReactNode;
  // 'forward' when advancing to the next stage (incoming enters from the
  // right), 'back' when jumping to an earlier stage (incoming enters from
  // the left). Both sides typically share the same hero colour/identity, so
  // a forward slide reads as the same run continuing from one stage into
  // the next.
  direction: 'forward' | 'back';
  // The live, interactive board for the destination stage.
  children: ReactNode;
  onDone: () => void;
}

// Seamless stage-to-stage slide. Lays the outgoing and incoming boards side
// by side in a 200%-wide track and translates the track by one board width
// so the destination board slides into place as the solved board slides out.
const StageTransition = ({
  renderFrom,
  direction,
  children,
  onDone,
}: StageTransitionProps) => {
  const forward = direction === 'forward';
  // Forward: [outgoing][incoming], slide 0 -> -50% (reveal the right cell).
  // Back:    [incoming][outgoing], slide -50% -> 0 (reveal the left cell).
  const [offset, setOffset] = useState(forward ? '0%' : '-50%');

  const outgoing = (
    <div key="outgoing" className="w-1/2 shrink-0">
      {renderFrom}
    </div>
  );
  const incoming = (
    <div key="incoming" className="w-1/2 shrink-0">
      {children}
    </div>
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setOffset(forward ? '-50%' : '0%');
    });
    const timeout = setTimeout(onDone, STAGE_SLIDE_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
    // Run once for the life of this transition; onDone is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // Clip to the board's own footprint (max-w-xl, right-aligned on desktop),
    // matching the standalone board wrapper — otherwise the track is as wide
    // as the whole column and the incoming board slides in from far outside
    // the board area instead of from just off its edge.
    <div className="ml-auto mr-auto w-full max-w-xl overflow-hidden lg:mr-0">
      <div
        data-testid="stage-transition-track"
        className="flex w-[200%]"
        style={{
          transform: `translate3d(${offset}, 0, 0)`,
          transition: `transform ${STAGE_SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        {forward ? (
          <>
            {outgoing}
            {incoming}
          </>
        ) : (
          <>
            {incoming}
            {outgoing}
          </>
        )}
      </div>
    </div>
  );
};

export default StageTransition;
