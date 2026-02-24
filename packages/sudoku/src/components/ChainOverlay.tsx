import {
  memo,
  ReactElement,
  RefObject,
  useLayoutEffect,
  useState,
} from 'react';
import { ChainNode } from '../types/ChainNode';

interface Point {
  x: number;
  y: number;
}

interface Arguments {
  chainPath: ChainNode[];
  gridRef: RefObject<HTMLDivElement | null>;
}

const ON_COLOUR = '#60a5fa'; // blue
const OFF_COLOUR = '#4ade80'; // green

const nodeColourHex = (isOn: boolean) => (isOn ? ON_COLOUR : OFF_COLOUR);

const moveAlong = (p1: Point, p2: Point, dist: number): Point => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return p1;
  return { x: p1.x + (dx / len) * dist, y: p1.y + (dy / len) * dist };
};

const perpUnit = (p1: Point, p2: Point): Point => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 1 };
  return { x: -dy / len, y: dx / len };
};

const measureCells = (el: HTMLDivElement): Point[] => {
  const gridRect = el.getBoundingClientRect();
  const cellMap = new Map<string, DOMRect>();
  el.querySelectorAll('[data-cell-container-id]').forEach((cellEl) => {
    cellMap.set(
      cellEl.getAttribute('data-cell-container-id')!,
      cellEl.getBoundingClientRect()
    );
  });
  const rects: (DOMRect | null)[] = [];
  for (let idx = 0; idx < 81; idx++) {
    const row = Math.floor(idx / 9);
    const col = idx % 9;
    const boxX = Math.floor(col / 3);
    const boxY = Math.floor(row / 3);
    const cellX = col % 3;
    const cellY = row % 3;
    const cellId = `box:${boxX},${boxY},cell:${cellX},${cellY}`;
    rects.push(cellMap.get(cellId) ?? null);
  }
  return rects.map((r) =>
    r
      ? {
          x: r.left - gridRect.left + r.width / 2,
          y: r.top - gridRect.top + r.height / 2,
        }
      : { x: 0, y: 0 }
  );
};

// Position of a specific digit within a cell's 3×3 notes grid.
// Digits 1-9 are laid out left-to-right, top-to-bottom.
// Returns centre of that digit's sub-cell.
const digitCentre = (
  cellCentre: Point,
  cellSize: number,
  digit: number
): Point => {
  const subSize = cellSize / 3;
  const col = (digit - 1) % 3; // 0,1,2
  const row = Math.floor((digit - 1) / 3); // 0,1,2
  return {
    x: cellCentre.x - cellSize / 2 + subSize * (col + 0.5),
    y: cellCentre.y - cellSize / 2 + subSize * (row + 0.5),
  };
};

// For a group node (multiple cells, same digit) return the average digit position.
const groupDigitCentre = (
  cells: number[],
  digit: number,
  cellCentres: Point[],
  cellSize: number
): Point => {
  const pts = cells.map((c) => digitCentre(cellCentres[c], cellSize, digit));
  return {
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  };
};

// Half-size of the digit highlight box (slightly larger than one sub-cell)
const BOX_HALF = 0.19; // relative to cellSize

// Build SVG path for one arrow segment.
// Uses straight lines; parallel duplicates are laterally offset.
// Diagonal segments use an L-shaped orthogonal route.
const buildPath = (
  p1: Point,
  p2: Point,
  laneOffset: number,
  startGap: number,
  endGap: number
): string => {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const isDiagonal = dx > 4 && dy > 4;
  const isParallel = Math.abs(laneOffset) > 1;

  if (isParallel) {
    const pu = perpUnit(p1, p2);
    const op1 = { x: p1.x + pu.x * laneOffset, y: p1.y + pu.y * laneOffset };
    const op2 = { x: p2.x + pu.x * laneOffset, y: p2.y + pu.y * laneOffset };
    const start = moveAlong(op1, op2, startGap);
    const end = moveAlong(op2, op1, endGap);
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  if (isDiagonal) {
    const hSign = Math.sign(p2.x - p1.x);
    const vSign = Math.sign(p2.y - p1.y);
    const corner: Point = { x: p2.x, y: p1.y };
    const clampedStart = Math.min(startGap, dx * 0.85);
    const clampedEnd = Math.min(endGap, dy * 0.85);
    const start: Point = { x: p1.x + hSign * clampedStart, y: p1.y };
    const end: Point = { x: p2.x, y: p2.y - vSign * clampedEnd };
    return `M ${start.x} ${start.y} L ${corner.x} ${corner.y} L ${end.x} ${end.y}`;
  }

  const totalDist = Math.sqrt(dx * dx + dy * dy);
  const cs = Math.min(startGap, totalDist * 0.42);
  const ce = Math.min(endGap, totalDist * 0.42);
  const start = moveAlong(p1, p2, cs);
  const end = moveAlong(p2, p1, ce);
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
};

const ChainOverlay = ({ chainPath, gridRef }: Arguments) => {
  const [cellCentres, setCellCentres] = useState<Point[]>([]);

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el || chainPath.length < 2) return;
    setCellCentres(measureCells(el));
  }, [chainPath, gridRef]);

  if (chainPath.length < 2 || cellCentres.length < 81) return null;
  if (!cellCentres.some((p) => p.x > 0 || p.y > 0)) return null;

  const cellSize = cellCentres[58].x - cellCentres[57].x;
  const subSize = cellSize / 3;
  const boxHalf = cellSize * BOX_HALF;
  const strokeW = cellSize * 0.04;
  const gridW = Math.max(...cellCentres.map((p) => p.x)) + cellSize / 2;
  const gridH = Math.max(...cellCentres.map((p) => p.y)) + cellSize / 2;
  // Gap between arrowhead and digit box edge
  const arrowGap = boxHalf + strokeW * 1.5;

  // Collapse same-cell digit-switch pairs into single segments
  interface Segment {
    from: ChainNode;
    to: ChainNode;
    linkType: 'strong' | 'weak';
    isOn: boolean;
  }
  const segs: Segment[] = [];
  let j = 0;
  while (j < chainPath.length - 1) {
    const from = chainPath[j];
    const to = chainPath[j + 1];
    const sameCell =
      from.cells === undefined &&
      to.cells === undefined &&
      from.cell === to.cell;
    if (sameCell && j + 2 < chainPath.length) {
      segs.push({
        from,
        to: chainPath[j + 2],
        linkType: to.linkToNext ?? 'weak',
        isOn: from.isOn,
      });
      j += 2;
    } else {
      segs.push({
        from,
        to,
        linkType: from.linkToNext ?? 'weak',
        isOn: from.isOn,
      });
      j += 1;
    }
  }

  const segKey = (p1: Point, p2: Point) => {
    const a = `${Math.round(p1.x)},${Math.round(p1.y)}`;
    const b = `${Math.round(p2.x)},${Math.round(p2.y)}`;
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  };

  const segPoints = segs.map((seg) => ({
    p1: seg.from.cells
      ? groupDigitCentre(seg.from.cells, seg.from.digit, cellCentres, cellSize)
      : digitCentre(cellCentres[seg.from.cell], cellSize, seg.from.digit),
    p2: seg.to.cells
      ? groupDigitCentre(seg.to.cells, seg.to.digit, cellCentres, cellSize)
      : digitCentre(cellCentres[seg.to.cell], cellSize, seg.to.digit),
  }));

  const pairCount = new Map<string, number>();
  const pairIndex = new Map<string, number>();
  for (const { p1, p2 } of segPoints) {
    const k = segKey(p1, p2);
    pairCount.set(k, (pairCount.get(k) ?? 0) + 1);
  }

  const elements: ReactElement[] = [];

  // Draw digit highlight boxes for each node in the chain
  const drawnBoxKeys = new Set<string>();
  for (let ni = 0; ni < chainPath.length; ni++) {
    const node = chainPath[ni];
    const isEndpoint = ni === 0 || ni === chainPath.length - 1;
    const cellsForNode = node.cells ?? [node.cell];

    for (const cell of cellsForNode) {
      const boxKey = `${cell}-${node.digit}`;
      if (drawnBoxKeys.has(boxKey)) continue;
      drawnBoxKeys.add(boxKey);

      const dc = digitCentre(cellCentres[cell], cellSize, node.digit);
      const colour = nodeColourHex(node.isOn);

      elements.push(
        <rect
          key={`box-${boxKey}-${ni}`}
          x={dc.x - boxHalf}
          y={dc.y - boxHalf}
          width={boxHalf * 2}
          height={boxHalf * 2}
          rx={strokeW * 0.8}
          ry={strokeW * 0.8}
          fill={`${colour}33`}
          stroke={colour}
          strokeWidth={isEndpoint ? strokeW * 1.8 : strokeW * 1.1}
          opacity={isEndpoint ? 1 : 0.8}
        />
      );
    }

    // Group bracket for group nodes
    if (node.cells && node.cells.length > 1) {
      const groupKey = node.cells
        .slice()
        .sort((a, b) => a - b)
        .join(',');
      if (!drawnBoxKeys.has(`group-${groupKey}`)) {
        drawnBoxKeys.add(`group-${groupKey}`);
        const pts = node.cells.map((c) =>
          digitCentre(cellCentres[c], cellSize, node.digit)
        );
        const minX = Math.min(...pts.map((p) => p.x)) - boxHalf - strokeW;
        const maxX = Math.max(...pts.map((p) => p.x)) + boxHalf + strokeW;
        const minY = Math.min(...pts.map((p) => p.y)) - boxHalf - strokeW;
        const maxY = Math.max(...pts.map((p) => p.y)) + boxHalf + strokeW;
        elements.push(
          <rect
            key={`group-bracket-${groupKey}-${ni}`}
            x={minX}
            y={minY}
            width={maxX - minX}
            height={maxY - minY}
            rx={strokeW}
            ry={strokeW}
            fill="none"
            stroke={nodeColourHex(node.isOn)}
            strokeWidth={strokeW * 1.2}
            strokeDasharray={`${subSize * 0.3} ${subSize * 0.15}`}
            opacity={0.7}
          />
        );
      }
    }
  }

  // Draw arrows
  for (let i = 0; i < segs.length; i++) {
    const { linkType, isOn } = segs[i];
    const isStrong = linkType === 'strong';
    const colour = nodeColourHex(isOn);
    const markerId = `arrow-${i}`;

    const { p1, p2 } = segPoints[i];
    const k = segKey(p1, p2);
    const idx = pairIndex.get(k) ?? 0;
    pairIndex.set(k, idx + 1);
    const total = pairCount.get(k) ?? 1;
    const laneOffset = total > 1 ? (idx - (total - 1) / 2) * strokeW * 2.5 : 0;

    const d = buildPath(p1, p2, laneOffset, arrowGap, arrowGap);

    elements.push(
      <g key={i}>
        <defs>
          <marker
            id={markerId}
            markerWidth="5"
            markerHeight="4"
            refX="4.5"
            refY="2"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 5 2, 0 4" fill={colour} />
          </marker>
        </defs>
        <path
          d={d}
          fill="none"
          stroke="rgba(0,0,0,0.15)"
          strokeWidth={strokeW * 2}
          strokeLinecap="round"
          strokeLinejoin="miter"
        />
        <path
          d={d}
          fill="none"
          stroke={colour}
          strokeWidth={strokeW}
          strokeDasharray={
            isStrong ? undefined : `${subSize * 0.35} ${subSize * 0.2}`
          }
          strokeLinecap="round"
          strokeLinejoin="miter"
          markerEnd={`url(#${markerId})`}
        />
      </g>
    );
  }

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={gridW}
      height={gridH}
      viewBox={`0 0 ${gridW} ${gridH}`}
      overflow="visible"
    >
      {elements}
    </svg>
  );
};

export default memo(ChainOverlay);
