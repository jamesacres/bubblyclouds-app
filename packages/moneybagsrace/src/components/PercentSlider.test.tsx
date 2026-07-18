import { fireEvent, render, screen } from '@testing-library/react';
import { PercentSlider } from './PercentSlider';

describe('PercentSlider', () => {
  const defaultProps = {
    id: 'target-success',
    label: 'Target success rate',
    value: 90,
    onChange: jest.fn(),
    min: 50,
    max: 100,
    step: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the label, value and suffix', () => {
    render(<PercentSlider {...defaultProps} />);
    expect(screen.getByText('Target success rate')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('renders a range input with the given bounds', () => {
    render(<PercentSlider {...defaultProps} />);
    const slider = screen.getByLabelText('Target success rate');
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('min', '50');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('step', '1');
  });

  it('fires onChange with a number', () => {
    render(<PercentSlider {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('Target success rate'), {
      target: { value: '75' },
    });
    expect(defaultProps.onChange).toHaveBeenCalledWith(75);
  });

  it('supports a custom suffix', () => {
    render(<PercentSlider {...defaultProps} suffix=" yrs" />);
    expect(screen.getByText('90 yrs')).toBeInTheDocument();
  });
});
