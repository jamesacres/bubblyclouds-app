import { render } from '@testing-library/react';
import SudokuBoardPreview from './SudokuBoardPreview';

describe('SudokuBoardPreview', () => {
  it('renders as a decorative, hidden-from-screen-reader element', () => {
    const { container } = render(<SudokuBoardPreview />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders without crashing', () => {
    expect(() => render(<SudokuBoardPreview />)).not.toThrow();
  });
});
