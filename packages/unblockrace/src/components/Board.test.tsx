import { render, screen, fireEvent } from '@testing-library/react';
import Board from './Board';
import { Move } from '../types/board';

const INITIAL = [
  'oooooo',
  'oooooo',
  'AAoBoo',
  'oooBoo',
  'oooooo',
  'oooxoo',
].join('');

// jsdom has no layout: give the board a measurable width so useDrag can
// convert pixels to cells (100px per cell on a 6x6 board)
const stubBoardWidth = () => {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    value: 600,
  });
};

beforeAll(() => {
  stubBoardWidth();
  HTMLElement.prototype.setPointerCapture =
    HTMLElement.prototype.setPointerCapture || jest.fn();
});

describe('Board', () => {
  it('renders every piece and wall', () => {
    render(<Board boardString={INITIAL} onMove={jest.fn()} />);
    expect(screen.getByTestId('piece-A')).toBeInTheDocument();
    expect(screen.getByTestId('piece-B')).toBeInTheDocument();
    expect(screen.getByTestId('wall-33')).toBeInTheDocument();
    expect(screen.getByTestId('exit-marker')).toBeInTheDocument();
  });

  it('commits a horizontal drag rounded to the nearest legal step', () => {
    const onMove = jest.fn();
    render(<Board boardString={INITIAL} onMove={onMove} />);
    const piece = screen.getByTestId('piece-A');

    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 50, clientY: 250 });
    fireEvent.pointerMove(piece, { pointerId: 1, clientX: 145, clientY: 250 });
    fireEvent.pointerUp(piece, { pointerId: 1, clientX: 145, clientY: 250 });

    expect(onMove).toHaveBeenCalledWith({ piece: 0, steps: 1 } as Move);
  });

  it('clamps a drag beyond the legal range', () => {
    const onMove = jest.fn();
    render(<Board boardString={INITIAL} onMove={onMove} />);
    const piece = screen.getByTestId('piece-A');

    // A can only move 1 step right before hitting B; drag 4 cells right
    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 50, clientY: 250 });
    fireEvent.pointerMove(piece, { pointerId: 1, clientX: 450, clientY: 250 });
    fireEvent.pointerUp(piece, { pointerId: 1, clientX: 450, clientY: 250 });

    expect(onMove).toHaveBeenCalledWith({ piece: 0, steps: 1 } as Move);
  });

  it('constrains vertical pieces to their axis', () => {
    const onMove = jest.fn();
    render(<Board boardString={INITIAL} onMove={onMove} />);
    const piece = screen.getByTestId('piece-B');

    // Horizontal movement on a vertical piece is ignored; only the vertical
    // delta (140px up = -1.4 cells, rounded to -1) drives the move. If the
    // horizontal delta leaked in it would commit +1 instead.
    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 350, clientY: 250 });
    fireEvent.pointerMove(piece, { pointerId: 1, clientX: 750, clientY: 110 });
    fireEvent.pointerUp(piece, { pointerId: 1, clientX: 750, clientY: 110 });

    expect(onMove).toHaveBeenCalledWith({ piece: 1, steps: -1 } as Move);
  });

  it('snaps back without committing when the drag rounds to zero', () => {
    const onMove = jest.fn();
    render(<Board boardString={INITIAL} onMove={onMove} />);
    const piece = screen.getByTestId('piece-A');

    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 50, clientY: 250 });
    fireEvent.pointerMove(piece, { pointerId: 1, clientX: 80, clientY: 250 });
    fireEvent.pointerUp(piece, { pointerId: 1, clientX: 80, clientY: 250 });

    expect(onMove).not.toHaveBeenCalled();
  });

  it('does not start drags when disabled', () => {
    const onMove = jest.fn();
    render(<Board boardString={INITIAL} onMove={onMove} isDisabled />);
    const piece = screen.getByTestId('piece-A');

    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 50, clientY: 250 });
    fireEvent.pointerMove(piece, { pointerId: 1, clientX: 145, clientY: 250 });
    fireEvent.pointerUp(piece, { pointerId: 1, clientX: 145, clientY: 250 });

    expect(onMove).not.toHaveBeenCalled();
  });

  it('cancels the drag on pointercancel', () => {
    const onMove = jest.fn();
    render(<Board boardString={INITIAL} onMove={onMove} />);
    const piece = screen.getByTestId('piece-A');

    fireEvent.pointerDown(piece, { pointerId: 1, clientX: 50, clientY: 250 });
    fireEvent.pointerMove(piece, { pointerId: 1, clientX: 145, clientY: 250 });
    fireEvent.pointerCancel(piece, { pointerId: 1 });

    expect(onMove).not.toHaveBeenCalled();
  });
});
