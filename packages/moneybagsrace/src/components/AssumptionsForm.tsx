'use client';
import { Trash2 } from 'lucide-react';
import { HouseholdAssumptions, TaxBand } from '../types/assumptions';
import { CurrencyInput } from './CurrencyInput';
import { PercentSlider } from './PercentSlider';

const PercentField = ({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label
      htmlFor={id}
      className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
    >
      {label}
    </label>
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={0.1}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (!Number.isNaN(next)) {
            onChange(next);
          }
        }}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
      />
      <span className="text-sm font-semibold text-zinc-500 dark:text-white/50">
        %
      </span>
    </div>
  </div>
);

const sortBands = (bands: TaxBand[]): TaxBand[] =>
  [...bands].sort((a, b) => a.thresholdPence - b.thresholdPence);

export const AssumptionsForm = ({
  assumptions,
  onChange,
}: {
  assumptions: HouseholdAssumptions;
  onChange: (assumptions: HouseholdAssumptions) => void;
}) => {
  const setBand = (index: number, update: Partial<TaxBand>) => {
    onChange({
      ...assumptions,
      taxBands: assumptions.taxBands.map((band, candidate) =>
        candidate === index ? { ...band, ...update } : band
      ),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <PercentField
        id="inflation-rate"
        label="Inflation rate"
        value={assumptions.inflationRatePct}
        onChange={(inflationRatePct) =>
          onChange({ ...assumptions, inflationRatePct })
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PercentField
          id="return-lower"
          label="Lower real return"
          value={assumptions.returnScenarios.lowerRealPct}
          onChange={(lowerRealPct) =>
            onChange({
              ...assumptions,
              returnScenarios: {
                ...assumptions.returnScenarios,
                lowerRealPct,
              },
            })
          }
        />
        <PercentField
          id="return-central"
          label="Central real return"
          value={assumptions.returnScenarios.centralRealPct}
          onChange={(centralRealPct) =>
            onChange({
              ...assumptions,
              returnScenarios: {
                ...assumptions.returnScenarios,
                centralRealPct,
              },
            })
          }
        />
        <PercentField
          id="return-upper"
          label="Upper real return"
          value={assumptions.returnScenarios.upperRealPct}
          onChange={(upperRealPct) =>
            onChange({
              ...assumptions,
              returnScenarios: {
                ...assumptions.returnScenarios,
                upperRealPct,
              },
            })
          }
        />
      </div>

      <CurrencyInput
        id="state-pension-annual"
        label="State pension (annual, full)"
        valuePence={assumptions.statePensionAnnualPence}
        onChangePence={(statePensionAnnualPence) =>
          onChange({ ...assumptions, statePensionAnnualPence })
        }
      />

      <PercentSlider
        id="target-success-rate"
        label="Target success rate"
        value={assumptions.targetSuccessRatePct}
        onChange={(targetSuccessRatePct) =>
          onChange({ ...assumptions, targetSuccessRatePct })
        }
        min={50}
        max={100}
        step={1}
      />

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40">
          Tax bands (annual income)
        </p>
        {assumptions.taxBands.map((band, index) => (
          <div
            key={index}
            className="flex flex-wrap items-end gap-2 rounded-2xl border border-zinc-200 p-3 dark:border-white/10"
          >
            <div className="min-w-32 flex-1">
              <CurrencyInput
                id={`tax-band-threshold-${index}`}
                label="From income"
                valuePence={band.thresholdPence}
                onChangePence={(thresholdPence) =>
                  setBand(index, { thresholdPence })
                }
                onBlur={() =>
                  onChange({
                    ...assumptions,
                    taxBands: sortBands(assumptions.taxBands),
                  })
                }
              />
            </div>
            <div className="w-28">
              <PercentField
                id={`tax-band-rate-${index}`}
                label="Rate"
                value={band.ratePct}
                onChange={(ratePct) => setBand(index, { ratePct })}
              />
            </div>
            <button
              aria-label={`Remove tax band ${index + 1}`}
              onClick={() =>
                onChange({
                  ...assumptions,
                  taxBands: assumptions.taxBands.filter(
                    (_band, candidate) => candidate !== index
                  ),
                })
              }
              className="cursor-pointer rounded-lg p-2 text-zinc-500 transition-all duration-200 active:scale-95 dark:text-white/50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => {
            const highest = assumptions.taxBands.reduce(
              (maximum, band) => Math.max(maximum, band.thresholdPence),
              0
            );
            onChange({
              ...assumptions,
              taxBands: sortBands([
                ...assumptions.taxBands,
                { thresholdPence: highest + 100_000, ratePct: 0 },
              ]),
            });
          }}
          className="cursor-pointer self-start rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-all duration-200 active:scale-95 dark:border-white/10 dark:text-white/70"
        >
          Add tax band
        </button>
      </div>
    </div>
  );
};
