'use client';

import { useThemeColor, ThemeColor } from '../providers/ThemeColorProvider';
import { useState, useEffect, useRef } from 'react';
import { Palette } from 'lucide-react';

const colors = [
  {
    name: 'blue',
    bg: 'bg-blue-500',
    hover: 'hover:bg-blue-600',
    hex: '#3b82f6',
  },
  {
    name: 'red',
    bg: 'bg-red-500',
    hover: 'hover:bg-red-600',
    hex: '#ef4444',
  },
  {
    name: 'green',
    bg: 'bg-green-500',
    hover: 'hover:bg-green-600',
    hex: '#22c55e',
  },
  {
    name: 'purple',
    bg: 'bg-purple-500',
    hover: 'hover:bg-purple-600',
    hex: '#a855f7',
  },
  {
    name: 'amber',
    bg: 'bg-amber-500',
    hover: 'hover:bg-amber-600',
    hex: '#f59e0b',
  },
  {
    name: 'cyan',
    bg: 'bg-cyan-500',
    hover: 'hover:bg-cyan-600',
    hex: '#06b6d4',
  },
  {
    name: 'pink',
    bg: 'bg-pink-500',
    hover: 'hover:bg-pink-600',
    hex: '#ec4899',
  },
  {
    name: 'indigo',
    bg: 'bg-indigo-500',
    hover: 'hover:bg-indigo-600',
    hex: '#6366f1',
  },
  {
    name: 'orange',
    bg: 'bg-orange-500',
    hover: 'hover:bg-orange-600',
    hex: '#f97316',
  },
  {
    name: 'teal',
    bg: 'bg-teal-500',
    hover: 'hover:bg-teal-600',
    hex: '#14b8a6',
  },
  {
    name: 'slate',
    bg: 'bg-slate-500',
    hover: 'hover:bg-slate-600',
    hex: '#64748b',
  },
  {
    name: 'rose',
    bg: 'bg-rose-500',
    hover: 'hover:bg-rose-600',
    hex: '#f43f5e',
  },
  {
    name: 'emerald',
    bg: 'bg-emerald-500',
    hover: 'hover:bg-emerald-600',
    hex: '#10b981',
  },
  {
    name: 'sky',
    bg: 'bg-sky-500',
    hover: 'hover:bg-sky-600',
    hex: '#0ea5e9',
  },
  {
    name: 'violet',
    bg: 'bg-violet-500',
    hover: 'hover:bg-violet-600',
    hex: '#8b5cf6',
  },
  {
    name: 'lime',
    bg: 'bg-lime-500',
    hover: 'hover:bg-lime-600',
    hex: '#84cc16',
  },
  {
    name: 'fuchsia',
    bg: 'bg-fuchsia-500',
    hover: 'hover:bg-fuchsia-600',
    hex: '#d946ef',
  },
  {
    name: 'yellow',
    bg: 'bg-yellow-500',
    hover: 'hover:bg-yellow-600',
    hex: '#eab308',
  },
  {
    name: 'stone',
    bg: 'bg-stone-500',
    hover: 'hover:bg-stone-600',
    hex: '#78716c',
  },
  {
    name: 'zinc',
    bg: 'bg-zinc-500',
    hover: 'hover:bg-zinc-600',
    hex: '#71717a',
  },
];

interface ThemeColorSwitchProps {
  isSubscribed?: boolean;
  onPremiumColorClick?: (colorName: string, onSuccess: () => void) => void;
  showRainbowAnimation?: boolean;
}

const ThemeColorSwitch = ({
  isSubscribed,
  onPremiumColorClick,
  showRainbowAnimation = true,
}: ThemeColorSwitchProps) => {
  const { themeColor, setThemeColor } = useThemeColor();
  const [isOpen, setIsOpen] = useState(false);
  const [showRainbow, setShowRainbow] = useState(false);
  const [rainbowIndex, setRainbowIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentColor = colors.find((c) => c.name === themeColor) || colors[0];

  // Rainbow animation on app load - cycle through theme colors
  useEffect(() => {
    if (!showRainbowAnimation) {
      return;
    }

    let colorIndex = 0;
    let colorInterval: ReturnType<typeof setInterval> | null = null;

    const startAnimation = setTimeout(() => {
      setShowRainbow(true);

      colorInterval = setInterval(() => {
        colorIndex = (colorIndex + 1) % colors.length;
        setRainbowIndex(colorIndex);
      }, 200);

      const stopTimer = setTimeout(() => {
        setShowRainbow(false);
        if (colorInterval) clearInterval(colorInterval);
      }, 3000);

      return () => {
        if (colorInterval) clearInterval(colorInterval);
        clearTimeout(stopTimer);
      };
    }, 0);

    return () => {
      clearTimeout(startAnimation);
      if (colorInterval) clearInterval(colorInterval);
    };
  }, [showRainbowAnimation]);

  // Handle clicks outside to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleColorClick = (colorName: string) => {
    const colorIndex = colors.findIndex((c) => c.name === colorName);

    if (colorIndex < 2 || isSubscribed) {
      // Free colors (first two) or user is subscribed
      setThemeColor(colorName as ThemeColor);
      setIsOpen(false);
    } else if (onPremiumColorClick) {
      // Premium color and user not subscribed - call custom handler
      onPremiumColorClick(colorName, () => {
        setThemeColor(colorName as ThemeColor);
        setIsOpen(false);
      });
    } else {
      // No handler provided, just allow the color change
      setThemeColor(colorName as ThemeColor);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label="Change Theme Color"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md transition-all active:scale-95"
        style={{
          color: showRainbow ? colors[rainbowIndex].hex : currentColor.hex,
        }}
      >
        <Palette className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-stone-200/80 bg-white/95 p-2 shadow-lg shadow-stone-900/10 backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/95 dark:shadow-black/30">
          <div className="flex flex-wrap gap-1.5 p-0.5">
            {colors.map((color, index) => {
              const isPremium = index >= 2 && !isSubscribed;
              return (
                <button
                  key={color.name}
                  onClick={() => handleColorClick(color.name)}
                  className={`relative h-10 w-10 cursor-pointer rounded-lg transition-all hover:scale-105 active:scale-95 ${color.bg} ${color.hover} ${
                    themeColor === color.name
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                      : ''
                  }`}
                  aria-label={`Set theme color to ${color.name}${isPremium ? ' (Premium)' : ''}`}
                ></button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeColorSwitch;
