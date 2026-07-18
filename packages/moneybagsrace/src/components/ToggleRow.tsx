'use client';
import { Toggle } from '@bubblyclouds-app/ui/components/NotesToggle';

export const ToggleRow = ({
  label,
  description,
  isEnabled,
  setEnabled,
}: {
  label: string;
  description?: string;
  isEnabled: boolean;
  setEnabled: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4 py-2">
    <div className="flex flex-col">
      <span className="text-sm font-semibold text-zinc-900 dark:text-white">
        {label}
      </span>
      {description && (
        <span className="text-xs text-zinc-500 dark:text-white/45">
          {description}
        </span>
      )}
    </div>
    <Toggle isEnabled={isEnabled} setEnabled={setEnabled} />
  </div>
);
