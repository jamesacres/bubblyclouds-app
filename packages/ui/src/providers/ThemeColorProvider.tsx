'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

type ThemeColor =
  | 'blue'
  | 'red'
  | 'green'
  | 'purple'
  | 'amber'
  | 'cyan'
  | 'pink'
  | 'indigo'
  | 'orange'
  | 'teal'
  | 'slate'
  | 'rose'
  | 'emerald'
  | 'sky'
  | 'violet'
  | 'lime'
  | 'fuchsia'
  | 'yellow'
  | 'stone'
  | 'zinc';

interface ThemeColorContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
}

const ThemeColorContext = createContext<ThemeColorContextType | undefined>(
  undefined
);

export function ThemeColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const [themeColor, setThemeColorState] = useState<ThemeColor>('blue');
  const [mounted, setMounted] = useState(false);

  // Load saved theme color from localStorage
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const savedThemeColor = localStorage.getItem('theme-color');
    if (savedThemeColor && isValidThemeColor(savedThemeColor)) {
      setThemeColorState(savedThemeColor as ThemeColor);
    }
  }, []);

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem('theme-color', color);

    // Remove all existing theme color classes
    const root = document.documentElement;
    root.classList.remove(
      'theme-blue',
      'theme-red',
      'theme-green',
      'theme-purple',
      'theme-amber',
      'theme-cyan',
      'theme-pink',
      'theme-indigo',
      'theme-orange',
      'theme-teal',
      'theme-slate',
      'theme-rose',
      'theme-emerald',
      'theme-sky',
      'theme-violet',
      'theme-lime',
      'theme-fuchsia',
      'theme-yellow',
      'theme-stone',
      'theme-zinc'
    );

    // Add the new theme color class
    root.classList.add(`theme-${color}`);
  };

  // Add theme color class when component mounts or theme changes
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Remove all existing theme color classes
    root.classList.remove(
      'theme-blue',
      'theme-red',
      'theme-green',
      'theme-purple',
      'theme-amber',
      'theme-cyan',
      'theme-pink',
      'theme-indigo',
      'theme-orange',
      'theme-teal',
      'theme-slate',
      'theme-rose',
      'theme-emerald',
      'theme-sky',
      'theme-violet',
      'theme-lime',
      'theme-fuchsia',
      'theme-yellow',
      'theme-stone',
      'theme-zinc'
    );

    root.classList.add(`theme-${themeColor}`);

    return () => {
      root.classList.remove(`theme-${themeColor}`);
    };
  }, [themeColor, mounted, theme]);

  return (
    <ThemeColorContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

// Helper to validate theme color
function isValidThemeColor(color: string): boolean {
  const validColors: ThemeColor[] = [
    'blue',
    'red',
    'green',
    'purple',
    'amber',
    'cyan',
    'pink',
    'indigo',
    'orange',
    'teal',
    'slate',
    'rose',
    'emerald',
    'sky',
    'violet',
    'lime',
    'fuchsia',
    'yellow',
    'stone',
    'zinc',
  ];
  return validColors.includes(color as ThemeColor);
}

export function useThemeColor() {
  const context = useContext(ThemeColorContext);
  if (context === undefined) {
    throw new Error('useThemeColor must be used within a ThemeColorProvider');
  }
  return context;
}
