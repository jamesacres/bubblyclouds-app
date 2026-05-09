'use client';
import { useEffect, useState } from 'react';

interface SocialProofProps {
  motivationalMessages: string[];
}

export default function SocialProof({
  motivationalMessages,
}: SocialProofProps) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Select a random message when component mounts (app opens)
    const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessage(motivationalMessages[randomIndex]);

    // Set up interval to change message every 10 seconds
    const interval = setInterval(() => {
      const newRandomIndex = Math.floor(
        Math.random() * motivationalMessages.length
      );
      setMessage(motivationalMessages[newRandomIndex]);
    }, 10000);

    return () => clearInterval(interval);
  }, [motivationalMessages]);

  if (!message) return null;

  return (
    <div className="flex justify-start">
      <div className="animate-fade-in">
        <div className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/15 px-3 py-2">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300"></div>
          <span className="text-xs font-medium text-white/80">{message}</span>
        </div>
      </div>
    </div>
  );
}
