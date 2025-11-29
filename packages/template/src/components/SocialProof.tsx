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
