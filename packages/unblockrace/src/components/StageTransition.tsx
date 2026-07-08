'use client';

import { ReactNode, useEffect, useState } from 'react';
import Board from './Board';

const noop = () => {};

// How long the two-board slide takes. The car has already reached the exit
// edge of the outgoing board (Piece's win slide); this carries it across the
// seam into the next puzzle so it reads as one continuous motion (SPEC.md
// §4: "the piece's exit motion continues into the next board sliding in").
export const STAGE_SLIDE_MS = 620;

interface StageTransitionProps {
  // Outgoing board in its solved state. Rendered non-interactive but with
  // the primary piece's win-exit still playing, so the car slides off this
  // board's right edge just as the track carries it toward the next.
  fromBoardString: string;
  // 'forward' when advancing to the next stage (incoming enters from the
  // right), 'back' when jumping to an earlier stage (incoming enters from
  // the left). Both primary pieces are the theme colour, so a forward slide
  // reads as the same car driving out of one board and into the next.
  direction: 'forward' | 'back';
  // The live, interactive board for the destination stage.
  children: ReactNode;
  onDone: () => void;
}

// Seamless stage-to-stage slide. Lays the outgoing and incoming boards side
// by side in a 200%-wide track and translates the track by one board width
// so the destination board slides into place as the solved board slides out.
const StageTransition = ({
  fromBoardString,
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
      <Board boardString={fromBoardString} onMove={noop} isStatic />
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
    // matching the standalone <Board> wrapper — otherwise the track is as wide
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
