'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { SystemBars, SystemBarsStyle } from '@capacitor/core';

interface ThemeSwitchProps {
  isCapacitor?: () => boolean;
}

const ThemeSwitch = ({ isCapacitor = () => false }: ThemeSwitchProps) => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // When mounted on client, now we can show the UI
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isCapacitor()) return;

    const applyStyle = () => {
      const isDark = theme === 'dark' || resolvedTheme === 'dark';
      SystemBars.setStyle({
        style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
      }).catch((error) => {
        console.warn('SystemBars.setStyle failed:', error);
      });
    };

    applyStyle();

    window.addEventListener('resize', applyStyle);
    window.addEventListener('orientationchange', applyStyle);

    return () => {
      window.removeEventListener('resize', applyStyle);
      window.removeEventListener('orientationchange', applyStyle);
    };
  }, [theme, resolvedTheme, isCapacitor]);

  if (!mounted) {
    return null;
  }

  return (
    <button
      aria-label="Toggle Dark Mode"
      onClick={() => {
        const newTheme =
          theme === 'dark' || resolvedTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
      }}
      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-stone-500 transition-all hover:text-stone-700 active:scale-95 dark:text-zinc-400 dark:hover:text-zinc-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-5 w-5"
      >
        {mounted && (theme === 'dark' || resolvedTheme === 'dark') ? (
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        ) : (
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        )}
      </svg>
    </button>
  );
};

export default ThemeSwitch;
