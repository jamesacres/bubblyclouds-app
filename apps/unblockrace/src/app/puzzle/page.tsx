'use client';
import UnblockRace, {
  RunStage,
} from '@bubblyclouds-app/unblockrace/components/UnblockRace';
import { puzzleTextToPuzzle } from '@bubblyclouds-app/unblockrace/helpers/puzzleTextToPuzzle';
import { GameStateMetadata } from '@bubblyclouds-app/unblockrace/types/state';
import { useWakeLock } from '@bubblyclouds-app/template/hooks/useWakeLock';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';
import { APP_CONFIG } from '../../../app.config.js';

function PuzzlePageComponent() {
  const searchParams = useSearchParams();
  const board = searchParams.get('board');
  const moves = searchParams.get('moves');

  const alreadyCompleted = searchParams.get('alreadyCompleted') === 'true';
  const showRacingPrompt = searchParams.get('showRacingPrompt') !== 'false';

  const { requestWakeLock } = useWakeLock();
  const run = useMemo<{
    stages: RunStage[];
    runId?: string;
    metadata: Partial<GameStateMetadata>;
  } | null>(() => {
    if (!board) {
      return null;
    }
    // Chained run (SPEC.md §4): comma-separated lists in both params,
    // positionally paired. A single pair is a 1-puzzle run.
    const boards = board.split(',');
    const movesList = (moves || '').split(',');
    try {
      const stages: RunStage[] = boards.map((boardString, i) => ({
        boardString: puzzleTextToPuzzle(boardString),
        movesRequired: Number(movesList[i]) || 0,
      }));
      const metadata: Partial<GameStateMetadata> = {
        unblockCollectionPuzzleId:
          searchParams.get('unblockCollectionPuzzleId') || undefined,
      };
      return {
        stages,
        runId: searchParams.get('runId') || undefined,
        metadata,
      };
    } catch (e) {
      console.error('Invalid board in URL', e);
      return null;
    }
  }, [board, moves, searchParams]);

  // Request wake lock when puzzle loads
  useEffect(() => {
    if (run) {
      requestWakeLock();
    }
    // Cleanup happens automatically in the useWakeLock hook
  }, [run, requestWakeLock]);

  return (
    <div>
      {run && (
        <UnblockRace
          run={{ stages: run.stages, runId: run.runId }}
          metadata={run.metadata}
          alreadyCompleted={alreadyCompleted}
          showRacingPrompt={showRacingPrompt}
          app={APP_CONFIG.app}
          appName={APP_CONFIG.appName}
          apiUrl={APP_CONFIG.apiUrl}
          appUrl={APP_CONFIG.appUrl}
          appStoreUrl={APP_CONFIG.appStoreUrl}
          googlePlayUrl={APP_CONFIG.googlePlayUrl}
          deepLinkScheme={APP_CONFIG.deepLinkScheme}
          mobileDescription={APP_CONFIG.mobileDescription}
          desktopDescription={APP_CONFIG.desktopDescription}
          openInAppLabel={APP_CONFIG.openInAppLabel}
        />
      )}
    </div>
  );
}

export default function PuzzlePage() {
  return (
    <Suspense>
      <PuzzlePageComponent />
    </Suspense>
  );
}
