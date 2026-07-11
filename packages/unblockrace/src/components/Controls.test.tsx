import { render, screen, fireEvent } from '@testing-library/react';
import Controls from './Controls';

const defaultProps = {
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

  it('renders the undo/redo/reset toolbar', () => {
    render(<Controls {...defaultProps} />);
    expect(screen.getByTestId('controls-toolbar')).toBeInTheDocument();
    expect(screen.getByLabelText('Undo')).toBeInTheDocument();
    expect(screen.getByLabelText('Redo')).toBeInTheDocument();
    expect(screen.getByLabelText('Reset')).toBeInTheDocument();
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

  it('disables every button when the puzzle is complete', () => {
    render(<Controls {...defaultProps} isDisabled />);
    expect(screen.getByLabelText('Undo')).toBeDisabled();
    expect(screen.getByLabelText('Redo')).toBeDisabled();
    expect(screen.getByLabelText('Reset')).toBeDisabled();
  });

  it('omits the hint button when no handler is wired', () => {
    render(<Controls {...defaultProps} />);
    expect(screen.queryByLabelText('Hint')).not.toBeInTheDocument();
  });

  it('renders the hint button and fires onHint when clicked', () => {
    const onHint = jest.fn();
    render(<Controls {...defaultProps} onHint={onHint} />);
    fireEvent.click(screen.getByLabelText('Hint'));
    expect(onHint).toHaveBeenCalled();
  });

  it('disables the hint button when hints are unavailable', () => {
    const onHint = jest.fn();
    render(<Controls {...defaultProps} onHint={onHint} isHintDisabled />);
    const hintButton = screen.getByLabelText('Hint');
    expect(hintButton).toBeDisabled();
    fireEvent.click(hintButton);
    expect(onHint).not.toHaveBeenCalled();
  });

  it('disables the hint button when the whole toolbar is disabled', () => {
    render(<Controls {...defaultProps} onHint={jest.fn()} isDisabled />);
    expect(screen.getByLabelText('Hint')).toBeDisabled();
  });
});
