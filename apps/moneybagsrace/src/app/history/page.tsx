'use client';
import NetWorthChart, {
  NetWorthChartLayers,
} from '@bubblyclouds-app/moneybagsrace/components/NetWorthChart';
import RealNominalToggle, {
  NetWorthMode,
} from '@bubblyclouds-app/moneybagsrace/components/RealNominalToggle';
import StatCard from '@bubblyclouds-app/moneybagsrace/components/StatCard';
import { currentMonthId } from '@bubblyclouds-app/moneybagsrace/helpers/monthId';
import {
  allTimeChange,
  buildNetWorthSeries,
  monthOnMonthChange,
  twelveMonthChange,
} from '@bubblyclouds-app/moneybagsrace/helpers/networth';
import { useHousehold } from '@bubblyclouds-app/moneybagsrace/hooks/useHousehold';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const LAYER_LABELS: { [key in keyof NetWorthChartLayers]: string } = {
  household: 'Household',
  perMember: 'Per member',
  categories: 'Categories',
  accounts: 'Accounts',
};
const LAYER_KEYS: (keyof NetWorthChartLayers)[] = [
  'household',
  'perMember',
  'categories',
  'accounts',
];

export default function HistoryPage() {
  const { household } = useHousehold();
  const [mode, setMode] = useState<NetWorthMode>('nominal');
  const [layers, setLayers] = useState<NetWorthChartLayers>({
    household: true,
    perMember: false,
    categories: false,
    accounts: false,
  });

  const series = buildNetWorthSeries(
    household,
    mode,
    household.effectiveAssumptions.inflationRatePct
  );
  const latest = series.length > 0 ? series[series.length - 1] : undefined;

  const toggleLayer = (key: keyof NetWorthChartLayers) => {
    setLayers((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  return (
    <div className="min-h-dvh bg-[#030711] px-5 pb-16">
      <div className="container mx-auto max-w-4xl pt-4 md:pt-8">
        <div className="mb-5 flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to dashboard"
            className="liquid-glass flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-all duration-200 hover:text-white active:scale-[0.95]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-white">
            History
          </h1>
        </div>

        {household.orderedMonths.length === 0 ? (
          <div
            data-testid="history-empty"
            className="liquid-glass rounded-3xl p-6 text-center"
          >
            <p className="mb-2 text-xl font-black leading-tight text-white">
              No months yet
            </p>
            <p className="mb-4 text-sm leading-snug text-white/50">
              Enter your first month of balances to start your net-worth
              history.
            </p>
            <Link
              href={`/state?month=${currentMonthId()}`}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white"
              style={{
                background:
                  'linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(6,182,212,0.4) 100%)',
                border: '1px solid rgba(56,189,248,0.4)',
              }}
            >
              Enter your first month
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {LAYER_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={layers[key]}
                    onClick={() => toggleLayer(key)}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                      layers[key]
                        ? 'border-cyan-400/40 bg-cyan-500/30 text-white'
                        : 'border-white/15 bg-white/5 text-white/50 hover:text-white/80'
                    }`}
                  >
                    {LAYER_LABELS[key]}
                  </button>
                ))}
              </div>
              <RealNominalToggle value={mode} onChange={setMode} />
            </div>

            <div className="liquid-glass rounded-3xl p-4 text-white/70">
              <NetWorthChart
                household={household}
                mode={mode}
                layers={layers}
              />
            </div>

            {latest && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <StatCard
                  label="Month on month"
                  valuePence={latest.householdPence}
                  change={monthOnMonthChange(series)}
                />
                <StatCard
                  label="12 months"
                  valuePence={latest.householdPence}
                  change={twelveMonthChange(series)}
                />
                <StatCard
                  label="All time"
                  valuePence={latest.householdPence}
                  change={allTimeChange(series)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
