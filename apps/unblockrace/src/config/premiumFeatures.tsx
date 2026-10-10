import {
  Droplet,
  Lightbulb,
  LockOpen,
  Sparkles,
  Undo2,
  Users,
  Watch,
} from 'lucide-react';
import { ComponentType } from 'react';
import { Translate } from '@bubblyclouds-app/template/types/i18n';

export interface PremiumFeature {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}

export const getPremiumFeatures = (t: Translate): PremiumFeature[] => [
  {
    icon: Sparkles,
    title: t('premiumFeatures.adFree.title'),
    description: t('premiumFeatures.adFree.description'),
  },
  {
    icon: Lightbulb,
    title: t('premiumFeatures.hints.title'),
    description: t('premiumFeatures.hints.description'),
  },
  {
    icon: LockOpen,
    title: t('premiumFeatures.monthlyPack.title'),
    description: t('premiumFeatures.monthlyPack.description'),
  },
  {
    icon: Undo2,
    title: t('premiumFeatures.undos.title'),
    description: t('premiumFeatures.undos.description'),
  },
  {
    icon: Watch,
    title: t('premiumFeatures.teams.title'),
    description: t('premiumFeatures.teams.description'),
  },
  {
    icon: Users,
    title: t('premiumFeatures.management.title'),
    description: t('premiumFeatures.management.description'),
  },
  {
    icon: Droplet,
    title: t('premiumFeatures.themes.title'),
    description: t('premiumFeatures.themes.description'),
  },
];
