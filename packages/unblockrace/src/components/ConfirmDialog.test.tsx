import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

const defaultProps = {
  isOpen: true,
  title: 'Retry this stage?',
  body: 'Your current time and moves will be replaced.',
  confirmLabel: 'Retry',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

describe('ConfirmDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('renders the title, body and confirm label when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Retry this stage?')).toBeInTheDocument();
    expect(
      screen.getByText('Your current time and moves will be replaced.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('confirm-dialog-confirm')).toHaveTextContent(
      'Retry'
    );
  });

  it('fires onConfirm when the confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('confirm-dialog-confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it('fires onCancel from the Cancel button and the backdrop', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByTestId('confirm-dialog-cancel'));
    fireEvent.click(screen.getByTestId('confirm-dialog'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(2);
  });

  it('does not close when the inner panel is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Retry this stage?'));
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });
});
