import { fireEvent, render, screen } from '@testing-library/react';
import { HouseholdAssumptions } from '../types/assumptions';
import { AssumptionsForm } from './AssumptionsForm';

describe('AssumptionsForm', () => {
  const onChange = jest.fn();
  const assumptions: HouseholdAssumptions = {
    inflationRatePct: 2.5,
    returnScenarios: { lowerRealPct: 2, centralRealPct: 5, upperRealPct: 7 },
    taxBands: [
      { thresholdPence: 0, ratePct: 0 },
      { thresholdPence: 1_257_000, ratePct: 20 },
      { thresholdPence: 5_027_000, ratePct: 40 },
    ],
    statePensionAnnualPence: 1_197_300,
    targetSuccessRatePct: 90,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderForm = () =>
    render(<AssumptionsForm assumptions={assumptions} onChange={onChange} />);

  it('renders all assumption fields', () => {
    renderForm();
    expect(screen.getByLabelText('Inflation rate')).toHaveValue(2.5);
    expect(screen.getByLabelText('Lower real return')).toHaveValue(2);
    expect(screen.getByLabelText('Central real return')).toHaveValue(5);
    expect(screen.getByLabelText('Upper real return')).toHaveValue(7);
    expect(screen.getByLabelText('State pension (annual, full)')).toHaveValue(
      '£11,973'
    );
    expect(screen.getByLabelText('Target success rate')).toHaveValue('90');
  });

  it('updates the inflation rate', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Inflation rate'), {
      target: { value: '3' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...assumptions,
      inflationRatePct: 3,
    });
  });

  it('updates a scenario return', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Central real return'), {
      target: { value: '4.5' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...assumptions,
      returnScenarios: { ...assumptions.returnScenarios, centralRealPct: 4.5 },
    });
  });

  it('updates the state pension amount in pence', () => {
    renderForm();
    const input = screen.getByLabelText('State pension (annual, full)');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12000' } });
    expect(onChange).toHaveBeenCalledWith({
      ...assumptions,
      statePensionAnnualPence: 1_200_000,
    });
  });

  it('updates the target success rate from the slider', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('Target success rate'), {
      target: { value: '85' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...assumptions,
      targetSuccessRatePct: 85,
    });
  });

  it('edits a tax band threshold and rate', () => {
    renderForm();
    const secondThreshold = screen.getAllByLabelText('From income')[1];
    fireEvent.focus(secondThreshold);
    fireEvent.change(secondThreshold, { target: { value: '13000' } });
    expect(onChange).toHaveBeenCalledWith({
      ...assumptions,
      taxBands: [
        assumptions.taxBands[0],
        { thresholdPence: 1_300_000, ratePct: 20 },
        assumptions.taxBands[2],
      ],
    });
    fireEvent.change(screen.getAllByLabelText('Rate')[2], {
      target: { value: '45' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...assumptions,
      taxBands: [
        assumptions.taxBands[0],
        assumptions.taxBands[1],
        { thresholdPence: 5_027_000, ratePct: 45 },
      ],
    });
  });

  it('re-sorts bands ascending on threshold blur', () => {
    const unsorted: HouseholdAssumptions = {
      ...assumptions,
      taxBands: [
        { thresholdPence: 5_027_000, ratePct: 40 },
        { thresholdPence: 0, ratePct: 0 },
      ],
    };
    render(<AssumptionsForm assumptions={unsorted} onChange={onChange} />);
    fireEvent.blur(screen.getAllByLabelText('From income')[0]);
    expect(onChange).toHaveBeenCalledWith({
      ...unsorted,
      taxBands: [
        { thresholdPence: 0, ratePct: 0 },
        { thresholdPence: 5_027_000, ratePct: 40 },
      ],
    });
  });

  it('adds a tax band above the current highest threshold', () => {
    renderForm();
    fireEvent.click(screen.getByText('Add tax band'));
    expect(onChange).toHaveBeenCalledWith({
      ...assumptions,
      taxBands: [
        ...assumptions.taxBands,
        { thresholdPence: 5_127_000, ratePct: 0 },
      ],
    });
  });

  it('removes a tax band', () => {
    renderForm();
    fireEvent.click(screen.getByLabelText('Remove tax band 3'));
    expect(onChange).toHaveBeenCalledWith({
      ...assumptions,
      taxBands: assumptions.taxBands.slice(0, 2),
    });
  });
});
