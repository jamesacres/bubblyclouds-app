import { ComponentType, ReactNode } from 'react';

export function SectionHead({
  icon: Icon,
  title,
  count,
  action,
}: {
  icon?: ComponentType<{ size?: number; color?: string }>;
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      {Icon && <Icon size={17} color="var(--theme-primary-light)" />}
      <h2 className="m-0 text-base font-bold tracking-tight text-white">
        {title}
      </h2>
      {count != null && (
        <span
          className="inline-flex items-center justify-center rounded-full px-1.5 text-xs font-extrabold"
          style={{
            minWidth: 22,
            height: 22,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {count}
        </span>
      )}
      <div className="flex-1" />
      {action}
    </div>
  );
}
