import React, { createRef } from 'react';
import { render } from '@testing-library/react';
import { ChainNode } from 'human-sudoku-solver';
import ChainOverlay from './ChainOverlay';

const CELL_SIZE = 40;

// Builds a grid DOM matching the `box:${boxX},${boxY},cell:${cellX},${cellY}`
// data-cell-container-id format that measureCells() in ChainOverlay looks for,
// and stubs getBoundingClientRect so each of the 81 cells reports a real,
// distinct position (mirroring an actual 9x9 grid layout).
const renderGrid = (): { gridRef: React.RefObject<HTMLDivElement | null> } => {
  const gridRef = createRef<HTMLDivElement>();

  const Grid = () => {
    const boxes = [];
    for (let boxX = 0; boxX < 3; boxX++) {
      for (let boxY = 0; boxY < 3; boxY++) {
        for (let cellX = 0; cellX < 3; cellX++) {
          for (let cellY = 0; cellY < 3; cellY++) {
            const col = boxX * 3 + cellX;
            const row = boxY * 3 + cellY;
            boxes.push(
              <div
                key={`${boxX}-${boxY}-${cellX}-${cellY}`}
                data-cell-container-id={`box:${boxX},${boxY},cell:${cellX},${cellY}`}
                data-col={col}
                data-row={row}
              />
            );
          }
        }
      }
    }
    return <div ref={gridRef}>{boxes}</div>;
  };

  render(<Grid />);

  const gridEl = gridRef.current!;
  jest.spyOn(gridEl, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 360,
    bottom: 360,
    width: 360,
    height: 360,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

  gridEl.querySelectorAll('[data-cell-container-id]').forEach((cellEl) => {
    const col = Number(cellEl.getAttribute('data-col'));
    const row = Number(cellEl.getAttribute('data-row'));
    const left = col * CELL_SIZE;
    const top = row * CELL_SIZE;
    jest.spyOn(cellEl, 'getBoundingClientRect').mockReturnValue({
      left,
      top,
      right: left + CELL_SIZE,
      bottom: top + CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
      x: left,
      y: top,
      toJSON: () => ({}),
    });
  });

  return { gridRef };
};

const node = (
  cell: number,
  digit: number,
  isOn: boolean,
  linkToNext?: 'strong' | 'weak'
): ChainNode => ({ cell, digit, isOn, linkToNext });

describe('ChainOverlay', () => {
  it('renders nothing when the chain path has fewer than 2 nodes', () => {
    const { gridRef } = renderGrid();
    const { container } = render(
      <ChainOverlay chainPath={[node(0, 1, true)]} gridRef={gridRef} />
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders nothing when the chain path is empty', () => {
    const { gridRef } = renderGrid();
    const { container } = render(
      <ChainOverlay chainPath={[]} gridRef={gridRef} />
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders nothing when the grid ref has no element yet', () => {
    const gridRef = createRef<HTMLDivElement>();
    const { container } = render(
      <ChainOverlay
        chainPath={[node(0, 1, true), node(1, 1, false)]}
        gridRef={gridRef}
      />
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders an svg with digit boxes and an arrow for a simple 2-node chain', () => {
    const { gridRef } = renderGrid();
    const chainPath: ChainNode[] = [
      node(0, 5, true),
      node(9, 5, false, 'strong'),
    ];

    const { container } = render(
      <ChainOverlay chainPath={chainPath} gridRef={gridRef} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(2);

    const paths = container.querySelectorAll('path');
    // Each arrow draws two overlapping paths (shadow + coloured stroke)
    expect(paths.length).toBe(2);
  });

  it('uses solid strokeDasharray-free lines for strong links and dashed for weak links', () => {
    const { gridRef } = renderGrid();
    // linkType for a segment comes from the FIRST node's linkToNext.
    const strongChain: ChainNode[] = [
      node(0, 5, true, 'strong'),
      node(9, 5, false),
    ];
    const weakChain: ChainNode[] = [
      node(0, 5, true, 'weak'),
      node(9, 5, false),
    ];

    const { container: strongContainer } = render(
      <ChainOverlay chainPath={strongChain} gridRef={gridRef} />
    );
    const strongColouredPath = strongContainer.querySelectorAll('path')[1];
    expect(strongColouredPath).not.toHaveAttribute('stroke-dasharray');

    const { container: weakContainer } = render(
      <ChainOverlay chainPath={weakChain} gridRef={gridRef} />
    );
    const weakColouredPath = weakContainer.querySelectorAll('path')[1];
    expect(weakColouredPath).toHaveAttribute('stroke-dasharray');
  });

  it('renders a dashed group bracket for group nodes spanning multiple cells', () => {
    const { gridRef } = renderGrid();
    const chainPath: ChainNode[] = [
      { cell: 0, cells: [0, 1], digit: 3, isOn: true, linkToNext: 'strong' },
      node(20, 3, false),
    ];

    const { container } = render(
      <ChainOverlay chainPath={chainPath} gridRef={gridRef} />
    );

    const dashedRects = Array.from(container.querySelectorAll('rect')).filter(
      (r) => r.getAttribute('stroke-dasharray')
    );
    expect(dashedRects.length).toBe(1);
  });

  it('collapses same-cell digit-switch pairs into a single segment', () => {
    const { gridRef } = renderGrid();
    // Node 0 and 1 are on the same cell (digit switch), node 2 is elsewhere.
    // This should collapse into ONE segment (0 -> 2) rather than two (0->1, 1->2).
    const chainPath: ChainNode[] = [
      node(4, 2, true),
      node(4, 7, false, 'weak'),
      node(13, 7, true, 'strong'),
    ];

    const { container } = render(
      <ChainOverlay chainPath={chainPath} gridRef={gridRef} />
    );

    const paths = container.querySelectorAll('path');
    // One collapsed segment => 2 path elements (shadow + stroke)
    expect(paths.length).toBe(2);
  });

  it('offsets parallel segments between the same pair of cells', () => {
    const { gridRef } = renderGrid();
    // Two distinct chains passing between the same pair of cells, each using
    // a different digit so they represent genuinely different segments that
    // happen to connect the same two grid cells.
    const chainPath: ChainNode[] = [
      node(0, 1, true),
      node(9, 1, false, 'strong'),
      node(9, 2, true, 'weak'),
      node(0, 2, false, 'strong'),
    ];

    const { container } = render(
      <ChainOverlay chainPath={chainPath} gridRef={gridRef} />
    );

    const paths = container.querySelectorAll('path');
    // Two segments => 4 path elements
    expect(paths.length).toBe(4);
  });

  it('marks the first and last chain nodes as endpoints with a thicker stroke', () => {
    const { gridRef } = renderGrid();
    const chainPath: ChainNode[] = [
      node(0, 5, true),
      node(40, 5, false, 'weak'),
      node(9, 5, true, 'strong'),
    ];

    const { container } = render(
      <ChainOverlay chainPath={chainPath} gridRef={gridRef} />
    );

    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBe(3);
    const endpointStroke = rects[0].getAttribute('stroke-width');
    const middleStroke = rects[1].getAttribute('stroke-width');
    expect(Number(endpointStroke)).toBeGreaterThan(Number(middleStroke));
  });
});
