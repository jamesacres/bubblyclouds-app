import { fireEvent, render, screen } from '@testing-library/react';
import { ToggleRow } from './ToggleRow';

describe('ToggleRow', () => {
  it('renders label and description', () => {
    render(
      <ToggleRow
        label="State pension"
        description="Include from state pension age"
        isEnabled={false}
        setEnabled={jest.fn()}
      />
    );
    expect(screen.getByText('State pension')).toBeInTheDocument();
    expect(
      screen.getByText('Include from state pension age')
    ).toBeInTheDocument();
  });

  it('omits the description when not given', () => {
    render(<ToggleRow label="Tax" isEnabled={false} setEnabled={jest.fn()} />);
    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('calls setEnabled with the flipped value when toggled', () => {
    const setEnabled = jest.fn();
    render(<ToggleRow label="Tax" isEnabled={false} setEnabled={setEnabled} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(setEnabled).toHaveBeenCalledWith(true);
  });

  it('reflects the enabled state', () => {
    render(<ToggleRow label="Tax" isEnabled setEnabled={jest.fn()} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });
});
