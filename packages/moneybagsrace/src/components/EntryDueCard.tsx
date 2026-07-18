'use client';
import Link from 'next/link';
import { NotebookPen } from 'lucide-react';
import { monthIdToLabel } from '../helpers/monthId';
import { MonthId } from '../types/monthId';

interface EntryDueCardProps {
  month: MonthId;
  doneNicknames: string[];
  outstandingNicknames: string[];
}

const EntryDueCard = ({
  month,
  doneNicknames,
  outstandingNicknames,
}: EntryDueCardProps) => {
  return (
    <Link
      href={`/state?month=${month}`}
      data-testid="entry-due-card"
      className="block rounded-3xl p-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.97]"
      style={{
        background:
          'linear-gradient(155deg, rgba(30,64,175,0.5) 0%, rgba(4,12,30,0.92) 65%)',
        border: '1px solid rgba(59,130,246,0.35)',
        boxShadow:
          '0 0 32px rgba(59,130,246,0.25), 0 8px 24px rgba(2,6,23,0.6)',
      }}
    >
      <p className="font-orbitron mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
        Entry due
      </p>
      <p className="mb-1 text-xl font-black leading-tight text-white">
        {monthIdToLabel(month)}
      </p>
      {doneNicknames.length > 0 && (
        <p className="text-xs leading-snug text-emerald-400">
          Done: {doneNicknames.join(', ')}
        </p>
      )}
      {outstandingNicknames.length > 0 && (
        <p className="text-xs leading-snug text-white/50">
          Waiting on: {outstandingNicknames.join(', ')}
        </p>
      )}
      <span
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white"
        style={{
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.5) 0%, rgba(6,182,212,0.4) 100%)',
          border: '1px solid rgba(56,189,248,0.4)',
        }}
      >
        <NotebookPen className="h-3.5 w-3.5" />
        Enter balances
      </span>
    </Link>
  );
};

export default EntryDueCard;
