#!/usr/bin/env node
// One-off import step (SPEC.md §8): reads Michael Fogleman's rush puzzle
// database (https://www.michaelfogleman.com/static/rush/rush.txt.gz,
// gunzipped) and emits a curated static JSON fixture spanning a spread of
// move counts. Not part of the app bundle.
//
// Usage: node scripts/generateMockPuzzles.mjs /path/to/rush.txt

import { createInterface } from 'node:readline';
import { createReadStream, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIN_MOVES = 4;
const MAX_MOVES = 50;
const PER_MOVE_COUNT = 8;

const inputPath = process.argv[2];
if (!inputPath) {
  console.error(
    'Usage: node scripts/generateMockPuzzles.mjs /path/to/rush.txt'
  );
  process.exit(1);
}

// Relabel pieces consecutively (A, B, C, ...) preserving alphabetical
// order, matching parseBoardString + boardToString's canonical form — the
// board string doubles as the puzzle id, so the fixture must round-trip.
const normalize = (boardString) => {
  const labels = Array.from(
    new Set(boardString.split('').filter((c) => /[A-Z]/.test(c)))
  ).sort();
  const mapping = new Map(
    labels.map((label, i) => [label, String.fromCharCode(65 + i)])
  );
  return boardString
    .split('')
    .map((c) => mapping.get(c) || c)
    .join('');
};

const buckets = new Map();

const rl = createInterface({ input: createReadStream(inputPath) });
for await (const line of rl) {
  const [movesText, boardString, clusterSizeText] = line.trim().split(/\s+/);
  const movesRequired = Number(movesText);
  if (
    !boardString ||
    boardString.length !== 36 ||
    Number.isNaN(movesRequired) ||
    movesRequired < MIN_MOVES ||
    movesRequired > MAX_MOVES
  ) {
    continue;
  }
  const bucket = buckets.get(movesRequired) || [];
  if (bucket.length < PER_MOVE_COUNT) {
    bucket.push({
      boardString: normalize(boardString),
      movesRequired,
      clusterSize: Number(clusterSizeText) || 0,
    });
    buckets.set(movesRequired, bucket);
  }
}

const puzzles = Array.from(buckets.keys())
  .sort((a, b) => a - b)
  .flatMap((moves) => buckets.get(moves));

const outPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'mockData',
  'puzzles.json'
);
writeFileSync(outPath, `${JSON.stringify(puzzles, null, 2)}\n`);
console.log(`Wrote ${puzzles.length} puzzles to ${outPath}`);
