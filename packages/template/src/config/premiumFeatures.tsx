import { Calendar, RotateCcw, Droplet, Users, Watch } from 'react-feather';

export const PREMIUM_FEATURES = [
  {
    icon: <Calendar className="h-6 w-6" />,
    title: '🏁 Unlimited play and race',
    description: 'Race friends in real-time more than once a day',
  },
  {
    icon: <Watch className="h-6 w-6" />,
    title: 'Create and join multiple racing teams',
    description: 'Host private competitions with friends and family',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Racing team management',
    description:
      'Create large parties up to 15 people, and remove members from your team.',
  },
  {
    icon: <Droplet className="h-6 w-6" />,
    title: 'All themes unlocked',
    description: 'Personalise your racing experience',
  },
  {
    icon: <RotateCcw className="h-6 w-6" />,
    title: 'Unlimited undo, check and reveal',
    description: 'Remove daily undo, check and reveal limits',
  },
];
