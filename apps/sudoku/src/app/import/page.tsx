'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Solver,
  VideoReadyPayload,
} from '../../augmentedReality/Processor';
import type Processor from '../../augmentedReality/Processor';
import { useRouter } from 'next/navigation';
import SimpleSudoku from '@bubblyclouds-app/sudoku/components/SimpleSudoku';
import { emptyPuzzle } from '@bubblyclouds-app/sudoku/types/puzzle';
import { buildPuzzleUrl } from '@bubblyclouds-app/sudoku/helpers/buildPuzzleUrl';

let processor: Processor | undefined;
let solver: Solver | undefined;

export default function Home() {
  const router = useRouter();
  const [_isLoading, setIsLoading] = useState(true);
  const [puzzleStrings, setPuzzleStrings] = useState<
    { initial: string; final: string } | undefined
  >(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoWidth, setVideoWidth] = useState(100);
  const [videoHeight, setVideoHeight] = useState(100);
  const initialized = useRef(false);
  const [puzzleInput, setPuzzleInput] = useState('');
  const [puzzleInputError, setPuzzleInputError] = useState('');
  const solverReady = useRef(false);

  function videoReadyListener({ width, height }: VideoReadyPayload) {
    setVideoWidth(width);
    setVideoHeight(height);
  }

  useEffect(() => {
    if (puzzleStrings) {
      processor = undefined;
      solver = undefined;
      router.replace(
        buildPuzzleUrl(puzzleStrings.initial, puzzleStrings.final, {
          scannedAt: new Date().toISOString(),
        })
      );
    }
  }, [router, puzzleStrings]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!initialized.current) {
      initialized.current = true;

      (async () => {
        if (!processor) {
          processor = new (
            await import('../../augmentedReality/Processor')
          ).default();

          processor.on('videoReady', videoReadyListener);
        }

        const video = videoRef.current;
        if (video) {
          processor.setSolver((...args) => {
            if (solver) {
              return solver(...args);
            }
            return '';
          });
          processor.startVideo(video).then(
            () => {
              setIsLoading(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
            (error) => alert(error.message)
          );
        }
      })();
    }
    return () => {
      if (processor) {
        processor.stopVideo();
        processor.setSolver(null);
        processor.off('videoReady', videoReadyListener);
        processor = undefined;
      }
    };
  }, [videoRef]);

  const solveString = useCallback((puzzleString: string) => {
    const thisSolution = (window as any).Module.ccall(
      'solve',
      'string',
      ['string'],
      [puzzleString]
    );
    if (thisSolution && thisSolution.length === 81) {
      setPuzzleStrings({
        initial: puzzleString,
        final: thisSolution,
      });
      return thisSolution;
    }
    return undefined;
  }, []);

  const ready = useCallback(() => {
    solverReady.current = true;
    solver = (boxes: { x: number; y: number; contents: number }[]) => {
      const MAX = 8;
      let lastX = -1;
      let lastY = 0;
      let boxesString = boxes.reduce((result, { x, y, contents }) => {
        let newResult = result;
        if (y !== lastY) {
          newResult = `${newResult}${[...new Array(MAX - lastX)].map((_) => '.').join('')}`;
          lastX = -1;
        }
        if (x > 0) {
          newResult = `${newResult}${[...new Array(x - lastX - 1)].map((_) => '.').join('')}`;
        }
        lastX = x;
        lastY = y;
        return `${newResult}${contents}`;
      }, '');
      boxesString = `${boxesString}${[...new Array(81 - boxesString.length)].map((_) => '.').join('')}`;
      return solveString(boxesString);
    };
    if (processor) {
      processor.setSolver(solver);
    }
  }, [solveString]);

  const parsePuzzleInput = useCallback((raw: string): string | null => {
    const flat = raw.trim().replace(/0/g, '.');
    // Flat 81-char string
    if (/^[1-9.]+$/.test(flat) && flat.length === 81) {
      return flat;
    }
    // HoDoKu grid: each data row has exactly 4 pipe-delimited segments
    // (empty prefix, 3 cell groups, empty suffix). Split per line to avoid
    // the greedy cross-pipe matching that a single regex produces.
    // Notes like "123" are treated as empty cells.
    const cellTokens = raw.split('\n').flatMap((line) => {
      const parts = line.split('|');
      if (parts.length !== 5) return [];
      return parts
        .slice(1, 4)
        .flatMap((seg) => seg.trim().split(/\s+/).filter(Boolean));
    });
    if (cellTokens.length === 81) {
      return cellTokens.map((t) => (/^[1-9]$/.test(t) ? t : '.')).join('');
    }
    return null;
  }, []);

  const handlePuzzleInputSubmit = useCallback(() => {
    const normalised = parsePuzzleInput(puzzleInput);
    if (normalised === null) {
      setPuzzleInputError(
        'Could not parse puzzle. Paste an 81-character string or a HoDoKu grid.'
      );
      return;
    }
    if (!solverReady.current) {
      setPuzzleInputError('Solver is still loading — please try again.');
      return;
    }
    const solution = solveString(normalised);
    if (!solution) {
      setPuzzleInputError('No solution found. Please check the puzzle.');
      return;
    }
    setPuzzleInputError('');
  }, [parsePuzzleInput, puzzleInput, solveString]);

  return (
    <main className="max-w-(--breakpoint-sm) container mx-auto px-4 pb-8">
      {/* ── Text input ─────────────────────────────────────────── */}
      <section className="mt-6">
        <h2 className="mb-1 text-lg font-semibold tracking-tight text-stone-800 dark:text-zinc-100">
          Enter a puzzle string
        </h2>
        <p className="mb-3 text-sm text-stone-500 dark:text-zinc-400">
          Paste an 81-character string or a HoDoKu grid — use digits 1–9 and 0
          or . for empty cells.
        </p>
        <textarea
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-sm leading-relaxed text-stone-800 placeholder:text-stone-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:ring-blue-400"
          rows={3}
          placeholder=".1...3.942....5...7....82...67......1..4....6.4..81..5....72.....3....8.......1.3"
          value={puzzleInput}
          onChange={(e) => {
            setPuzzleInput(e.target.value);
            setPuzzleInputError('');
          }}
        />
        {puzzleInputError && (
          <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">
            {puzzleInputError}
          </p>
        )}
        <button
          className="bg-theme-primary hover:bg-theme-primary-dark active:bg-theme-primary-darker dark:bg-theme-primary-light dark:hover:bg-theme-primary dark:active:bg-theme-primary-dark mt-3 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!puzzleInput.trim()}
          onClick={handlePuzzleInputSubmit}
        >
          Import puzzle
        </button>
      </section>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-200 dark:bg-zinc-700" />
        <span className="text-xs font-medium tracking-wide text-stone-400 dark:text-zinc-500">
          or scan with camera
        </span>
        <div className="h-px flex-1 bg-stone-200 dark:bg-zinc-700" />
      </div>

      {/* ── Camera ─────────────────────────────────────────────── */}
      <section>
        <p className="mb-3 text-sm text-stone-500 dark:text-zinc-400">
          Point your camera at an unsolved sudoku puzzle and wait for it to be
          detected.
        </p>
        <div
          className="relative w-full overflow-hidden rounded-2xl"
          style={{ aspectRatio: '1 / 1' }}
        >
          <video
            ref={videoRef}
            width={videoWidth}
            height={videoHeight}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              background: 'black',
            }}
            playsInline
            muted
          />
          <div className="absolute inset-0">
            <SimpleSudoku
              final={emptyPuzzle}
              initial={emptyPuzzle}
              latest={emptyPuzzle}
              transparent={true}
            />
          </div>
        </div>
      </section>

      <Script
        src="/solve.js"
        onReady={() => {
          if ((window as any).Module) {
            if ((window as any).Module.onRuntimeInitialized) {
              ready();
            } else {
              (window as any).Module.onRuntimeInitialized = function () {
                ready();
              };
            }
          }
        }}
      />
    </main>
  );
}
