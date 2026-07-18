'use client';

export const PercentSlider = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix = '%',
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}) => (
  <div className="flex flex-col gap-1 py-2">
    <div className="flex items-center justify-between gap-4">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-zinc-900 dark:text-white"
      >
        {label}
      </label>
      <span className="text-sm font-bold tabular-nums text-zinc-900 dark:text-white">
        {value}
        {suffix}
      </span>
    </div>
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-white/15"
      style={{ accentColor: 'var(--theme-primary)' }}
    />
  </div>
);
