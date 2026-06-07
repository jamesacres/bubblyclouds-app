const TIER_COLORS: Record<string, { fg: string; bg: string; bd: string }> = {
  novice: {
    fg: '#6ee7b7',
    bg: 'rgba(16,185,129,0.16)',
    bd: 'rgba(52,211,153,0.4)',
  },
  advancedBeginner: {
    fg: '#fcd34d',
    bg: 'rgba(245,158,11,0.16)',
    bd: 'rgba(251,191,36,0.4)',
  },
  competent: {
    fg: '#fdba74',
    bg: 'rgba(249,115,22,0.16)',
    bd: 'rgba(251,146,60,0.42)',
  },
  proficient: {
    fg: '#c4b5fd',
    bg: 'rgba(139,92,246,0.16)',
    bd: 'rgba(167,139,250,0.4)',
  },
  expert: {
    fg: '#f0abfc',
    bg: 'rgba(217,70,239,0.16)',
    bd: 'rgba(232,121,249,0.4)',
  },
};

const TIER_LABELS: Record<string, string> = {
  novice: 'Novice',
  advancedBeginner: 'Beginner',
  competent: 'Competent',
  proficient: 'Proficient',
  expert: 'Expert',
};

export function TierBadge({ skillLevel }: { skillLevel: string }) {
  const c = TIER_COLORS[skillLevel] ?? TIER_COLORS.novice;
  const label = TIER_LABELS[skillLevel] ?? skillLevel;
  return (
    <span
      className="inline-flex items-center rounded-full text-[9px] font-extrabold uppercase tracking-wider"
      style={{
        padding: '4px 8px',
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.bd}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
