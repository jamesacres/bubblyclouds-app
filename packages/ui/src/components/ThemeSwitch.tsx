'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { StatusBar, Style } from '@capacitor/status-bar';

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
    if (isCapacitor()) {
      StatusBar.setStyle({
        style:
          theme === 'dark' || resolvedTheme === 'dark'
            ? Style.Dark
            : Style.Light,
      });
    }
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
      className="text-theme-primary dark:text-theme-primary-light mx-1 h-8 w-8 cursor-pointer rounded-full bg-gray-100 p-1.5 transition-colors active:opacity-70 dark:bg-gray-800"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-full w-full"
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
