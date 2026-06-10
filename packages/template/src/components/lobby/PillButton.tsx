import { ComponentType, ReactNode } from 'react';

export function PillButton({
  icon: Icon,
  children,
  onClick,
  tone = 'theme',
}: {
  icon?: ComponentType<{ size?: number; color?: string }>;
  children: ReactNode;
  onClick?: () => void;
  tone?: 'theme' | 'violet';
}) {
  const themed = tone === 'theme';
  return (
    <button
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full text-xs font-semibold transition-transform active:scale-95"
      style={{
        height: 34,
        padding: '0 14px',
        border: `1px solid ${themed ? 'color-mix(in srgb, var(--theme-primary-light) 40%, transparent)' : 'rgba(167,139,250,0.4)'}`,
        background: themed
          ? 'color-mix(in srgb, var(--theme-primary-light) 14%, transparent)'
          : 'rgba(139,92,246,0.18)',
        color: themed ? 'var(--theme-primary-light)' : '#c4b5fd',
      }}
    >
      {Icon && (
        <Icon
          size={15}
          color={themed ? 'var(--theme-primary-light)' : '#c4b5fd'}
        />
      )}
      {children}
    </button>
  );
}
