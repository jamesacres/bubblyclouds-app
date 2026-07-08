import { render, screen, fireEvent } from '@testing-library/react';
import Controls from './Controls';

const defaultProps = {
  movesMade: 3,
  movesRequired: 10,
  undo: jest.fn(),
  redo: jest.fn(),
  reset: jest.fn(),
  isUndoDisabled: false,
  isRedoDisabled: true,
};

describe('Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows moves made and required separately', () => {
    render(<Controls {...defaultProps} />);
    expect(screen.getByTestId('move-counter')).toHaveTextContent(
      '3/10 moves ⚡'
    );
  });

  it('adds a warning affordance over par instead of clamping', () => {
    render(<Controls {...defaultProps} movesMade={12} />);
    expect(screen.getByTestId('move-counter')).toHaveTextContent('12/10');
    expect(screen.getByLabelText('Over optimal moves')).toBeInTheDocument();
  });

  it('omits the required count when unknown', () => {
    render(<Controls {...defaultProps} movesRequired={0} />);
    expect(screen.getByTestId('move-counter')).toHaveTextContent('3');
    expect(screen.getByTestId('move-counter')).not.toHaveTextContent('/');
  });

  it('wires undo, redo and reset buttons', () => {
    render(<Controls {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Undo'));
    fireEvent.click(screen.getByLabelText('Reset'));
    expect(defaultProps.undo).toHaveBeenCalled();
    expect(defaultProps.reset).toHaveBeenCalled();
  });

  it('disables redo when there is nothing to redo', () => {
    render(<Controls {...defaultProps} />);
    expect(screen.getByLabelText('Redo')).toBeDisabled();
  });
});
