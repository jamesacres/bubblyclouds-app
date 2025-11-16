'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  Solver,
  VideoReadyPayload,
} from '../../augmentedReality/Processor';
import type Processor from '../../augmentedReality/Processor';
import { useRouter } from 'next/navigation';
import SimpleSudoku from '@sudoku-web/sudoku/components/SimpleSudoku';
import { emptyPuzzle } from '@sudoku-web/sudoku/types/puzzle';
import { buildPuzzleUrl } from '@sudoku-web/sudoku/helpers/buildPuzzleUrl';

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

  function videoReadyListener({ width, height }: VideoReadyPayload) {
    setVideoWidth(width);
    setVideoHeight(height);
  }

  useEffect(() => {
    if (puzzleStrings) {
      // After identifying puzzle redirect
      processor = undefined;
      solver = undefined;
      router.replace(
        buildPuzzleUrl(puzzleStrings.initial, puzzleStrings.final, {
          scannedAt: new Date().toISOString(),
        })
      );
    }
  }, [router, puzzleStrings]);

  // start the video playing
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;

      (async () => {
        if (!processor) {
          processor = new (
            await import('../../augmentedReality/Processor')
          ).default();

          // update the video scale as needed
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

  const ready = useCallback(() => {
    solver = (boxes: { x: number; y: number; contents: number }[]) => {
      const MAX = 8;
      let lastX = -1;
      let lastY = 0;
      // Example '.1...3.942....5...7....82...67......1..4....6.4..81..5....72.....3....8.......1.3'
      let boxesString = boxes.reduce((result, { x, y, contents }) => {
        let newResult = result;
        if (y !== lastY) {
          // Add empty squares to end of last row
          newResult = `${newResult}${[...new Array(MAX - lastX)].map((_) => '.').join('')}`;
          lastX = -1;
        }
        if (x > 0) {
          // Add empty squares for skipped
          newResult = `${newResult}${[...new Array(x - lastX - 1)].map((_) => '.').join('')}`;
        }
        lastX = x;
        lastY = y;
        return `${newResult}${contents}`;
      }, '');
      // Add empty strings until the end
      boxesString = `${boxesString}${[...new Array(81 - boxesString.length)].map((_) => '.').join('')}`;

      const thisSolution = (window as any).Module.ccall(
        'solve',
        'string',
        ['string'],
        [boxesString]
      );
      if (thisSolution && thisSolution.length === 81) {
        setPuzzleStrings({
          initial: boxesString,
          final: thisSolution,
        });
        return thisSolution;
      }
    };
    if (processor) {
      processor.setSolver(solver);
    }
  }, []);
  return (
    <>
      <div className="container mx-auto max-w-(--breakpoint-sm)">
        <p className="m-4">
          Simply point your camera at an unsolved sudoku puzzle and wait for it
          to be detected.
        </p>
        <div style={{ height: '100vh', position: 'relative' }}>
          <video
            ref={videoRef}
            className="aspect-square max-w-xl"
            width={videoWidth}
            height={videoHeight}
            style={{
              width: '100%',
              objectFit: 'cover',
              background: 'black',
              overflow: 'hidden',
            }}
            playsInline
            muted
          />
          <div
            className="aspect-square max-w-xl"
            style={{
              width: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <SimpleSudoku
              final={emptyPuzzle}
              initial={emptyPuzzle}
              latest={emptyPuzzle}
              transparent={true}
            />
          </div>
        </div>
        <Script
          src="/solve.js" // Copyright (c) 2019, Tom Dillon https://github.com/t-dillon/tdoku
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
      </div>
    </>
  );
}
