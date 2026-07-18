'use client';
import { useEffect, useState } from 'react';

// Tracks the `dark` class on <html> (next-themes attribute="class") so
// recharts tooltips and chart chrome can restyle without a re-mount.
export function useDarkMode(): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setDark(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);
  return dark;
}
