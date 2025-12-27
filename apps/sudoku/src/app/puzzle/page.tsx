'use client';
import { puzzleTextToPuzzle } from '@sudoku-web/sudoku/helpers/puzzleTextToPuzzle';
import { Puzzle } from '@sudoku-web/sudoku/types/puzzle';
import { GameStateMetadata } from '@sudoku-web/sudoku/types/state';
import Sudoku from '@sudoku-web/sudoku/components/Sudoku';
import { buildPuzzleUrl } from '@sudoku-web/sudoku/helpers/buildPuzzleUrl';
import { sha256 } from '@sudoku-web/template/helpers/sha256';
import { useWakeLock } from '@sudoku-web/template/hooks/useWakeLock';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { APP_CONFIG } from '../../../app.config.js';

function PuzzlePageComponent() {
  const searchParams = useSearchParams();
  const initial = searchParams.get('initial');
  const final = searchParams.get('final');

  const alreadyCompleted = searchParams.get('alreadyCompleted') === 'true';
  const showRacingPrompt = searchParams.get('showRacingPrompt') !== 'false';

  const { requestWakeLock } = useWakeLock();
  const [puzzle, setPuzzle] = useState<{
    initial: Puzzle<number>;
    final: Puzzle<number>;
    puzzleId: string;
    redirectUri: string;
    metadata: Partial<GameStateMetadata>;
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (initial && final) {
        const metadata: Partial<GameStateMetadata> = {
          difficulty: searchParams.get('difficulty') || undefined,
          sudokuId: searchParams.get('sudokuId') || undefined,
          sudokuBookPuzzleId:
            searchParams.get('sudokuBookPuzzleId') || undefined,
          scannedAt: searchParams.get('scannedAt') || undefined,
        };
        const redirectUri = buildPuzzleUrl(initial, final, metadata);
        setPuzzle({
          redirectUri,
          metadata,
          puzzleId: await sha256(initial),
          initial: puzzleTextToPuzzle(initial),
          final: puzzleTextToPuzzle(final),
        });
      }
    })();
  }, [initial, final, searchParams]);

  // Request wake lock when puzzle loads
  useEffect(() => {
    if (puzzle) {
      requestWakeLock();
    }
    // Cleanup happens automatically in the useWakeLock hook
  }, [puzzle, requestWakeLock]);

  return (
    <div>
      {puzzle && (
        <Sudoku
          puzzle={puzzle}
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
