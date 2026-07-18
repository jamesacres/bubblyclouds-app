'use client';
import { Trash2 } from 'lucide-react';
import { WRAPPER_LABELS } from '../helpers/accountLabels';
import { InvestmentWrapper } from '../types/accounts';
import { MonthId } from '../types/monthId';
import { ContributionPlan, ContributionStepChange } from '../types/profile';
import { CurrencyInput } from './CurrencyInput';

export const ContributionsForm = ({
  plan,
  currentMonth,
  onChange,
}: {
  plan: ContributionPlan;
  currentMonth: MonthId;
  onChange: (plan: ContributionPlan) => void;
}) => {
  const setWrapperAmount = (wrapper: InvestmentWrapper, pence: number) => {
    onChange({
      ...plan,
      monthlyPencePerWrapper: {
        ...plan.monthlyPencePerWrapper,
        [wrapper]: pence,
      },
    });
  };

  const setStepChange = (
    index: number,
    update: Partial<ContributionStepChange>
  ) => {
    onChange({
      ...plan,
      stepChanges: plan.stepChanges.map((stepChange, candidate) =>
        candidate === index ? { ...stepChange, ...update } : stepChange
      ),
    });
  };

  const addStepChange = () => {
    onChange({
      ...plan,
      stepChanges: [
        ...plan.stepChanges,
        {
          fromMonth: currentMonth,
          wrapper: InvestmentWrapper.ISA,
          monthlyPence: 0,
        },
      ],
    });
  };

  const removeStepChange = (index: number) => {
    onChange({
      ...plan,
      stepChanges: plan.stepChanges.filter(
        (_stepChange, candidate) => candidate !== index
      ),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.values(InvestmentWrapper).map((wrapper) => (
          <CurrencyInput
            key={wrapper}
            id={`contribution-${wrapper}`}
            label={`${WRAPPER_LABELS[wrapper]} monthly`}
            valuePence={plan.monthlyPencePerWrapper[wrapper] ?? 0}
            onChangePence={(pence) => setWrapperAmount(wrapper, pence)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
          Planned step changes
        </p>
        {plan.stepChanges.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-white/45">
            No step changes planned.
          </p>
        )}
        {plan.stepChanges.map((stepChange, index) => (
          <div
            key={index}
            className="flex flex-wrap items-end gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-white/10"
          >
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`step-from-${index}`}
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
              >
                From month
              </label>
              <input
                id={`step-from-${index}`}
                type="month"
                value={stepChange.fromMonth}
                onChange={(event) =>
                  setStepChange(index, { fromMonth: event.target.value })
                }
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor={`step-wrapper-${index}`}
                className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
              >
                Wrapper
              </label>
              <select
                id={`step-wrapper-${index}`}
                value={stepChange.wrapper}
                onChange={(event) => {
                  const wrapper = Object.values(InvestmentWrapper).find(
                    (candidate) => candidate === event.target.value
                  );
                  if (wrapper) {
                    setStepChange(index, { wrapper });
                  }
                }}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
              >
                {Object.values(InvestmentWrapper).map((wrapper) => (
                  <option key={wrapper} value={wrapper}>
                    {WRAPPER_LABELS[wrapper]}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-32 flex-1">
              <CurrencyInput
                id={`step-amount-${index}`}
                label="Monthly amount"
                valuePence={stepChange.monthlyPence}
                onChangePence={(pence) =>
                  setStepChange(index, { monthlyPence: pence })
                }
              />
            </div>
            <button
              aria-label={`Remove step change ${index + 1}`}
              onClick={() => removeStepChange(index)}
              className="cursor-pointer rounded-lg p-2 text-zinc-500 transition-all duration-200 active:scale-95 dark:text-white/50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={addStepChange}
          className="cursor-pointer self-start rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-all duration-200 active:scale-95 dark:border-white/10 dark:text-white/70"
        >
          Add step change
        </button>
      </div>
    </div>
  );
};
