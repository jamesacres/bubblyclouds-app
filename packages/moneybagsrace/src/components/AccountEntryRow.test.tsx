import { fireEvent, render, screen } from '@testing-library/react';
import { AccountKind, InvestmentWrapper } from '../types/accounts';
import { AccountEntryRow } from './AccountEntryRow';

describe('AccountEntryRow', () => {
  const defaultProps = {
    accountId: 'isa-1',
    kind: AccountKind.INVESTMENT,
    wrapper: InvestmentWrapper.ISA,
    name: 'Vanguard ISA',
    balancePence: 1_000_000,
    onChangeBalance: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the name and wrapper badge', () => {
    render(<AccountEntryRow {...defaultProps} />);
    expect(screen.getByText('Vanguard ISA')).toBeInTheDocument();
    expect(screen.getByText('ISA')).toBeInTheDocument();
  });

  it('uses the kind label for non-investment accounts', () => {
    render(
      <AccountEntryRow
        {...defaultProps}
        kind={AccountKind.CASH}
        wrapper={undefined}
        name="Monzo"
      />
    );
    expect(screen.getByText('Cash')).toBeInTheDocument();
  });

  it('labels credit cards as amount owed', () => {
    render(
      <AccountEntryRow
        {...defaultProps}
        kind={AccountKind.CREDIT_CARD}
        wrapper={undefined}
      />
    );
    expect(screen.getByLabelText('Amount owed')).toBeInTheDocument();
  });

  it('shows the previous month hint when given', () => {
    render(
      <AccountEntryRow {...defaultProps} previousBalancePence={950_000} />
    );
    expect(screen.getByText('Last month: £9,500.00')).toBeInTheDocument();
  });

  it('omits the previous month hint when not given', () => {
    render(<AccountEntryRow {...defaultProps} />);
    expect(screen.queryByText(/Last month/)).not.toBeInTheDocument();
  });

  it('propagates balance edits in pence', () => {
    render(<AccountEntryRow {...defaultProps} />);
    const input = screen.getByLabelText('Current balance');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12345.67' } });
    expect(defaultProps.onChangeBalance).toHaveBeenCalledWith(1_234_567);
  });

  it('commits on blur so the page can autosave', () => {
    const onCommit = jest.fn();
    render(<AccountEntryRow {...defaultProps} onCommit={onCommit} />);
    const input = screen.getByLabelText('Current balance');
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
