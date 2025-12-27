'use client';
import { memo } from 'react';

interface TrafficLightProps {
  countdown?: number;
}

const TrafficLight = ({ countdown }: TrafficLightProps) => {
  if (!countdown || countdown <= 0) {
    return null;
  }

  // Calculate which lights should be on based on countdown
  // 4 = no lights, 3 = red, 2 = red+yellow, 1 = green (GO!), 0 = all off
  const showRed = countdown === 3 || countdown === 2;
  const showYellow = countdown === 2;
  const showGreen = countdown === 1;

  return (
    <div className="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transform">
      {/* Traffic light housing - horizontal layout */}
      <div className="flex items-center space-x-1 rounded-lg bg-gray-900 p-2 shadow-lg">
        {/* Red light */}
        <div
          className={`h-4 w-4 rounded-full border-2 transition-all duration-500 ${
            showRed
              ? 'scale-110 animate-pulse border-red-600 bg-red-500 shadow-lg shadow-red-500/70'
              : 'scale-90 border-red-900 bg-red-900/20'
          }`}
        ></div>

        {/* Yellow light */}
        <div
          className={`h-4 w-4 rounded-full border-2 transition-all duration-500 ${
            showYellow
              ? 'scale-110 animate-pulse border-yellow-600 bg-yellow-400 shadow-lg shadow-yellow-400/70'
              : 'scale-90 border-yellow-900 bg-yellow-900/20'
          }`}
        ></div>

        {/* Green light */}
        <div
          className={`h-4 w-4 rounded-full border-2 transition-all duration-500 ${
            showGreen
              ? 'scale-125 animate-bounce border-green-600 bg-green-400 shadow-lg shadow-green-400/70'
              : 'scale-90 border-green-900 bg-green-900/20'
          }`}
        ></div>
      </div>
    </div>
  );
};

const MemoisedTrafficLight = memo(TrafficLight);

export default MemoisedTrafficLight;
