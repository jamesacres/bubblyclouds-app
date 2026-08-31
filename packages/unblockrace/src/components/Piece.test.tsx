import { render, screen } from '@testing-library/react';
import Piece from './Piece';

const HORIZONTAL_PRIMARY = {
  position: 8,
  size: 2,
  orientation: 'horizontal' as const,
};

describe('Piece', () => {
  it('does not apply an exit transform on the first paint', () => {
    render(<Piece piece={HORIZONTAL_PRIMARY} index={0} width={6} height={6} />);
    const piece = screen.getByTestId('piece-A');
    expect(piece.style.transform).toBe('');
  });

  it('defers the exit transform to the next frame so the resting position paints first', () => {
    const { rerender } = render(
      <Piece piece={HORIZONTAL_PRIMARY} index={0} width={6} height={6} />
    );
    const piece = screen.getByTestId('piece-A');

    rerender(
      <Piece
        piece={HORIZONTAL_PRIMARY}
        index={0}
        width={6}
        height={6}
        isExiting
      />
    );

    // Immediately after isExiting flips true, the piece is still at its
    // resting position — this is the frame the browser needs in order to
    // interpolate the transition instead of snapping straight to the exit
    expect(piece.style.transform).toBe('');
  });

  it('applies the exit transform once the animation frame fires', async () => {
    jest.useFakeTimers();
    const rafSpy = jest
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        cb(0);
        return 0;
      });

    render(
      <Piece
        piece={HORIZONTAL_PRIMARY}
        index={0}
        width={6}
        height={6}
        isExiting
      />
    );

    const piece = screen.getByTestId('piece-A');
    expect(piece.style.transform).toContain('translate3d');

    rafSpy.mockRestore();
    jest.useRealTimers();
  });
});
