'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { InAppReview } from '@capacitor-community/in-app-review';
import { Trophy } from 'lucide-react';
import { StarRating } from '@bubblyclouds-app/ui/components/StarRating';
import { CountUp } from '@bubblyclouds-app/ui/components/CountUp';
import RaceCelebrationOverlay, {
  CELEBRATION_MS,
} from '@bubblyclouds-app/ui/components/RaceCelebrationOverlay';

// How long the finish celebration owns the screen. Passthrough of the shared
// overlay's timing so a game's own showAnimation window stays in sync
// without a second magic number.
export const RACE_CELEBRATION_MS = CELEBRATION_MS;

interface RaceCelebrationProps {
  isVisible: boolean;
  // The run-total readout (e.g. "1:35 · 42 moves") — formatting and the
  // scoring dimension shown are entirely the caller's concern.
  statsLine: ReactNode;
  // Confetti wears the caller's own palette so the rain reads as this
  // game bursting, not a generic party.
  confettiColors: string[];
  // Run-total star grade (total score vs total par) and summed leaderboard
  // points across every stage — the same addictive payoff a per-stage slam
  // shows, tallied for the whole run. Omitted for runs that can't be graded.
  stars?: number;
  points?: number;
  completedGamesCount?: number;
  isCapacitor?: () => boolean;
}

// A game's own finish celebration — the shared @ui CelebrationAnimation
// keeps its exploding-numbers styling for sudoku (that board has no text
// cells for it to explode, and it blanks the grid while it runs). This one is
// a race podium moment built on the shared RaceCelebrationOverlay: checkered/
// palette confetti rain, a FINISH! banner slam carrying the run totals, and
// a hero car taking a victory lap across the screen. The board stays visible
// and glowing underneath throughout.
const RaceCelebration = ({
  isVisible,
  statsLine,
  confettiColors,
  stars,
  points,
  completedGamesCount = 0,
  isCapacitor,
}: RaceCelebrationProps) => {
  // The same rating-prompt milestones the shared celebration used, kept so
  // swapping the visuals doesn't drop the review ask.
  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const timer = setTimeout(() => {
      try {
        if (
          isCapacitor?.() &&
          [2, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].includes(
            completedGamesCount
          )
        ) {
          InAppReview.requestReview().catch((e: unknown) => {
            console.error(e);
          });
        }
      } catch (e) {
        console.error('Error requesting app review:', e);
      }
    }, RACE_CELEBRATION_MS);
    return () => clearTimeout(timer);
  }, [isVisible, completedGamesCount, isCapacitor]);

  // Keep the outer data-testid the tests and any styling hooks expect while
  // composing the shared overlay underneath.
  const belowBadge = useMemo(
    () => (
      <>
        {stars !== undefined && (
          <div
            data-testid="race-celebration-stars"
            style={{
              animation: 'celebration-banner-rise 400ms ease-out 450ms both',
            }}
          >
            <StarRating rating={stars} size="lg" animated staggerMs={220} />
          </div>
        )}
        <div
          data-testid="race-celebration-totals"
          className="font-mono text-2xl font-bold tabular-nums text-white"
          style={{
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            animation: 'celebration-banner-rise 400ms ease-out 500ms both',
          }}
        >
          {statsLine}
        </div>
        {points !== undefined && (
          <div
            data-testid="race-celebration-points"
            className="flex flex-col items-center gap-0.5"
            style={{
              animation: 'celebration-banner-rise 400ms ease-out 650ms both',
            }}
          >
            <CountUp
              value={points}
              prefix="+"
              suffix=" pts"
              startDelayMs={900}
              className="font-mono text-3xl font-black tabular-nums text-amber-300"
            />
            <span className="text-[0.65rem] font-black uppercase tracking-widest text-white/60">
              Leaderboard points
            </span>
          </div>
        )}
      </>
    ),
    [stars, points, statsLine]
  );

  if (!isVisible) {
    return null;
  }

  return (
    <div data-testid="race-celebration">
      <RaceCelebrationOverlay
        isVisible={isVisible}
        title="Finish!"
        confettiColors={confettiColors}
        checkered
        badge={
          <div className="flex items-center gap-2 rounded-full bg-zinc-900/85 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg ring-1 ring-white/15">
            <Trophy className="h-4 w-4 text-amber-400" aria-hidden="true" />
            Run complete
          </div>
        }
        belowBadge={belowBadge}
      >
        {/* Victory lap: the hero car streaks across below the banner with a
            light trail, the same anatomy as its board self at pill scale */}
        <div
          className="celebration-motion absolute"
          style={{
            top: '68%',
            left: '-12%',
            animation: `race-celebration-victory-lap 1500ms cubic-bezier(0.5, 0, 0.7, 1) 700ms both`,
          }}
        >
          <style>{`
            @keyframes race-celebration-victory-lap {
              from { left: -12%; }
              to { left: 112%; }
            }
          `}</style>
          <div className="relative h-6 w-12">
            {/* Trail */}
            <div
              className="absolute right-full top-1/2 h-1.5 w-28 -translate-y-1/2 rounded-full opacity-70"
              style={{
                background:
                  'linear-gradient(to left, var(--theme-primary), transparent)',
                filter: 'blur(1px)',
              }}
            />
            <div
              className="relative h-full w-full rounded-md"
              style={{
                background:
                  'linear-gradient(150deg, color-mix(in srgb, var(--theme-primary) 76%, white) 0%, var(--theme-primary) 45%, color-mix(in srgb, var(--theme-primary) 80%, black) 100%)',
                boxShadow:
                  '0 0 18px 3px color-mix(in srgb, var(--theme-primary) 70%, transparent)',
              }}
            >
              {/* Racing stripe, cabin and headlight matching the board hero */}
              <div className="absolute inset-x-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/35" />
              <div className="absolute bottom-1 left-1/3 top-1 w-1/3 rounded-sm bg-slate-900/45" />
              <div className="absolute -right-px top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_3px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
        </div>
      </RaceCelebrationOverlay>
    </div>
  );
};

export default RaceCelebration;
