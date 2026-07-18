import { fireEvent, render, screen } from '@testing-library/react';
import { InvestmentWrapper } from '../types/accounts';
import { ContributionPlan } from '../types/profile';
import { ContributionsForm } from './ContributionsForm';

describe('ContributionsForm', () => {
  const onChange = jest.fn();
  const plan: ContributionPlan = {
    monthlyPencePerWrapper: { [InvestmentWrapper.SIPP]: 50_000 },
    stepChanges: [
      {
        fromMonth: '2028-01',
        wrapper: InvestmentWrapper.ISA,
        monthlyPence: 20_000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderForm = (currentPlan: ContributionPlan = plan) =>
    render(
      <ContributionsForm
        plan={currentPlan}
        currentMonth="2026-07"
        onChange={onChange}
      />
    );

  it('renders a monthly input per wrapper with existing values', () => {
    renderForm();
    expect(screen.getByLabelText('SIPP monthly')).toHaveValue('£500.00');
    expect(screen.getByLabelText('ISA monthly')).toHaveValue('£0.00');
    expect(screen.getByLabelText('Company pension monthly')).toHaveValue(
      '£0.00'
    );
  });

  it('updates a wrapper contribution', () => {
    renderForm();
    const input = screen.getByLabelText('ISA monthly');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '250' } });
    expect(onChange).toHaveBeenCalledWith({
      ...plan,
      monthlyPencePerWrapper: {
        ...plan.monthlyPencePerWrapper,
        [InvestmentWrapper.ISA]: 25_000,
      },
    });
  });

  it('renders existing step changes', () => {
    renderForm();
    expect(screen.getByLabelText('From month')).toHaveValue('2028-01');
    expect(screen.getByLabelText('Wrapper')).toHaveValue(InvestmentWrapper.ISA);
    expect(screen.getByLabelText('Monthly amount')).toHaveValue('£200.00');
  });

  it('adds a step change defaulting to the current month', () => {
    renderForm();
    fireEvent.click(screen.getByText('Add step change'));
    expect(onChange).toHaveBeenCalledWith({
      ...plan,
      stepChanges: [
        ...plan.stepChanges,
        {
          fromMonth: '2026-07',
          wrapper: InvestmentWrapper.ISA,
          monthlyPence: 0,
        },
      ],
    });
  });

  it('edits a step change month and wrapper', () => {
    renderForm();
    fireEvent.change(screen.getByLabelText('From month'), {
      target: { value: '2029-06' },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...plan,
      stepChanges: [{ ...plan.stepChanges[0], fromMonth: '2029-06' }],
    });
    fireEvent.change(screen.getByLabelText('Wrapper'), {
      target: { value: InvestmentWrapper.SIPP },
    });
    expect(onChange).toHaveBeenCalledWith({
      ...plan,
      stepChanges: [
        { ...plan.stepChanges[0], wrapper: InvestmentWrapper.SIPP },
      ],
    });
  });

  it('removes a step change', () => {
    renderForm();
    fireEvent.click(screen.getByLabelText('Remove step change 1'));
    expect(onChange).toHaveBeenCalledWith({ ...plan, stepChanges: [] });
  });

  it('shows an empty state without step changes', () => {
    renderForm({ monthlyPencePerWrapper: {}, stepChanges: [] });
    expect(screen.getByText('No step changes planned.')).toBeInTheDocument();
  });
});
