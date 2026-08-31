'use client';

import {
  ThemeColor,
  useThemeColorOptional,
} from '../providers/ThemeColorProvider';

// Resolves the active theme colour name from ThemeColorProvider's context.
// Returns undefined outside a provider (tests/thumbnails render boards
// standalone) or until the provider has mounted, matching the theme-less
// server render.
function useThemeColorName(): ThemeColor | undefined {
  const context = useThemeColorOptional();
  return context?.mounted ? context.themeColor : undefined;
}

export { useThemeColorName };
