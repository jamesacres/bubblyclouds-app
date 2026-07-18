import { fireEvent, render, screen } from '@testing-library/react';
import { CurrencyInput } from './CurrencyInput';

describe('CurrencyInput', () => {
  const defaultProps = {
    id: 'balance',
    label: 'Balance',
    valuePence: 123_456,
    onChangePence: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the formatted value when not editing', () => {
    render(<CurrencyInput {...defaultProps} />);
    expect(screen.getByLabelText('Balance')).toHaveValue('£1,234.56');
  });

  it('shows raw pence-accurate text while editing', () => {
    render(<CurrencyInput {...defaultProps} />);
    const input = screen.getByLabelText('Balance');
    fireEvent.focus(input);
    expect(input).toHaveValue('1234.56');
  });

  it('shows whole pounds without decimals while editing', () => {
    render(<CurrencyInput {...defaultProps} valuePence={500_000} />);
    const input = screen.getByLabelText('Balance');
    fireEvent.focus(input);
    expect(input).toHaveValue('5000');
  });

  it('parses typed pounds into pence', () => {
    render(<CurrencyInput {...defaultProps} />);
    const input = screen.getByLabelText('Balance');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '2,500.75' } });
    expect(defaultProps.onChangePence).toHaveBeenCalledWith(250_075);
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('treats an empty draft as zero', () => {
    render(<CurrencyInput {...defaultProps} />);
    const input = screen.getByLabelText('Balance');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    expect(defaultProps.onChangePence).toHaveBeenCalledWith(0);
  });

  it('keeps the last valid value and flags aria-invalid on bad input', () => {
    render(<CurrencyInput {...defaultProps} />);
    const input = screen.getByLabelText('Balance');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(defaultProps.onChangePence).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects negative input unless allowNegative is set', () => {
    render(<CurrencyInput {...defaultProps} />);
    const input = screen.getByLabelText('Balance');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '-50' } });
    expect(defaultProps.onChangePence).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts negative input when allowNegative is set', () => {
    render(<CurrencyInput {...defaultProps} allowNegative />);
    const input = screen.getByLabelText('Balance');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '-50' } });
    expect(defaultProps.onChangePence).toHaveBeenCalledWith(-5000);
  });

  it('formats again on blur and clears the invalid flag', () => {
    const onBlur = jest.fn();
    render(<CurrencyInput {...defaultProps} onBlur={onBlur} />);
    const input = screen.getByLabelText('Balance');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    expect(input).toHaveValue('£1,234.56');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(onBlur).toHaveBeenCalled();
  });

  it('shows negative editing text with pence', () => {
    render(
      <CurrencyInput {...defaultProps} valuePence={-12_345} allowNegative />
    );
    const input = screen.getByLabelText('Balance');
    fireEvent.focus(input);
    expect(input).toHaveValue('-123.45');
  });
});
