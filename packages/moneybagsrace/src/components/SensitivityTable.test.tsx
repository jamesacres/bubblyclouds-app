import { render, screen } from '@testing-library/react';
import SensitivityTable, { sensitivityCellLabel } from './SensitivityTable';

describe('SensitivityTable', () => {
  it('renders each nudge as a month label with the base for comparison', () => {
    render(
      <SensitivityTable
        result={{
          withdrawalPlus5k: '2043-09',
          withdrawalMinus5k: '2040-03',
          contributionsPlus500: '2040-11',
          contributionsMinus500: '2041-08',
        }}
        baseMonth="2041-03"
      />
    );
    expect(screen.getByTestId('sensitivity-base')).toHaveTextContent(
      'Mar 2041'
    );
    expect(screen.getByTestId('sensitivity-withdrawal-plus')).toHaveTextContent(
      'Sept 2043'
    );
    expect(
      screen.getByTestId('sensitivity-withdrawal-minus')
    ).toHaveTextContent('Mar 2040');
    expect(
      screen.getByTestId('sensitivity-contributions-plus')
    ).toHaveTextContent('Nov 2040');
    expect(
      screen.getByTestId('sensitivity-contributions-minus')
    ).toHaveTextContent('Aug 2041');
    expect(screen.getByText('Withdrawal (±£5,000/yr)')).toBeInTheDocument();
    expect(screen.getByText('Contributions (±£500/mo)')).toBeInTheDocument();
  });

  it('shows an em dash for unachievable variants and base', () => {
    render(
      <SensitivityTable
        result={{
          withdrawalMinus5k: '2040-03',
        }}
      />
    );
    expect(screen.getByTestId('sensitivity-base')).toHaveTextContent('—');
    expect(screen.getByTestId('sensitivity-withdrawal-plus')).toHaveTextContent(
      '—'
    );
    expect(
      screen.getByTestId('sensitivity-contributions-plus')
    ).toHaveTextContent('—');
    expect(
      screen.getByText('— means not achievable within the search window.')
    ).toBeInTheDocument();
  });

  describe('sensitivityCellLabel', () => {
    it('formats months and falls back to an em dash', () => {
      expect(sensitivityCellLabel('2041-03')).toBe('Mar 2041');
      expect(sensitivityCellLabel(undefined)).toBe('—');
    });
  });
});
