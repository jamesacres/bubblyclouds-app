import { Calendar, RotateCcw, Droplet, Users, Watch } from 'lucide-react';

export const PREMIUM_FEATURES = [
  {
    icon: <Calendar />,
    title: 'Unlimited play and race',
    description: 'Race friends in real-time more than once a day',
  },
  {
    icon: <Watch />,
    title: 'Multiple racing teams',
    description: 'Host private competitions with friends and family',
  },
  {
    icon: <Users />,
    title: 'Team management',
    description:
      'Create large parties up to 15 people, and remove members from your team.',
  },
  {
    icon: <Droplet />,
    title: 'All themes unlocked',
    description: 'Personalise your racing experience',
  },
  {
    icon: <RotateCcw />,
    title: 'Unlimited undo, check and reveal',
    description: 'Remove daily undo, check and reveal limits',
  },
];
