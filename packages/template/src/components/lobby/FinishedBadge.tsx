import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function FinishedBadge() {
  const { t } = useTranslation('template');
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11.5px] font-bold"
      style={{
        color: '#6ee7b7',
        background: 'rgba(16,185,129,0.16)',
        border: '1px solid rgba(52,211,153,0.4)',
      }}
    >
      <Check size={12} color="#6ee7b7" />
      {t('lobby.finished')}
    </span>
  );
}
