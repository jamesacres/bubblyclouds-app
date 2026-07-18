'use client';

export type NetWorthMode = 'real' | 'nominal';

export const modeLabel = (mode: NetWorthMode): string =>
  mode === 'real'
    ? "Showing real values (today's money)"
    : 'Showing nominal values (as recorded)';

interface RealNominalToggleProps {
  value: NetWorthMode;
  onChange: (mode: NetWorthMode) => void;
}

const segmentClass = (isActive: boolean): string =>
  `cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 ${
    isActive
      ? 'bg-cyan-500/30 text-white'
      : 'bg-transparent text-white/50 hover:text-white/80'
  }`;

const RealNominalToggle = ({ value, onChange }: RealNominalToggleProps) => {
  return (
    <div data-testid="real-nominal-toggle">
      <div
        role="group"
        aria-label="Value mode"
        className="inline-flex rounded-full border border-white/15 bg-white/5 p-1"
      >
        <button
          type="button"
          aria-pressed={value === 'real'}
          onClick={() => onChange('real')}
          className={segmentClass(value === 'real')}
        >
          Real
        </button>
        <button
          type="button"
          aria-pressed={value === 'nominal'}
          onClick={() => onChange('nominal')}
          className={segmentClass(value === 'nominal')}
        >
          Nominal
        </button>
      </div>
      <p
        data-testid="real-nominal-label"
        className="mt-1.5 text-xs text-white/50"
      >
        {modeLabel(value)}
      </p>
    </div>
  );
};

export default RealNominalToggle;
