import {
  Calendar,
  Lightbulb,
  LockOpen,
  RotateCcw,
  Droplet,
  Users,
  Watch,
} from 'lucide-react';
import { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';

export interface PremiumFeature {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}

export function usePremiumFeatures(): PremiumFeature[] {
  const { t } = useTranslation('app');

  return [
    {
      icon: Calendar,
      title: t('premiumFeatures.unlimitedPlay.title'),
      description: t('premiumFeatures.unlimitedPlay.description'),
    },
    {
      icon: Lightbulb,
      title: t('premiumFeatures.unlimitedHints.title'),
      description: t('premiumFeatures.unlimitedHints.description'),
    },
    {
      icon: LockOpen,
      title: t('premiumFeatures.monthlyBook.title'),
      description: t('premiumFeatures.monthlyBook.description'),
    },
    {
      icon: Watch,
      title: t('premiumFeatures.multipleTeams.title'),
      description: t('premiumFeatures.multipleTeams.description'),
    },
    {
      icon: Users,
      title: t('premiumFeatures.teamManagement.title'),
      description: t('premiumFeatures.teamManagement.description'),
    },
    {
      icon: Droplet,
      title: t('premiumFeatures.themes.title'),
      description: t('premiumFeatures.themes.description'),
    },
    {
      icon: RotateCcw,
      title: t('premiumFeatures.unlimitedActions.title'),
      description: t('premiumFeatures.unlimitedActions.description'),
    },
  ];
}
