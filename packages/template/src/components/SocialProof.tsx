'use client';
import { useEffect, useState } from 'react';

const motivationalMessages = [
  // Racing & Competition
  'Your friends are waiting for a challenge',
  'Who will you race against today?',
  'Time to show your speed',
  'Challenge accepted?',
  'Race to the finish line',
  "Who's the fastest solver?",
  'Ready to dominate the leaderboard?',
  'Your racing skills await',
  'Time to leave them in the dust',
  'Ready to cross the finish line first?',
  'The track is waiting for you',
  'Time to shift into high gear',
  'Ready to burn rubber on the puzzle grid?',
  'Your opponents are already warming up',

  // Achievement & Progress
  "Today's the day to set a new record",
  'Your personal best is waiting to be beaten',
  'Every puzzle makes you faster',
  'Streak building starts now',
  'Time to level up your game',
  'Your next breakthrough is one puzzle away',
  'Ready to surprise yourself?',
  "Show them what you're made of",
  'Time to unlock your potential',
  'Your fastest solve is still ahead of you',
  'Ready to make today count?',
  'Every second counts in the race',
  'Time to push your limits',
  'Your improvement journey continues',
  'Ready to exceed expectations?',

  // Competitive Spirit
  'Think you can handle the pressure?',
  'Time to silence the doubters',
  'Ready to claim victory?',
  "Your competition won't see this coming",
  'Time to make your mark',
  'Ready to steal the spotlight?',
  'Victory tastes sweeter when earned',
  "Time to prove who's boss",
  'Ready to show your true colors?',
  'The championship mindset starts here',
  'Time to separate yourself from the pack',
  'Ready to write your legend?',
  'Champions are made in moments like this',
  'Time to turn potential into performance',

  // Daily Motivation
  'Fresh puzzles, fresh opportunities',
  "Today's challenge awaits your mastery",
  'Ready to make this your best day yet?',
  'A new day means new records to break',
  'Time to add another win to your collection',
  'Ready to start strong and finish stronger?',
  'Ready to make today legendary?',
  'Your daily dose of triumph awaits',

  // Skill & Strategy
  'Strategy meets speed on the grid',
  'Ready to outthink and outpace?',
  'Your puzzle mastery is calling',
  'Time to blend logic with lightning speed',
  'Ready to solve with surgical precision?',
  'The perfect combination: skill and speed',
  'Your analytical edge is your racing advantage',
  'Time to demonstrate puzzle supremacy',
  'Ready to solve like a champion?',
  'Precision racing starts with clear thinking',
];

export default function SocialProof() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Select a random message when component mounts (app opens)
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    setMessage(motivationalMessages[randomIndex]);

    // Set up interval to change message every 10 seconds
    const interval = setInterval(() => {
      const newRandomIndex = Math.floor(
        Math.random() * motivationalMessages.length
      );
      setMessage(motivationalMessages[newRandomIndex]);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!message) return null;

  return (
    <div className="mb-4 flex justify-center md:mb-6">
      <div className="max-w-md">
        <div className="animate-fade-in text-center">
          <div className="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/15 px-4 py-2 backdrop-blur-sm">
            <div className="flex h-2 w-2 animate-pulse rounded-full bg-yellow-400"></div>
            <span className="text-sm font-medium text-white/90">{message}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
