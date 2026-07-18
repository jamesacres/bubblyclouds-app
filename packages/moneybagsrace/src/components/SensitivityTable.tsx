'use client';
import { monthIdToLabel } from '../helpers/monthId';
import { MonthId } from '../types/monthId';
import { SensitivityResult } from '../types/simulation';

const EM_DASH = '—';

export const sensitivityCellLabel = (month?: MonthId): string =>
  month !== undefined ? monthIdToLabel(month) : EM_DASH;

const headerCellClassName =
  'px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-white/40';
const cellClassName =
  'px-2 py-1.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-white';

interface SensitivityTableProps {
  result: SensitivityResult;
  // Earliest month from the unmodified solver run, for comparison
  baseMonth?: MonthId;
}

// How the earliest retirement date moves when one input is nudged (spec
// §6.3): withdrawal ±£5,000/yr, contributions ±£500/mo
const SensitivityTable = ({ result, baseMonth }: SensitivityTableProps) => (
  <div data-testid="sensitivity-table" className="flex flex-col gap-2">
    <p className="text-sm text-zinc-600 dark:text-white/60">
      Base earliest date:{' '}
      <span
        data-testid="sensitivity-base"
        className="font-semibold text-zinc-900 dark:text-white"
      >
        {sensitivityCellLabel(baseMonth)}
      </span>
    </p>
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-zinc-200 dark:border-white/10">
          <th scope="col" className={headerCellClassName} />
          <th scope="col" className={headerCellClassName}>
            Decrease
          </th>
          <th scope="col" className={headerCellClassName}>
            Increase
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-zinc-100 dark:border-white/5">
          <th
            scope="row"
            className="px-2 py-1.5 text-left text-sm font-semibold text-zinc-600 dark:text-white/60"
          >
            Withdrawal (±£5,000/yr)
          </th>
          <td
            data-testid="sensitivity-withdrawal-minus"
            className={cellClassName}
          >
            {sensitivityCellLabel(result.withdrawalMinus5k)}
          </td>
          <td
            data-testid="sensitivity-withdrawal-plus"
            className={cellClassName}
          >
            {sensitivityCellLabel(result.withdrawalPlus5k)}
          </td>
        </tr>
        <tr>
          <th
            scope="row"
            className="px-2 py-1.5 text-left text-sm font-semibold text-zinc-600 dark:text-white/60"
          >
            Contributions (±£500/mo)
          </th>
          <td
            data-testid="sensitivity-contributions-minus"
            className={cellClassName}
          >
            {sensitivityCellLabel(result.contributionsMinus500)}
          </td>
          <td
            data-testid="sensitivity-contributions-plus"
            className={cellClassName}
          >
            {sensitivityCellLabel(result.contributionsPlus500)}
          </td>
        </tr>
      </tbody>
    </table>
    <p className="text-xs text-zinc-400 dark:text-white/35">
      {EM_DASH} means not achievable within the search window.
    </p>
  </div>
);

export default SensitivityTable;
