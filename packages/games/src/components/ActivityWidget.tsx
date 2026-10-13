'use client';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ServerStateResult } from '@bubblyclouds-app/types/serverTypes';
import { BaseServerState } from '@bubblyclouds-app/template/types/state';
import { calculateActivityStats } from '../helpers/calculateActivityStats';

interface ActivityWidgetProps {
  sessions: ServerStateResult<BaseServerState>[] | undefined;
  variant?: 'light' | 'dark';
  onClick?: () => void;
  action?: ReactNode;
}

const ActivityWidget = ({
  sessions,
  variant = 'light',
  onClick,
  action,
}: ActivityWidgetProps) => {
  const { t } = useTranslation('games');
  const { puzzlesPlayedInThirtyDays, currentStreak, lastSevenDays } =
    calculateActivityStats(sessions);

  const isDark = variant === 'dark';

  const dayLabels = [
    t('activityWidget.days.sunday'),
    t('activityWidget.days.monday'),
    t('activityWidget.days.tuesday'),
    t('activityWidget.days.wednesday'),
    t('activityWidget.days.thursday'),
    t('activityWidget.days.friday'),
    t('activityWidget.days.saturday'),
  ];

  return (
    <div
      className={`flex flex-col gap-1.5${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* 7-day dot row */}
      <div className="flex flex-wrap items-center gap-2">
        {lastSevenDays.map((day, i) => (
          <div key={i} className="flex min-w-8 flex-col items-center gap-1">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                isDark ? 'text-white/40' : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              {dayLabels[day.dayIndex]}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                day.puzzleCount > 0
                  ? isDark
                    ? 'bg-theme-primary text-white'
                    : 'bg-theme-primary text-white'
                  : day.isToday
                    ? isDark
                      ? 'ring-2 ring-white/30 ring-offset-1 ring-offset-transparent'
                      : 'ring-theme-primary ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900'
                    : isDark
                      ? 'bg-white/10'
                      : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
              data-testid={`day-dot-${i}`}
            >
              {day.puzzleCount > 0 && (
                <span className="tabular-nums">
                  {day.puzzleCount > 9 ? '9+' : day.puzzleCount}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Stats row */}
      <div
        className={`mt-3 flex flex-wrap items-center gap-1.5 text-sm ${
          isDark ? 'text-white/40' : 'text-zinc-400 dark:text-zinc-500'
        }`}
      >
        <span data-testid="streak-count">
          <span
            className={`font-bold ${isDark ? 'text-white' : 'text-theme-primary'}`}
          >
            {currentStreak}
          </span>{' '}
          {t('activityWidget.dayStreak', { count: currentStreak })}
        </span>
        <span>·</span>
        <span data-testid="puzzles-count">
          <span
            className={`font-bold ${isDark ? 'text-white' : 'text-theme-primary'}`}
          >
            {puzzlesPlayedInThirtyDays}
          </span>{' '}
          {t('activityWidget.thisMonth')}
        </span>
        {action && <div className="-my-1.5 ms-auto">{action}</div>}
      </div>
    </div>
  );
};

export default ActivityWidget;
