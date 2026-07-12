'use client';

import { useEffect, useState } from 'react';
import { ThemeColor } from '../providers/ThemeColorProvider';

const THEME_COLORS: ThemeColor[] = [
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

const readThemeColor = (): ThemeColor | undefined =>
  THEME_COLORS.find((color) =>
    document.documentElement.classList.contains(`theme-${color}`)
  );

// Resolves the active theme colour name from the `theme-*` class that
// ThemeColorProvider stamps on <html>, without requiring the provider in the
// render tree (boards also render in tests and thumbnails). Watches the class
// attribute so pieces recolour live when the user switches theme mid-game.
// Returns undefined until mounted, matching the theme-less server render.
function useThemeColorName(): ThemeColor | undefined {
  const [themeColor, setThemeColor] = useState<ThemeColor | undefined>(
    undefined
  );

  useEffect(() => {
    // The initial read must happen post-mount (not in a lazy initializer):
    // the server render has no theme class, and reading it during hydration
    // would mismatch. Same pattern as ThemeColorProvider's mount effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeColor(readThemeColor());
    const observer = new MutationObserver(() =>
      setThemeColor(readThemeColor())
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return themeColor;
}

export { useThemeColorName };
