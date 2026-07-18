import { render, screen, fireEvent } from '@testing-library/react';
import RealNominalToggle, { modeLabel } from './RealNominalToggle';

describe('RealNominalToggle', () => {
  it('marks the active segment with aria-pressed', () => {
    render(<RealNominalToggle value="real" onChange={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Real' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Nominal' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('always shows a label naming the active mode', () => {
    const { rerender } = render(
      <RealNominalToggle value="real" onChange={jest.fn()} />
    );
    expect(screen.getByTestId('real-nominal-label')).toHaveTextContent(
      "Showing real values (today's money)"
    );
    rerender(<RealNominalToggle value="nominal" onChange={jest.fn()} />);
    expect(screen.getByTestId('real-nominal-label')).toHaveTextContent(
      'Showing nominal values (as recorded)'
    );
  });

  it('fires onChange with the clicked mode', () => {
    const onChange = jest.fn();
    render(<RealNominalToggle value="real" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Nominal' }));
    expect(onChange).toHaveBeenCalledWith('nominal');
    fireEvent.click(screen.getByRole('button', { name: 'Real' }));
    expect(onChange).toHaveBeenCalledWith('real');
  });

  describe('modeLabel', () => {
    it('names both modes', () => {
      expect(modeLabel('real')).toContain('real');
      expect(modeLabel('nominal')).toContain('nominal');
    });
  });
});
