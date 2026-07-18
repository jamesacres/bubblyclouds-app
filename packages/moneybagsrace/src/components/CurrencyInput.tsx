'use client';
import { useState } from 'react';
import { formatPence, parsePoundsToPence } from '../helpers/money';

// Pence-accurate plain text for editing, e.g. 123456 -> '1234.56', 100 -> '1'.
const penceToEditText = (pence: number): string => {
  if (pence % 100 === 0) {
    return String(pence / 100);
  }
  const sign = pence < 0 ? '-' : '';
  const absolute = Math.abs(pence);
  const pounds = Math.floor(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${sign}${pounds}.${fraction}`;
};

export const CurrencyInput = ({
  id,
  label,
  valuePence,
  onChangePence,
  placeholder,
  allowNegative = false,
  onBlur,
}: {
  id: string;
  label: string;
  valuePence: number;
  onChangePence: (valuePence: number) => void;
  placeholder?: string;
  allowNegative?: boolean;
  onBlur?: () => void;
}) => {
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const [isInvalid, setIsInvalid] = useState(false);

  const isEditing = draft !== undefined;

  const handleChange = (text: string) => {
    setDraft(text);
    if (text.trim() === '') {
      setIsInvalid(false);
      onChangePence(0);
      return;
    }
    const pence = parsePoundsToPence(text);
    if (pence === undefined || (pence < 0 && !allowNegative)) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    onChangePence(pence);
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={isEditing ? draft : formatPence(valuePence)}
        aria-invalid={isInvalid}
        onFocus={() => setDraft(penceToEditText(valuePence))}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={() => {
          setDraft(undefined);
          setIsInvalid(false);
          onBlur?.();
        }}
        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-zinc-900 outline-none transition-colors dark:bg-white/5 dark:text-white ${
          isInvalid
            ? 'border-red-500'
            : 'border-zinc-200 focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30'
        }`}
      />
    </div>
  );
};
