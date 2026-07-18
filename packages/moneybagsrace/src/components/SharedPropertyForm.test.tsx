import { fireEvent, render, screen } from '@testing-library/react';
import { SharedPropertyForm, relativeTimeLabel } from './SharedPropertyForm';

describe('relativeTimeLabel', () => {
  const now = new Date('2026-07-17T12:00:00Z');

  it('handles the full range of units', () => {
    expect(relativeTimeLabel('2026-07-17T11:59:30Z', now)).toBe('just now');
    expect(relativeTimeLabel('2026-07-17T11:55:00Z', now)).toBe(
      '5 minutes ago'
    );
    expect(relativeTimeLabel('2026-07-17T10:59:00Z', now)).toBe('1 hour ago');
    expect(relativeTimeLabel('2026-07-14T12:00:00Z', now)).toBe('3 days ago');
  });
});

describe('SharedPropertyForm', () => {
  const defaultProps = {
    houseValuePence: 30_000_000,
    mortgageBalancePence: 10_000_000,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders house and mortgage inputs with derived equity', () => {
    render(<SharedPropertyForm {...defaultProps} />);
    expect(screen.getByLabelText('House value')).toHaveValue('£300,000');
    expect(screen.getByLabelText('Mortgage balance')).toHaveValue('£100,000');
    expect(screen.getByText('£200,000')).toBeInTheDocument();
  });

  it('reports house value edits alongside the current mortgage', () => {
    render(<SharedPropertyForm {...defaultProps} />);
    const input = screen.getByLabelText('House value');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '310000' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(31_000_000, 10_000_000);
  });

  it('reports mortgage edits alongside the current house value', () => {
    render(<SharedPropertyForm {...defaultProps} />);
    const input = screen.getByLabelText('Mortgage balance');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '99000' } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(30_000_000, 9_900_000);
  });

  it('shows the updated-by note when an effective entry exists', () => {
    render(
      <SharedPropertyForm
        {...defaultProps}
        updatedAt={new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()}
        updatedByNickname="Sam"
      />
    );
    expect(screen.getByText('Updated by Sam 3 hours ago')).toBeInTheDocument();
  });

  it('omits the note without an updatedAt', () => {
    render(<SharedPropertyForm {...defaultProps} updatedByNickname="Sam" />);
    expect(screen.queryByText(/Updated by/)).not.toBeInTheDocument();
  });
});
