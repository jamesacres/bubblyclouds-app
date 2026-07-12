import {
  Droplet,
  Lightbulb,
  LockOpen,
  Undo2,
  Users,
  Watch,
} from 'lucide-react';
import { ComponentType } from 'react';

export interface PremiumFeature {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    icon: Lightbulb,
    title: 'Unlimited hints',
    description: 'Never get stuck — get a hint whenever you need one',
  },
  {
    icon: LockOpen,
    title: 'Entire monthly pack unlocked, every month',
    description: 'Play every puzzle in every difficulty, no locks',
  },
  {
    icon: Undo2,
    title: 'Unlimited undos',
    description: 'Rewind as many moves as you like',
  },
  {
    icon: Watch,
    title: 'Multiple racing teams',
    description: 'Host private competitions with friends and family',
  },
  {
    icon: Users,
    title: 'Team management',
    description:
      'Create large parties up to 15 people, and remove members from your team.',
  },
  {
    icon: Droplet,
    title: 'All themes unlocked',
    description: 'Personalise your racing experience',
  },
];
