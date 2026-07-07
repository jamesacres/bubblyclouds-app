'use client';
import { sha256 } from '@bubblyclouds-app/template/helpers/sha256';
import { useWakeLock } from '@bubblyclouds-app/template/hooks/useWakeLock';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface GameStateMetadata {
  difficulty?: string;
  unblockId?: string;
  unblockCollectionPuzzleId?: string;
}

const buildPuzzleUrl = (_initial: any, _final: any, _metadata: any) => '';
const puzzleTextToPuzzle = (_input: string) => {
  return {} as any;
};

function PuzzlePageComponent() {
  const searchParams = useSearchParams();
  const initial = searchParams.get('initial');
  const final = searchParams.get('final');

  // const alreadyCompleted = searchParams.get('alreadyCompleted') === 'true';

  const { requestWakeLock } = useWakeLock();
  const [puzzle, setPuzzle] = useState<{
    initial: Object;
    final: Object;
    puzzleId: string;
    redirectUri: string;
    metadata: Partial<GameStateMetadata>;
  } | null>(null);

  useEffect(() => {
    (async () => {
      if (initial && final) {
        const metadata: Partial<GameStateMetadata> = {
          difficulty: searchParams.get('difficulty') || undefined,
          unblockId: searchParams.get('unblockId') || undefined,
          unblockCollectionPuzzleId:
            searchParams.get('unblockCollectionPuzzleId') || undefined,
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

  return <div>{puzzle && <div>// TODO puzzle here</div>}</div>;
}

export default function PuzzlePage() {
  return (
    <Suspense>
      <PuzzlePageComponent />
    </Suspense>
  );
}
